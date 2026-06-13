import { useState, useEffect, useRef, useCallback } from 'react'
import type { CockpitState, ViewId, StepStatus, RunbookStep, ChatMessage, ChatCitation, ChatAst } from './types'
import { SEED_LOGS, LOG_TAIL_SAMPLES } from './data'

function makeSteps(states: StepStatus[]): RunbookStep[] {
  const texts = [
    'Check Redis memory usage — alert threshold > 85%',
    'kubectl rollout restart deployment/redis-cache',
    'Confirm payment-svc error rate drops within 90 seconds',
  ]
  return texts.map((text, i) => ({ n: i + 1, text, status: states[i] }))
}

const INITIAL_MESSAGE: ChatMessage = {
  role: 'assistant',
  full: "I'm watching INC-2291. payment-svc error rate jumped to 12.4/s at 02:34 — I've already traced a high-confidence causal path back to redis-cache.\n\nAsk me \"why did payment-svc fail?\", or type /runbooks to see what resolved this last time.",
  shown: '',
  done: true,
  cites: [],
  ast: null,
  runbook: false,
}

const INITIAL_STATE: CockpitState = {
  view: 'command',
  compareMode: false,
  compareLayout: 'overlay',
  compareA: 'baseline',
  compareB: 'now',
  showExport: false,
  copied: false,
  selectedAnomaly: 'redis-mem',
  logs: SEED_LOGS.slice(),
  tailing: true,
  query: '',
  sevFilter: 'all',
  svcFilter: 'all',
  selectedNode: 'payment-svc',
  confThreshold: 0.5,
  scrub: 100,
  mttr: 247,
  resolved: false,
  runbookSteps: makeSteps(['idle', 'idle', 'idle']),
  applying: false,
  edgeConfirmed: false,
  eventsJitter: 124.2,
  messages: [INITIAL_MESSAGE],
  slashOpen: false,
  draft: '',
}

function respond(text: string): {
  text: string
  cites?: ChatCitation[]
  ast?: ChatAst
  runbook?: boolean
  switchTo?: ViewId
} {
  const q = text.toLowerCase()
  if (q.startsWith('/resolve')) {
    return { text: "Incident INC-2291 marked resolved. Capturing this conversation into a runbook entry — embedding the symptom fingerprint and the redis-cache → payment-svc subgraph. I'll validate effectiveness over the next 30 minutes before promoting it.", cites: [] }
  }
  if (q.startsWith('/graph')) {
    return { text: 'Opening the causal graph at redis-cache → payment-svc.', switchTo: 'graph' }
  }
  if (q.includes('/runbook') || q.includes('runbook')) {
    return { text: "I found a runbook with a 0.91 fingerprint match — it's resolved this exact symptom 7 times before.", runbook: true, cites: [] }
  }
  if (q.includes('/anomal') || q.includes('anomal')) {
    return {
      text: '5 active anomalies. The critical one: redis-cache memory_usage crossed 2σ above its 7-day baseline 14 minutes ago, right after deploy v2.1.0 — the forecast projects OOM in ~6 minutes. Opening the anomaly surface.',
      switchTo: 'anomalies',
      cites: [{ label: 'redis-cache → payment-svc · 0.91', kind: 'graph' }],
    }
  }
  if (q.includes('show') || q.includes('find') || q.includes('list') || q.includes('logs') || (q.includes('error') && q.includes('redis'))) {
    return {
      text: 'Compiled your question into a typed LogQL+ query. Review the AST before running — the LLM never produces raw query strings.',
      ast: {
        type: 'LOG_SEARCH',
        filters: ['service = "payment-svc"', 'severity >= ERROR', 'message contains "timeout"', 'timestamp WITHIN 5min OF (event DEPLOYMENT redis-cache)'],
        timeRange: 'yesterday',
        limit: 100,
      },
      cites: [],
    }
  }
  return {
    text: 'payment-svc is failing because redis-cache is under memory pressure. Deployment redis-cache@v2.1.0, 14 minutes ago, changed the maxmemory-policy; Redis hit its 4 GB cap and began refusing writes (OOM), which exhausted payment-svc\'s connection pool.\n\nGranger causality confirms redis-cache → payment-svc at confidence 0.91 (p = 0.003).',
    cites: [{ label: 'payment-svc:4421', kind: 'log' }, { label: 'redis-cache → payment-svc · 0.91', kind: 'graph' }],
    runbook: true,
  }
}

export function useCockpit() {
  const [state, setState] = useState<CockpitState>(INITIAL_STATE)
  const streamTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const stepTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // init first message shown text
  useEffect(() => {
    setState(s => ({
      ...s,
      messages: s.messages.map(m => (m.shown === '' && m.done ? { ...m, shown: m.full } : m)),
    }))
  }, [])

  // MTTR + events/sec ticker
  useEffect(() => {
    const tick = setInterval(() => {
      setState(s => ({
        ...s,
        mttr: s.resolved ? s.mttr : s.mttr + 1,
        eventsJitter: +(120 + Math.random() * 9).toFixed(1),
      }))
    }, 1000)
    return () => clearInterval(tick)
  }, [])

  // live log tail
  useEffect(() => {
    const tail = setInterval(() => {
      setState(s => {
        if (!s.tailing) return s
        const pick = LOG_TAIL_SAMPLES[Math.floor(Math.random() * LOG_TAIL_SAMPLES.length)]
        const d = new Date()
        const pad = (n: number, l: number) => String(n).padStart(l, '0')
        const t = `${pad(d.getHours(), 2)}:${pad(d.getMinutes(), 2)}:${pad(d.getSeconds(), 2)}.${pad(d.getMilliseconds(), 3)}`
        return { ...s, logs: [{ ...pick, t }, ...s.logs].slice(0, 90) }
      })
    }, 1500)
    return () => clearInterval(tail)
  }, [])

  const startStream = useCallback(() => {
    if (streamTimerRef.current) clearInterval(streamTimerRef.current)
    streamTimerRef.current = setInterval(() => {
      setState(s => {
        const msgs = [...s.messages]
        const last = msgs[msgs.length - 1]
        if (!last || last.done) {
          if (streamTimerRef.current) clearInterval(streamTimerRef.current)
          return s
        }
        if (last.shown.length >= last.full.length) {
          msgs[msgs.length - 1] = { ...last, done: true }
          if (streamTimerRef.current) clearInterval(streamTimerRef.current)
          return { ...s, messages: msgs }
        }
        msgs[msgs.length - 1] = { ...last, shown: last.full.slice(0, last.shown.length + 3) }
        return { ...s, messages: msgs }
      })
    }, 16)
  }, [])

  const send = useCallback((text: string) => {
    const trimmed = text.trim()
    if (!trimmed) return
    const resp = respond(trimmed)
    const userMsg: ChatMessage = { role: 'user', full: trimmed, shown: trimmed, done: true, cites: [], ast: null, runbook: false }
    const aiMsg: ChatMessage = {
      role: 'assistant', full: resp.text, shown: '', done: false,
      cites: resp.cites ?? [],
      ast: resp.ast ?? null,
      runbook: !!resp.runbook,
    }
    setState(s => ({
      ...s,
      messages: [...s.messages, userMsg, aiMsg],
      draft: '',
      slashOpen: false,
      view: resp.switchTo ?? 'chat',
    }))
    setTimeout(startStream, 0)
  }, [startStream])

  const applyRunbook = useCallback(() => {
    setState(s => {
      if (s.applying || s.resolved) return s
      return { ...s, applying: true }
    })
    const run = (i: number) => {
      setState(s => {
        const states: StepStatus[] = ['idle', 'idle', 'idle']
        for (let k = 0; k < i; k++) states[k] = 'done'
        if (i < 3) {
          states[i] = 'running'
          return { ...s, runbookSteps: makeSteps(states) }
        }
        return { ...s, runbookSteps: makeSteps(['done', 'done', 'done']), resolved: true, applying: false }
      })
      if (i < 3) stepTimerRef.current = setTimeout(() => run(i + 1), 1100)
    }
    run(0)
  }, [])

  const onCitation = useCallback((c: ChatCitation) => {
    if (c.kind === 'log') setState(s => ({ ...s, view: 'logs', svcFilter: 'payment-svc', sevFilter: 'error' }))
    else if (c.kind === 'graph') setState(s => ({ ...s, view: 'graph', selectedNode: 'redis-cache' }))
  }, [])

  const runQuery = useCallback(() => {
    setState(s => ({ ...s, view: 'logs', svcFilter: 'payment-svc', sevFilter: 'error' }))
  }, [])

  const setView = useCallback((v: ViewId) => setState(s => ({ ...s, view: v, slashOpen: false })), [])
  const toggleTail = useCallback(() => setState(s => ({ ...s, tailing: !s.tailing })), [])
  const setQuery = useCallback((q: string) => setState(s => ({ ...s, query: q })), [])
  const setSevFilter = useCallback((f: CockpitState['sevFilter']) => setState(s => ({ ...s, sevFilter: f })), [])
  const setSvcFilter = useCallback((f: string) => setState(s => ({ ...s, svcFilter: f })), [])
  const selectNode = useCallback((id: string) => setState(s => ({ ...s, selectedNode: id })), [])
  const setThreshold = useCallback((v: number) => setState(s => ({ ...s, confThreshold: v })), [])
  const setScrub = useCallback((v: number) => setState(s => ({ ...s, scrub: v })), [])
  const confirmEdge = useCallback(() => setState(s => ({ ...s, edgeConfirmed: true })), [])
  const toggleCompare = useCallback(() => setState(s => ({ ...s, compareMode: !s.compareMode, showExport: false })), [])
  const setCompareLayout = useCallback((l: CockpitState['compareLayout']) => setState(s => ({ ...s, compareLayout: l })), [])
  const setCompareA = useCallback((v: string) => setState(s => ({ ...s, compareA: v })), [])
  const setCompareB = useCallback((v: string) => setState(s => ({ ...s, compareB: v })), [])
  const openExport = useCallback(() => setState(s => ({ ...s, showExport: true })), [])
  const closeExport = useCallback(() => setState(s => ({ ...s, showExport: false })), [])
  const copyExport = useCallback((md: string) => {
    try { navigator.clipboard.writeText(md) } catch (_) { /* ignore */ }
    setState(s => ({ ...s, copied: true }))
    setTimeout(() => setState(s => ({ ...s, copied: false })), 1500)
  }, [])
  const selectAnomaly = useCallback((id: string) => setState(s => ({ ...s, selectedAnomaly: id })), [])
  const setDraft = useCallback((v: string) => setState(s => ({ ...s, draft: v, slashOpen: v.trim().startsWith('/') })), [])

  return {
    state,
    actions: {
      setView, toggleTail, setQuery, setSevFilter, setSvcFilter,
      selectNode, setThreshold, setScrub, confirmEdge,
      toggleCompare, setCompareLayout, setCompareA, setCompareB,
      openExport, closeExport, copyExport, selectAnomaly,
      setDraft, send, applyRunbook, onCitation, runQuery,
    },
  }
}
