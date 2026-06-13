import { useEffect, useRef } from 'react'
import type { CockpitState, ChatMessage, ChatCitation } from '../types'
import { LIBRARY } from '../data'

interface Props {
  state: CockpitState
  onSend: (text: string) => void
  onSetDraft: (v: string) => void
  onCitation: (c: ChatCitation) => void
  onRunQuery: () => void
  onGoCommand: () => void
}

function MessageBubble({ m, onCitation, onRunQuery, onGoCommand }: { m: ChatMessage; onCitation: (c: ChatCitation) => void; onRunQuery: () => void; onGoCommand: () => void }) {
  const isUser = m.role === 'user'
  const hasCites = m.cites.length > 0 && m.done
  return (
    <div className="anim-fadeUp" style={{ display: 'flex', gap: 13, flexDirection: isUser ? 'row-reverse' : 'row', alignItems: 'flex-start' }}>
      <div style={{ flexShrink: 0, width: 30, height: 30, borderRadius: 9, background: isUser ? '#1c2533' : 'linear-gradient(135deg,#0e7c7b,#0a4f4e)', border: `1px solid ${isUser ? '#2a3547' : 'rgba(45,212,191,.3)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: isUser ? '#9aa7b8' : '#fff' }}>
        {isUser ? 'DK' : 'LI'}
      </div>
      <div style={{ maxWidth: '80%', minWidth: 0 }}>
        <div style={{ background: isUser ? '#151c27' : '#0d1117', border: `1px solid ${isUser ? '#2a3547' : '#1d2532'}`, borderRadius: 13, padding: '13px 16px' }}>
          <div style={{ fontSize: 13, color: '#dbe2ec', lineHeight: 1.65, whiteSpace: 'pre-wrap' }}>
            {m.shown}
            {!isUser && !m.done && (
              <span className="anim-caret" style={{ display: 'inline-block', width: 7, height: 14, background: '#2dd4bf', marginLeft: 2, verticalAlign: 'middle' }} />
            )}
          </div>
          {hasCites && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7, marginTop: 11 }}>
              {m.cites.map((c, i) => (
                <button key={i} onClick={() => onCitation(c)} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10.5, color: c.kind === 'graph' ? '#ff8a8a' : '#9fd0ff', background: c.kind === 'graph' ? 'rgba(255,92,92,.08)' : 'rgba(91,157,255,.08)', border: `1px solid ${c.kind === 'graph' ? 'rgba(255,92,92,.25)' : 'rgba(91,157,255,.25)'}`, borderRadius: 7, padding: '4px 9px', cursor: 'pointer' }}>
                  {c.kind === 'graph' ? '◈' : '❯'} {c.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* LogQL+ AST card */}
        {m.ast && m.done && (
          <div style={{ marginTop: 11, background: '#0a0e14', border: '1px solid #232c3b', borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '11px 15px', borderBottom: '1px solid #1a212e' }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#2dd4bf' }}>COMPILED · LogQL+ AST</span>
              <span style={{ marginLeft: 'auto', fontSize: 9.5, color: '#39d98a' }}>✓ schema valid</span>
            </div>
            <div style={{ padding: '13px 15px', fontSize: 11.5, lineHeight: 1.9 }}>
              <div><span style={{ color: '#5e6b7e' }}>type</span>{'  '}<span style={{ color: '#a78bfa' }}>{m.ast.type}</span></div>
              <div style={{ color: '#5e6b7e', marginTop: 4 }}>filters</div>
              {m.ast.filters.map((f, i) => <div key={i} style={{ paddingLeft: 14, color: '#9fd0ff' }}>• {f}</div>)}
              <div style={{ marginTop: 4 }}>
                <span style={{ color: '#5e6b7e' }}>timeRange</span>{'  '}
                <span style={{ color: '#9fd0ff' }}>{m.ast.timeRange}</span>
                {' '}<span style={{ color: '#5e6b7e' }}>· limit</span>{' '}
                <span style={{ color: '#9fd0ff' }}>{m.ast.limit}</span>
              </div>
            </div>
            <div style={{ padding: '11px 15px', borderTop: '1px solid #1a212e', display: 'flex', gap: 9 }}>
              <button onClick={onRunQuery} style={{ fontSize: 11, color: '#0a0e14', background: '#2dd4bf', border: 'none', borderRadius: 7, padding: '7px 14px', cursor: 'pointer', fontWeight: 600 }}>Run query</button>
              <button style={{ fontSize: 11, color: '#9aa7b8', background: '#151c27', border: '1px solid #2a3547', borderRadius: 7, padding: '7px 14px', cursor: 'pointer' }}>Edit LogQL+</button>
            </div>
          </div>
        )}

        {/* Runbook card */}
        {m.runbook && m.done && (
          <div style={{ marginTop: 11, background: 'linear-gradient(165deg,#101720,#0d1117)', border: '1px solid #2a3547', borderRadius: 12, padding: 15 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 9 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#2dd4bf' }}>RUNBOOK MATCH</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>rb_a3f9c2</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#39d98a', border: '1px solid rgba(57,217,138,.25)', borderRadius: 5, padding: '2px 7px' }}>0.91</span>
            </div>
            <div style={{ fontSize: 10.5, color: '#5e6b7e', marginBottom: 11 }}>used 7× · resolves payment-svc + redis-cache in ~3 min</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 13 }}>
              <div style={{ fontSize: 11.5, color: '#b3bdcc' }}>1 · Check Redis memory usage (alert &gt; 85%)</div>
              <div style={{ fontSize: 11.5, color: '#b3bdcc' }}>2 · kubectl rollout restart deployment/redis-cache</div>
              <div style={{ fontSize: 11.5, color: '#b3bdcc' }}>3 · Confirm payment-svc error rate drops in 90s</div>
            </div>
            <button onClick={onGoCommand} style={{ fontSize: 11.5, color: '#0a0e14', background: '#2dd4bf', border: 'none', borderRadius: 8, padding: '8px 15px', cursor: 'pointer', fontWeight: 600 }}>Apply runbook</button>
          </div>
        )}
      </div>
    </div>
  )
}

const SLASH_ITEMS = [
  { cmd: '/graph',     desc: 'open the causal graph for a service' },
  { cmd: '/anomalies', desc: 'list active anomalies in the last hour' },
  { cmd: '/runbooks',  desc: 'surface matching runbooks' },
  { cmd: '/resolve',   desc: 'mark incident resolved & capture runbook' },
]

const SUGGESTIONS = [
  { label: 'Why did payment-svc start failing?', text: 'Why did payment-svc start failing?' },
  { label: 'Show ERROR logs near the redis deploy', text: 'show error logs in payment-svc near the redis deploy' },
  { label: '/runbooks', text: '/runbooks' },
  { label: '/resolve', text: '/resolve' },
]

export function ChatView({ state, onSend, onSetDraft, onCitation, onRunQuery, onGoCommand }: Props) {
  const { messages, draft, slashOpen } = state
  const threadRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight
    }
  }, [messages])

  const library = LIBRARY.map(q => ({ ...q, onClick: () => onSend('show ' + q.label) }))

  return (
    <div style={{ height: '100%', display: 'flex', minHeight: 0 }}>
      {/* main chat col */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* thread */}
        <div ref={threadRef} style={{ flex: 1, overflowY: 'auto', padding: '24px 30px', minHeight: 0 }}>
          <div style={{ maxWidth: 760, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 18 }}>
            {messages.map((m, i) => (
              <MessageBubble key={i} m={m} onCitation={onCitation} onRunQuery={onRunQuery} onGoCommand={onGoCommand} />
            ))}
          </div>
        </div>

        {/* input */}
        <div style={{ flexShrink: 0, borderTop: '1px solid #1a212e', padding: '14px 30px 18px' }}>
          <div style={{ maxWidth: 760, margin: '0 auto' }}>
            <div style={{ display: 'flex', gap: 7, marginBottom: 10, flexWrap: 'wrap' }}>
              {SUGGESTIONS.map((sg, i) => (
                <button key={i} onClick={() => onSend(sg.text)} style={{ fontSize: 10.5, color: '#9aa7b8', background: '#0d1117', border: '1px solid #232c3b', borderRadius: 18, padding: '6px 13px', cursor: 'pointer' }}>{sg.label}</button>
              ))}
            </div>
            <div style={{ position: 'relative' }}>
              {slashOpen && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 8px)', left: 0, right: 0, background: '#0c1119', border: '1px solid #232c3b', borderRadius: 11, overflow: 'hidden', boxShadow: '0 12px 30px rgba(0,0,0,.5)' }}>
                  {SLASH_ITEMS.map(si => (
                    <div key={si.cmd} onClick={() => onSend(si.cmd)} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '10px 14px', cursor: 'pointer', borderBottom: '1px solid #161d29' }}>
                      <span style={{ fontSize: 12, color: '#2dd4bf', fontWeight: 600, width: 90 }}>{si.cmd}</span>
                      <span style={{ fontSize: 11, color: '#7c89a0' }}>{si.desc}</span>
                    </div>
                  ))}
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 11, background: '#0d1117', border: '1px solid #232c3b', borderRadius: 13, padding: '11px 13px' }}>
                <textarea
                  value={draft}
                  onChange={e => onSetDraft(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSend(draft) } }}
                  rows={1}
                  placeholder="Ask about your logs, or type / for commands…"
                  style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8edf4', fontSize: 13, resize: 'none', lineHeight: 1.5, maxHeight: 120 }}
                />
                <button onClick={() => onSend(draft)} style={{ flexShrink: 0, width: 34, height: 34, borderRadius: 9, background: '#2dd4bf', border: 'none', color: '#0a0e14', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 15 }}>↑</button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* query library rail */}
      <div style={{ width: 268, flexShrink: 0, borderLeft: '1px solid #1a212e', background: '#0c1119', padding: 18, overflowY: 'auto' }}>
        <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#46505f', marginBottom: 13 }}>QUERY LIBRARY</div>
        {library.map((q, i) => (
          <div key={i} onClick={q.onClick} style={{ background: '#0a0e14', border: '1px solid #1a212e', borderRadius: 10, padding: '11px 12px', marginBottom: 9, cursor: 'pointer' }}>
            <div style={{ fontSize: 11.5, color: '#cdd6e3', marginBottom: 5, lineHeight: 1.4 }}>{q.label}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 9, color: '#2dd4bf', border: '1px solid rgba(45,212,191,.22)', borderRadius: 4, padding: '1px 6px' }}>{q.type}</span>
              <span style={{ fontSize: 9.5, color: '#5e6b7e' }}>used {q.uses}×</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
