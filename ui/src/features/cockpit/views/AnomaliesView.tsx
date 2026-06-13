import type { CockpitState } from '../types'
import { ANOMALIES } from '../data'
import { AnomalyChart } from '../anomalyChart'

const SEV_META = {
  critical: { c: '#ff5c5c', bg: 'rgba(255,92,92,.08)', bd: 'rgba(255,92,92,.3)' },
  warning:  { c: '#ffb454', bg: 'rgba(255,180,84,.08)', bd: 'rgba(255,180,84,.3)' },
  info:     { c: '#5b9dff', bg: 'rgba(91,157,255,.08)', bd: 'rgba(91,157,255,.3)' },
} as const

interface Props {
  state: CockpitState
  onSelectAnomaly: (id: string) => void
  onGoGraph: () => void
}

export function AnomaliesView({ state, onSelectAnomaly, onGoGraph }: Props) {
  const { selectedAnomaly } = state
  const selAn = ANOMALIES.find(a => a.id === selectedAnomaly) ?? ANOMALIES[0]
  const sm = SEV_META[selAn.sev]

  return (
    <div style={{ height: '100%', display: 'flex', minHeight: 0 }}>
      {/* feed */}
      <div style={{ width: 330, flexShrink: 0, borderRight: '1px solid #1a212e', background: '#0c1119', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 18px 14px', borderBottom: '1px solid #1a212e' }}>
          <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 3 }}>Anomaly Detection</div>
          <div style={{ fontSize: 10.5, color: '#5e6b7e' }}>5 active · ranked by deviation σ · last 1h</div>
        </div>
        <div style={{ padding: 10 }}>
          {ANOMALIES.map(a => {
            const m = SEV_META[a.sev]
            const sel = a.id === selectedAnomaly
            return (
              <div key={a.id} onClick={() => onSelectAnomaly(a.id)} style={{ cursor: 'pointer', background: sel ? m.bg : '#0d1117', border: `1px solid ${sel ? m.bd : '#1d2532'}`, borderRadius: 11, padding: '12px 13px', marginBottom: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', flexShrink: 0, background: m.c, boxShadow: `0 0 8px ${m.c}` }} />
                  <span style={{ fontSize: 11.5, color: '#e8edf4', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.service} · {a.metric}</span>
                  <span style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 10.5, fontWeight: 700, color: m.c }}>{a.dir === 'up' ? '▲' : '▼'} {a.score.toFixed(1)}σ</span>
                </div>
                <div style={{ fontSize: 10, color: '#7c89a0', lineHeight: 1.5, marginBottom: 8 }}>{a.desc}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 8, fontWeight: 700, letterSpacing: '.07em', color: m.c, border: `1px solid ${m.c}`, borderRadius: 4, padding: '1px 6px' }}>{a.sev.toUpperCase()}</span>
                  <span style={{ fontSize: 9.5, color: '#46505f' }}>{a.when}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* detail */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '22px 26px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4 }}>
          <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', margin: 0 }}>{selAn.service} · {selAn.metric}</h1>
          <span style={{ fontSize: 9, fontWeight: 700, letterSpacing: '.08em', color: sm.c, border: `1px solid ${sm.bd}`, background: sm.bg, borderRadius: 5, padding: '2px 8px' }}>{selAn.sev.toUpperCase()}</span>
          <span style={{ fontSize: 13, fontWeight: 700, color: sm.c }}>{selAn.score.toFixed(1)}σ</span>
        </div>
        <div style={{ fontSize: 12, color: '#9aa7b8', marginBottom: 18, maxWidth: 640, lineHeight: 1.6 }}>{selAn.desc}</div>

        <div style={{ background: '#0d1117', border: '1px solid #1d2532', borderRadius: 14, padding: '16px 18px 12px', marginBottom: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#e8edf4' }}>Deviation from baseline</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 'auto' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, color: '#9aa7b8' }}><span style={{ width: 13, height: 8, background: 'rgba(120,140,170,.25)', borderRadius: 2, display: 'inline-block' }} />baseline band</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, color: '#9aa7b8' }}><span style={{ width: 13, height: 0, borderTop: `2px solid ${sm.c}`, display: 'inline-block' }} />observed</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 9.5, color: '#9aa7b8' }}><span style={{ width: 13, height: 0, borderTop: `2px dashed ${sm.c}`, display: 'inline-block' }} />forecast</span>
            </div>
          </div>
          <div style={{ height: 250 }}>
            <AnomalyChart a={selAn} />
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
          {[['BASELINE', selAn.baseline, '#e8edf4'], ['CURRENT', selAn.current, sm.c], ['DETECTED', selAn.when, '#e8edf4'], ['FORECAST · 15m', selAn.forecast, sm.c]].map(([label, val, col]) => (
            <div key={label as string} style={{ background: '#0d1117', border: '1px solid #1d2532', borderRadius: 11, padding: '13px 14px' }}>
              <div style={{ fontSize: 9, letterSpacing: '.1em', color: '#5e6b7e', marginBottom: 6 }}>{label as string}</div>
              <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: label === 'FORECAST · 15m' ? 13 : 18, color: col as string, lineHeight: 1.4 }}>{val as string}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'linear-gradient(160deg,#101720,#0d1117)', border: '1px solid #2a3547', borderRadius: 12, padding: '15px 18px' }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 9, letterSpacing: '.16em', color: '#a78bfa', marginBottom: 5 }}>CAUSAL CONTEXT</div>
            <div style={{ fontSize: 12.5, color: '#cdd6e3' }}>{selAn.causal}</div>
          </div>
          <button onClick={onGoGraph} style={{ marginLeft: 'auto', flexShrink: 0, fontSize: 11.5, color: '#0a0e14', background: '#e8edf4', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600 }}>Open in graph →</button>
        </div>
      </div>
    </div>
  )
}
