import type { CockpitState, RunbookStep } from '../types'
import type { ServiceNode, LogRow } from '../types'
import { HEALTH_COLOR, HEALTH_GLOW, SEV_COLOR } from '../data'

interface Props {
  state: CockpitState
  services: ServiceNode[]
  onGoGraph: () => void
  onGoChat: () => void
  onGoLogs: () => void
  onGoAnomalies: () => void
  onApplyRunbook: () => void
  onSelectService: (id: string) => void
}

function RunbookStepRow({ step }: { step: RunbookStep }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
      {step.status === 'done' && (
        <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: 'rgba(57,217,138,.15)', color: '#39d98a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, marginTop: 1 }}>✓</span>
      )}
      {step.status === 'running' && (
        <span className="anim-spin" style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', border: '1.5px solid #2dd4bf', borderTopColor: 'transparent', marginTop: 1, display: 'inline-block' }} />
      )}
      {step.status === 'idle' && (
        <span style={{ flexShrink: 0, width: 18, height: 18, borderRadius: '50%', background: '#1c2533', color: '#7c89a0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 600, marginTop: 1 }}>{step.n}</span>
      )}
      <span style={{ fontSize: 11.5, color: step.status === 'done' ? '#5e6b7e' : '#cdd6e3', lineHeight: 1.5 }}>{step.text}</span>
    </div>
  )
}

export function CommandCenter({ state, services, onGoGraph, onGoChat, onGoLogs, onGoAnomalies, onApplyRunbook, onSelectService }: Props) {
  const { resolved, applying, runbookSteps } = state
  const mm = Math.floor(state.mttr / 60), ss = state.mttr % 60
  const mttr = `${mm}:${String(ss).padStart(2, '0')}`

  const applied = resolved
  const applyBtnLabel = applied ? '✓ Resolved · runbook captured' : applying ? 'Applying runbook…' : 'Apply runbook'
  const applyBtnColor = applied ? '#39d98a' : '#0a0e14'
  const applyBtnBg = applied ? 'rgba(57,217,138,.1)' : '#2dd4bf'
  const applyBtnBorder = applied ? 'rgba(57,217,138,.3)' : '#2dd4bf'

  const timeline = [
    { time: '02:34:51', color: '#ff5c5c', text: 'Alert fired — payment-svc error rate breached threshold' },
    { time: '02:34:52', color: '#a78bfa', text: 'Causal path derived: redis-cache → payment-svc (0.91)' },
    { time: '02:34:55', color: '#2dd4bf', text: 'Runbook rb_a3f9c2 surfaced — fingerprint match 0.91' },
    { time: applied ? 'now' : 'pending', color: applied ? '#39d98a' : '#5e6b7e', text: applied ? 'Incident resolved — MTTR captured' : 'Awaiting engineer action' },
  ]

  const svcHealth = services.filter(s => s.kind === 'Service')
  const logPreview: LogRow[] = state.logs.slice(0, 6)

  return (
    <div style={{ height: '100%', overflowY: 'auto', padding: '22px 26px 40px' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 12, marginBottom: 18 }}>
        <h1 style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 22, color: '#fff', letterSpacing: '-.02em', margin: 0 }}>Incident Command</h1>
        <span style={{ fontSize: 11.5, color: '#5e6b7e' }}>Real-time causal overview · payment domain</span>
      </div>

      {/* HERO: causal chain */}
      <div style={{ background: 'linear-gradient(160deg,#11161f,#0d1117)', border: '1px solid #2a3547', borderRadius: 16, padding: '22px 24px', marginBottom: 20, position: 'relative', overflow: 'hidden', boxShadow: '0 12px 40px rgba(0,0,0,.35)' }}>
        <div style={{ position: 'absolute', top: -90, right: -60, width: 360, height: 360, background: 'radial-gradient(circle,rgba(255,92,92,.13),transparent 68%)', pointerEvents: 'none' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 4, position: 'relative' }}>
          <span className="anim-pulse" style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff5c5c', boxShadow: '0 0 12px #ff5c5c' }} />
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: '.2em', color: '#ff5c5c' }}>ROOT CAUSE IDENTIFIED</span>
          <span style={{ fontSize: 10, color: '#5e6b7e', border: '1px solid #232c3b', borderRadius: 5, padding: '2px 8px' }}>Granger p = 0.003</span>
          <span style={{ fontSize: 10, color: '#39d98a', border: '1px solid rgba(57,217,138,.25)', background: 'rgba(57,217,138,.07)', borderRadius: 5, padding: '2px 8px' }}>confidence 0.91</span>
        </div>
        <p style={{ margin: '0 0 20px', fontSize: 13, color: '#9aa7b8', maxWidth: 680, lineHeight: 1.7 }}>
          A <span style={{ color: '#a78bfa' }}>deployment</span> to <span style={{ color: '#e8edf4' }}>redis-cache</span> 14 minutes ago drove it into memory pressure, which{' '}
          <span style={{ fontFamily: "'Instrument Serif',serif", fontStyle: 'italic', fontSize: 15, color: '#e8edf4' }}>caused</span>{' '}
          the payment-svc error spike. This causal path was derived automatically — no manual searching.
        </p>

        <div style={{ display: 'flex', alignItems: 'stretch', flexWrap: 'wrap', gap: 0, position: 'relative' }}>
          {/* deployment node */}
          <div onClick={onGoGraph} style={{ cursor: 'pointer', flex: 1, minWidth: 160, background: '#0d1117', border: '1px solid rgba(167,139,250,.4)', borderLeft: '3px solid #a78bfa', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8.5, letterSpacing: '.16em', color: '#a78bfa', marginBottom: 7 }}>DEPLOYMENT</div>
            <div style={{ fontSize: 13, color: '#e8edf4', fontWeight: 500, marginBottom: 3 }}>redis-cache@v2.1.0</div>
            <div style={{ fontSize: 11, color: '#5e6b7e' }}>deployed 14m ago · maxmemory-policy change</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 14px', minWidth: 84 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8, letterSpacing: '.1em', color: '#5e6b7e' }}>PRECEDED</div>
            <div style={{ fontSize: 11, color: '#a78bfa', fontWeight: 600, margin: '2px 0' }}>0.85</div>
            <div style={{ fontSize: 18, color: '#3a4761', lineHeight: 1 }}>→</div>
          </div>
          {/* root cause */}
          <div onClick={onGoGraph} style={{ cursor: 'pointer', flex: 1, minWidth: 160, background: 'rgba(255,92,92,.06)', border: '1px solid rgba(255,92,92,.45)', borderLeft: '3px solid #ff5c5c', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8.5, letterSpacing: '.16em', color: '#ff5c5c', marginBottom: 7 }}>ROOT CAUSE</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 3 }}>redis-cache</div>
            <div style={{ fontSize: 11, color: '#ff8a8a' }}>memory 94% · OOM evictions</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 14px', minWidth: 84 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8, letterSpacing: '.1em', color: '#5e6b7e' }}>CAUSED</div>
            <div style={{ fontSize: 11, color: '#ff5c5c', fontWeight: 700, margin: '2px 0' }}>0.91</div>
            <div style={{ fontSize: 18, color: '#ff5c5c', lineHeight: 1 }}>→</div>
          </div>
          {/* primary impact */}
          <div onClick={onGoGraph} style={{ cursor: 'pointer', flex: 1, minWidth: 160, background: 'rgba(255,92,92,.06)', border: '1px solid rgba(255,92,92,.4)', borderLeft: '3px solid #ff5c5c', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8.5, letterSpacing: '.16em', color: '#ff5c5c', marginBottom: 7 }}>PRIMARY IMPACT</div>
            <div style={{ fontSize: 13, color: '#fff', fontWeight: 600, marginBottom: 3 }}>payment-svc</div>
            <div style={{ fontSize: 11, color: '#ff8a8a' }}>error rate 12.4/s</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 14px', minWidth: 84 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8, letterSpacing: '.1em', color: '#5e6b7e' }}>CAUSED</div>
            <div style={{ fontSize: 11, color: '#ffb454', fontWeight: 700, margin: '2px 0' }}>0.78</div>
            <div style={{ fontSize: 18, color: '#3a4761', lineHeight: 1 }}>→</div>
          </div>
          {/* downstream */}
          <div onClick={onGoGraph} style={{ cursor: 'pointer', flex: 1, minWidth: 160, background: 'rgba(255,180,84,.05)', border: '1px solid rgba(255,180,84,.35)', borderLeft: '3px solid #ffb454', borderRadius: 10, padding: '13px 15px' }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontSize: 8.5, letterSpacing: '.16em', color: '#ffb454', marginBottom: 7 }}>DOWNSTREAM</div>
            <div style={{ fontSize: 13, color: '#e8edf4', fontWeight: 500, marginBottom: 3 }}>api-gateway</div>
            <div style={{ fontSize: 11, color: '#5e6b7e' }}>503 upstream timeouts</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20, position: 'relative' }}>
          <button onClick={onGoGraph} style={{ fontSize: 12, color: '#0a0e14', background: '#e8edf4', border: 'none', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', fontWeight: 600 }}>Open in graph explorer</button>
          <button onClick={onGoChat} style={{ fontSize: 12, color: '#cdd6e3', background: '#151c27', border: '1px solid #2a3547', borderRadius: 9, padding: '9px 16px', cursor: 'pointer' }}>Explain in chat</button>
          <button onClick={onGoLogs} style={{ fontSize: 12, color: '#cdd6e3', background: '#151c27', border: '1px solid #2a3547', borderRadius: 9, padding: '9px 16px', cursor: 'pointer' }}>View related logs</button>
        </div>
      </div>

      {/* Two column layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 372px', gap: 20, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}>
          {/* Service health */}
          <div style={{ background: '#0d1117', border: '1px solid #1d2532', borderRadius: 14, padding: '17px 18px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#e8edf4' }}>Service health</span>
              <span style={{ fontSize: 10, color: '#5e6b7e' }}>9 services · 4 affected</span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 9 }}>
              {svcHealth.map(s => (
                <div key={s.id} onClick={() => onSelectService(s.id)} style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', background: '#0a0e14', border: '1px solid #1a212e', borderRadius: 9 }}>
                  <span style={{ width: 9, height: 9, borderRadius: '50%', flexShrink: 0, background: HEALTH_COLOR[s.health], boxShadow: `0 0 8px ${HEALTH_GLOW[s.health]}` }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div style={{ fontSize: 11.5, color: '#cdd6e3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</div>
                    <div style={{ fontSize: 9.5, color: '#5e6b7e' }}>{s.err}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Live log preview */}
          <div style={{ background: '#0d1117', border: '1px solid #1d2532', borderRadius: 14, overflow: 'hidden' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', borderBottom: '1px solid #1a212e' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#e8edf4' }}>Live log stream</span>
                <span className="anim-liblink" style={{ width: 6, height: 6, borderRadius: '50%', background: '#39d98a', display: 'inline-block' }} />
              </div>
              <button onClick={onGoLogs} style={{ fontSize: 11, color: '#5b9dff', background: 'none', border: 'none', cursor: 'pointer' }}>Open Log Explorer →</button>
            </div>
            <div style={{ padding: '6px 0' }}>
              {logPreview.map((l, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'baseline', gap: 11, padding: '5px 18px', borderLeft: `2px solid ${l.cause ? '#ff5c5c' : 'transparent'}`, fontSize: 11.5 }}>
                  <span style={{ color: '#46505f', flexShrink: 0, fontSize: 10.5 }}>{l.t.slice(0, 8)}</span>
                  <span style={{ flexShrink: 0, width: 48, fontSize: 9.5, fontWeight: 600, color: SEV_COLOR[l.sev] }}>{l.sev}</span>
                  <span style={{ flexShrink: 0, color: '#7c89a0', width: 96, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.service}</span>
                  <span style={{ color: '#9aa7b8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Runbook suggestion */}
          <div style={{ background: 'linear-gradient(165deg,#101720,#0d1117)', border: '1px solid #2a3547', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 9, letterSpacing: '.18em', color: '#2dd4bf' }}>SUGGESTED RUNBOOK</span>
              <span style={{ marginLeft: 'auto', fontSize: 10, color: '#39d98a', border: '1px solid rgba(57,217,138,.25)', borderRadius: 5, padding: '2px 7px' }}>match 0.91</span>
            </div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 3 }}>rb_a3f9c2</div>
            <div style={{ fontSize: 10.5, color: '#5e6b7e', marginBottom: 14 }}>used 7× · last triggered 3 days ago · resolves in ~3 min</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 15 }}>
              {runbookSteps.map(step => <RunbookStepRow key={step.n} step={step} />)}
            </div>
            <button onClick={onApplyRunbook} style={{ width: '100%', fontSize: 12.5, fontWeight: 600, color: applyBtnColor, background: applyBtnBg, border: `1px solid ${applyBtnBorder}`, borderRadius: 9, padding: 11, cursor: 'pointer' }}>
              {applyBtnLabel}
            </button>
          </div>

          {/* Signals */}
          <div style={{ background: '#0d1117', border: '1px solid #1d2532', borderRadius: 14, padding: 18 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 15 }}>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#e8edf4' }}>Signals</span>
              <button onClick={onGoAnomalies} style={{ fontSize: 11, color: '#5b9dff', background: 'none', border: 'none', cursor: 'pointer' }}>Anomalies →</button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: '#9aa7b8' }}>payment-svc error rate</span>
              <span style={{ fontSize: 12, color: '#ff5c5c', fontWeight: 600 }}>12.4/s</span>
            </div>
            <svg viewBox="0 0 280 50" style={{ width: '100%', height: 46, display: 'block', marginBottom: 16 }}>
              <polygon points="0,44 24,42 48,43 72,39 96,40 120,34 144,30 168,22 192,24 216,12 240,8 280,5 280,50 0,50" fill="rgba(255,92,92,.12)" />
              <polyline points="0,44 24,42 48,43 72,39 96,40 120,34 144,30 168,22 192,24 216,12 240,8 280,5" fill="none" stroke="#ff5c5c" strokeWidth={1.7} />
            </svg>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ fontSize: 10.5, color: '#9aa7b8' }}>redis-cache memory</span>
              <span style={{ fontSize: 12, color: '#ff5c5c', fontWeight: 600 }}>94%</span>
            </div>
            <div style={{ height: 8, borderRadius: 5, background: '#161d29', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: '94%', borderRadius: 5, background: 'linear-gradient(90deg,#ffb454,#ff5c5c)' }} />
            </div>
            <div style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 7 }}>
              <span style={{ fontSize: 9, letterSpacing: '.12em', color: '#46505f' }}>MTTR</span>
              <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: '#e8edf4', fontVariantNumeric: 'tabular-nums' }}>{mttr}</span>
            </div>
          </div>

          {/* Timeline */}
          <div style={{ background: '#0d1117', border: '1px solid #1d2532', borderRadius: 14, padding: 18 }}>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 12, color: '#e8edf4', marginBottom: 14 }}>Incident timeline</div>
            {timeline.map((t, i) => (
              <div key={i} style={{ display: 'flex', gap: 11, marginBottom: 11 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: t.color, flexShrink: 0, marginTop: 3 }} />
                  {i < timeline.length - 1 && <span style={{ width: 1, flex: 1, background: '#1d2532', marginTop: 2 }} />}
                </div>
                <div style={{ paddingBottom: 2 }}>
                  <div style={{ fontSize: 11.5, color: '#cdd6e3', lineHeight: 1.5 }}>{t.text}</div>
                  <div style={{ fontSize: 9.5, color: '#46505f' }}>{t.time}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
