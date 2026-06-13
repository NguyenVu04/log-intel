import type { CockpitState } from '../types'
import type { ServiceNode, GraphEdge, DiffEdge } from '../types'
import { HEALTH_COLOR, HEALTH_GLOW, EDGE_COLOR, SNAPSHOTS, SERVICES } from '../data'
import { GraphSvg } from '../graphSvg'

interface Props {
  state: CockpitState
  services: ServiceNode[]
  edges: GraphEdge[]
  onSelectNode: (id: string) => void
  onToggleCompare: () => void
  onSetCompareA: (v: string) => void
  onSetCompareB: (v: string) => void
  onSetLayoutOverlay: () => void
  onSetLayoutSide: () => void
  onSetThreshold: (v: number) => void
  onSetScrub: (v: number) => void
  onConfirmEdge: () => void
  onOpenExport: () => void
  onCloseExport: () => void
  onCopyExport: (md: string) => void
  onGoLogs: () => void
}

function diffEdges(aId: string, bId: string): DiffEdge[] {
  const key = (e: GraphEdge) => `${e.from}→${e.to}`
  const A: Record<string, GraphEdge> = {}
  const B: Record<string, GraphEdge> = {}
  const snapA = SNAPSHOTS.find(s => s.id === aId)
  const snapB = SNAPSHOTS.find(s => s.id === bId)
  snapA?.edges.forEach(e => { A[key(e)] = e })
  snapB?.edges.forEach(e => { B[key(e)] = e })
  const out: DiffEdge[] = []
  const seen: Record<string, boolean> = {}
  Object.keys(B).forEach(k => {
    const b = B[k], a = A[k]
    seen[k] = true
    if (!a) {
      out.push({ ...b, status: 'added' })
    } else {
      const d = +(b.conf - a.conf).toFixed(2)
      out.push({ ...b, status: Math.abs(d) > 0.20 ? 'changed' : 'same', delta: d, fromConf: a.conf })
    }
  })
  Object.keys(A).forEach(k => {
    if (seen[k]) return
    out.push({ ...A[k], status: 'removed' })
  })
  return out
}

function snapHealth(id: string): Record<string, string> {
  const m: Record<string, string> = {}
  SERVICES.forEach(n => { m[n.id] = n.health })
  if (id !== 'now') Object.keys(m).forEach(k => { if (k !== 'deploy-redis') m[k] = 'nominal' })
  return m
}

function snapNodes(id: string): ServiceNode[] {
  return id === 'now' ? SERVICES : SERVICES.filter(n => n.id !== 'deploy-redis')
}

function snapEdges(id: string): GraphEdge[] {
  return SNAPSHOTS.find(s => s.id === id)?.edges ?? []
}

function buildMarkdown(aId: string, bId: string, diff: DiffEdge[], counts: { added: number; removed: number; changed: number }): string {
  const nm = (id: string) => SERVICES.find(s => s.id === id)?.label ?? id
  const snapLabel = (id: string) => SNAPSHOTS.find(s => s.id === id)?.label ?? id
  let md = '# Post-mortem · Causal Graph Diff\n\n'
  md += `**Incident:** INC-2291 — payment-svc error-rate spike (SEV-2)\n`
  md += `**Comparing:** ${snapLabel(aId)}  →  ${snapLabel(bId)}\n\n`
  md += '## Summary\n'
  md += `- ${counts.added} new causal edge(s)\n- ${counts.removed} removed edge(s)\n- ${counts.changed} confidence shift(s) > 20%\n\n`
  md += '## Changes\n'
  diff.filter(e => e.status !== 'same').forEach(e => {
    const arrow = `${nm(e.from)} -> ${nm(e.to)}`
    if (e.status === 'added') md += `- **[NEW]** \`${e.type}\` ${arrow} (conf ${e.conf.toFixed(2)})\n`
    else if (e.status === 'removed') md += `- **[REMOVED]** \`${e.type}\` ${arrow} (was ${e.conf.toFixed(2)})\n`
    else md += `- **[CONF Δ]** \`${e.type}\` ${arrow} (${(e.fromConf ?? 0).toFixed(2)} -> ${e.conf.toFixed(2)})\n`
  })
  md += '\n## Root cause\nDeployment `redis-cache@v2.1.0` changed the maxmemory-policy, driving redis-cache into memory pressure. Granger causality confirms **redis-cache -> payment-svc** at confidence **0.91** (p = 0.003).\n'
  md += '\n## Resolution\nRunbook `rb_a3f9c2` — rollout restart of redis-cache. MTTR target ~3 min.\n'
  return md
}

export function GraphExplorer({ state, services, edges, onSelectNode, onToggleCompare, onSetCompareA, onSetCompareB, onSetLayoutOverlay, onSetLayoutSide, onSetThreshold, onSetScrub, onConfirmEdge, onOpenExport, onCloseExport, onCopyExport }: Props) {
  const { compareMode, compareLayout, compareA, compareB, confThreshold, scrub, selectedNode, edgeConfirmed, showExport, copied } = state

  const snapOpts = SNAPSHOTS.map(s => ({ id: s.id, label: s.label }))
  const diff = compareMode ? diffEdges(compareA, compareB) : []
  const counts = { added: 0, removed: 0, changed: 0 }
  diff.forEach(e => { if (e.status in counts) counts[e.status as keyof typeof counts]++ })

  const exportMd = compareMode ? buildMarkdown(compareA, compareB, diff, counts) : ''

  const selNode = services.find(s => s.id === selectedNode) ?? services[2]
  const selEdges = edges.filter(e => e.from === selNode.id || e.to === selNode.id).map(e => ({
    type: e.type,
    color: EDGE_COLOR[e.type] ?? '#3a4761',
    dir: e.from === selNode.id ? '→' : '←',
    other: e.from === selNode.id ? (services.find(s => s.id === e.to)?.label ?? e.to) : (services.find(s => s.id === e.from)?.label ?? e.from),
    conf: e.type === 'CALLS' ? '—' : e.conf.toFixed(2),
  }))
  const selLogs = state.logs.filter(l => l.service === selNode.id).slice(0, 5)

  const scrubMin = Math.round((100 - scrub) * 0.18)
  const scrubLabel = scrub >= 100 ? 'now' : (`−${scrubMin} min`)

  const layBtn = (active: boolean) => ({
    color: active ? '#e8edf4' : '#7c89a0',
    bg: active ? '#1c2533' : '#0d1117',
    border: active ? '#2f3a4d' : '#232c3b',
  })
  const ovBtn = layBtn(compareLayout === 'overlay')
  const sideBtn = layBtn(compareLayout === 'side')

  const diffChanges = diff.filter(e => e.status !== 'same').map(e => {
    const colors: Record<string, string> = { added: '#39d98a', removed: '#ff5c5c', changed: '#ffb454' }
    const tags: Record<string, string> = { added: 'NEW', removed: 'REMOVED', changed: 'CONF Δ' }
    return {
      from: services.find(s => s.id === e.from)?.label ?? e.from,
      to: services.find(s => s.id === e.to)?.label ?? e.to,
      type: e.type, status: e.status,
      color: colors[e.status] ?? '#5e6b7e',
      tag: tags[e.status] ?? e.status,
      detail: e.status === 'changed' ? `${(e.fromConf ?? 0).toFixed(2)} → ${e.conf.toFixed(2)}` : e.status === 'added' ? `conf ${e.conf.toFixed(2)}` : `was ${e.conf.toFixed(2)}`,
    }
  })

  function renderGraph() {
    if (!compareMode) {
      return <GraphSvg nodes={services} edges={edges} opts={{ threshold: confThreshold, health: snapHealth('now'), interactive: true }} selectedNode={selectedNode} onSelectNode={onSelectNode} />
    }
    if (compareLayout === 'side') {
      const snapLabel = (id: string) => SNAPSHOTS.find(s => s.id === id)?.label ?? id
      return (
        <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
          {[compareA, compareB].map((id, idx) => (
            <div key={id} style={{ flex: 1, position: 'relative', minWidth: 0, borderRight: idx === 0 ? '1px solid #1a212e' : 'none' }}>
              <div style={{ position: 'absolute', top: 12, left: 14, zIndex: 2, fontFamily: "'JetBrains Mono',monospace", fontSize: 10, letterSpacing: '.08em', color: '#cdd6e3', background: 'rgba(10,14,20,.75)', border: '1px solid #232c3b', borderRadius: 6, padding: '4px 10px' }}>
                {idx === 0 ? 'A' : 'B'} · {snapLabel(id)}
              </div>
              <GraphSvg nodes={snapNodes(id)} edges={snapEdges(id)} opts={{ threshold: 0, health: snapHealth(id) }} />
            </div>
          ))}
        </div>
      )
    }
    return <GraphSvg nodes={services} edges={diff} opts={{ diff: true, health: snapHealth(compareB) }} />
  }

  return (
    <div style={{ height: '100%', display: 'flex', minHeight: 0 }}>
      {/* canvas col */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* header */}
        <div style={{ height: 52, flexShrink: 0, borderBottom: '1px solid #1a212e', display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px' }}>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: '#fff' }}>Causal Graph Explorer</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 13, marginLeft: 6 }}>
            {(['nominal', 'degraded', 'incident'] as const).map(h => (
              <span key={h} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#9aa7b8' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: HEALTH_COLOR[h] }} />{h}
              </span>
            ))}
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#9aa7b8' }}>
              <span style={{ width: 14, height: 2, background: '#ff5c5c' }} />CAUSED
            </span>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            {!compareMode && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                <span style={{ fontSize: 10, color: '#5e6b7e' }}>confidence ≥</span>
                <input type="range" min={0} max={1} step={0.05} value={confThreshold} onChange={e => onSetThreshold(+e.target.value)} style={{ width: 120, accentColor: '#ff5c5c' }} />
                <span style={{ fontSize: 11, color: '#e8edf4', fontWeight: 600, width: 30 }}>{confThreshold.toFixed(2)}</span>
              </div>
            )}
            <button
              onClick={onToggleCompare}
              style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 500, color: compareMode ? '#0a0e14' : '#cdd6e3', background: compareMode ? '#2dd4bf' : '#151c27', border: `1px solid ${compareMode ? '#2dd4bf' : '#2a3547'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}
            >
              ⇄ {compareMode ? 'Exit compare' : 'Compare snapshots'}
            </button>
          </div>
        </div>

        {/* compare bar */}
        {compareMode && (
          <div style={{ flexShrink: 0, borderBottom: '1px solid #1a212e', display: 'flex', alignItems: 'center', gap: 11, padding: '9px 20px', background: '#0c1119', flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#46505f' }}>DIFF</span>
            <select value={compareA} onChange={e => onSetCompareA(e.target.value)} style={{ background: '#0a0e14', color: '#cdd6e3', border: '1px solid #232c3b', borderRadius: 7, padding: '5px 9px', fontSize: 11, outline: 'none' }}>
              {snapOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <span style={{ color: '#5e6b7e', fontSize: 13 }}>→</span>
            <select value={compareB} onChange={e => onSetCompareB(e.target.value)} style={{ background: '#0a0e14', color: '#cdd6e3', border: '1px solid #232c3b', borderRadius: 7, padding: '5px 9px', fontSize: 11, outline: 'none' }}>
              {snapOpts.map(o => <option key={o.id} value={o.id}>{o.label}</option>)}
            </select>
            <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
              <button onClick={onSetLayoutOverlay} style={{ fontSize: 10.5, color: ovBtn.color, background: ovBtn.bg, border: `1px solid ${ovBtn.border}`, borderRadius: 7, padding: '5px 11px', cursor: 'pointer' }}>Overlay</button>
              <button onClick={onSetLayoutSide} style={{ fontSize: 10.5, color: sideBtn.color, background: sideBtn.bg, border: `1px solid ${sideBtn.border}`, borderRadius: 7, padding: '5px 11px', cursor: 'pointer' }}>Side by side</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 8 }}>
              {[['#39d98a', 'new'], ['#ff5c5c', 'removed'], ['#ffb454', 'conf Δ>20%']].map(([c, l]) => (
                <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, color: '#9aa7b8' }}>
                  <span style={{ width: 13, height: 2, background: c }} />{l}
                </span>
              ))}
            </div>
            <button onClick={onOpenExport} style={{ marginLeft: 'auto', fontSize: 11, color: '#0a0e14', background: '#e8edf4', border: 'none', borderRadius: 8, padding: '6px 13px', cursor: 'pointer', fontWeight: 600 }}>Export post-mortem ↗</button>
          </div>
        )}

        {/* graph canvas */}
        <div style={{ flex: 1, position: 'relative', background: 'radial-gradient(circle at 50% 40%,#0d1320,#0a0e14)', minHeight: 0 }}>
          {renderGraph()}

          {/* replay scrubber */}
          {!compareMode && (
            <div style={{ position: 'absolute', left: 18, bottom: 16, right: 18, display: 'flex', alignItems: 'center', gap: 13, background: 'rgba(12,17,25,.85)', border: '1px solid #1d2532', borderRadius: 11, padding: '11px 16px', backdropFilter: 'blur(8px)' }}>
              <span style={{ fontSize: 9, letterSpacing: '.14em', color: '#46505f', flexShrink: 0 }}>REPLAY</span>
              <input type="range" min={0} max={100} step={1} value={scrub} onChange={e => onSetScrub(+e.target.value)} style={{ flex: 1, accentColor: '#5b9dff' }} />
              <span style={{ fontSize: 11, color: '#cdd6e3', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{scrubLabel}</span>
            </div>
          )}

          {/* export modal */}
          {showExport && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(5,8,12,.72)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, padding: 34 }}>
              <div style={{ width: 600, maxWidth: '100%', maxHeight: '100%', display: 'flex', flexDirection: 'column', background: '#0c1119', border: '1px solid #2a3547', borderRadius: 14, overflow: 'hidden', boxShadow: '0 24px 70px rgba(0,0,0,.6)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '14px 18px', borderBottom: '1px solid #1a212e' }}>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#2dd4bf' }}>POST-MORTEM</span>
                  <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 13, color: '#fff' }}>Graph diff export</span>
                  <button onClick={onCloseExport} style={{ marginLeft: 'auto', fontSize: 18, color: '#5e6b7e', background: 'none', border: 'none', cursor: 'pointer', lineHeight: 1 }}>×</button>
                </div>
                <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', background: '#0a0e14', whiteSpace: 'pre-wrap', fontSize: 11, lineHeight: 1.7, color: '#b3bdcc' }}>{exportMd}</div>
                <div style={{ display: 'flex', gap: 9, padding: '13px 18px', borderTop: '1px solid #1a212e' }}>
                  <button onClick={() => onCopyExport(exportMd)} style={{ fontSize: 11.5, color: '#0a0e14', background: '#2dd4bf', border: 'none', borderRadius: 8, padding: '8px 15px', cursor: 'pointer', fontWeight: 600 }}>{copied ? '✓ Copied to clipboard' : 'Copy Markdown'}</button>
                  <button onClick={onCloseExport} style={{ fontSize: 11.5, color: '#9aa7b8', background: '#151c27', border: '1px solid #2a3547', borderRadius: 8, padding: '8px 15px', cursor: 'pointer' }}>Close</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* side panel */}
      <div style={{ width: 330, flexShrink: 0, borderLeft: '1px solid #1a212e', background: '#0c1119', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        {!compareMode ? (
          <>
            <div style={{ padding: '18px 18px 16px', borderBottom: '1px solid #1a212e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 7 }}>
                <span style={{ width: 11, height: 11, borderRadius: '50%', background: HEALTH_COLOR[selNode.health], boxShadow: `0 0 10px ${HEALTH_GLOW[selNode.health]}` }} />
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>{selNode.label}</span>
              </div>
              <div style={{ display: 'flex', gap: 7 }}>
                <span style={{ fontSize: 9.5, color: '#9aa7b8', border: '1px solid #232c3b', borderRadius: 5, padding: '2px 8px' }}>{selNode.kind}</span>
                <span style={{ fontSize: 9.5, color: HEALTH_COLOR[selNode.health], border: '1px solid #232c3b', borderRadius: 5, padding: '2px 8px' }}>{selNode.health.toUpperCase()}</span>
              </div>
            </div>
            <div style={{ padding: '16px 18px', borderBottom: '1px solid #1a212e' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#46505f', marginBottom: 11 }}>CAUSAL EDGES</div>
              {selEdges.map((e, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 9 }}>
                  <span style={{ fontSize: 9, fontWeight: 600, color: e.color, width: 62, flexShrink: 0 }}>{e.type}</span>
                  <span style={{ fontSize: 11, color: '#9aa7b8', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.dir} {e.other}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 600, color: '#e8edf4' }}>{e.conf}</span>
                </div>
              ))}
              {(selNode.id === 'payment-svc' || selNode.id === 'redis-cache') && (
                <div style={{ marginTop: 12, padding: 11, background: 'rgba(255,180,84,.06)', border: '1px solid rgba(255,180,84,.25)', borderRadius: 9 }}>
                  <div style={{ fontSize: 11, color: '#cdd6e3', marginBottom: 9 }}>Confirm: <span style={{ color: '#fff' }}>redis-cache → payment-svc</span> is causal?</div>
                  <div style={{ display: 'flex', gap: 7 }}>
                    <button onClick={onConfirmEdge} style={{ flex: 1, fontSize: 11, color: '#0a0e14', background: '#39d98a', border: 'none', borderRadius: 7, padding: 7, cursor: 'pointer', fontWeight: 600 }}>
                      {edgeConfirmed ? '✓ Confirmed · pinned 1.0' : 'Confirm causal'}
                    </button>
                    <button style={{ flex: 1, fontSize: 11, color: '#9aa7b8', background: '#151c27', border: '1px solid #2a3547', borderRadius: 7, padding: 7, cursor: 'pointer' }}>Reject</button>
                  </div>
                </div>
              )}
            </div>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#46505f', marginBottom: 11 }}>RECENT LOG LINES</div>
              {selLogs.map((l, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, fontSize: 10.5, lineHeight: 1.5 }}>
                  <span style={{ flexShrink: 0, fontWeight: 600, color: '#ff5c5c', width: 38 }}>{l.sev}</span>
                  <span style={{ color: '#8794a8' }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div style={{ padding: 18 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#46505f', marginBottom: 13 }}>SNAPSHOT DIFF</div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[['#39d98a', counts.added, 'NEW'], ['#ff5c5c', counts.removed, 'REMOVED'], ['#ffb454', counts.changed, 'CONF Δ']].map(([c, n, l]) => (
                <div key={String(l)} style={{ flex: 1, background: `rgba(${c === '#39d98a' ? '57,217,138' : c === '#ff5c5c' ? '255,92,92' : '255,180,84'},.07)`, border: `1px solid rgba(${c === '#39d98a' ? '57,217,138' : c === '#ff5c5c' ? '255,92,92' : '255,180,84'},.2)`, borderRadius: 9, padding: '9px 6px', textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 18, color: c as string }}>{n as number}</div>
                  <div style={{ fontSize: 8.5, letterSpacing: '.08em', color: '#5e6b7e' }}>{l as string}</div>
                </div>
              ))}
            </div>
            {diffChanges.map((d, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 9, padding: '10px 0', borderTop: '1px solid #161d29' }}>
                <span style={{ flexShrink: 0, fontSize: 8, fontWeight: 700, letterSpacing: '.05em', color: d.color, border: `1px solid ${d.color}`, borderRadius: 4, padding: '2px 5px', marginTop: 1 }}>{d.tag}</span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 11, color: '#e8edf4' }}>{d.from} → {d.to}</div>
                  <div style={{ fontSize: 9.5, color: '#5e6b7e' }}>{d.type} · {d.detail}</div>
                </div>
              </div>
            ))}
            <button onClick={onOpenExport} style={{ width: '100%', marginTop: 14, fontSize: 11.5, color: '#0a0e14', background: '#e8edf4', border: 'none', borderRadius: 9, padding: 10, cursor: 'pointer', fontWeight: 600 }}>Export post-mortem Markdown</button>
          </div>
        )}
      </div>
    </div>
  )
}
