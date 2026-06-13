import type { CockpitState, RunbookStep } from '../types'
import { RUNBOOKS_DATA } from '../data'

const STATUS_STYLE: Record<string, { c: string; bg: string }> = {
  idle:    { c: '#5e6b7e', bg: '#0d1117' },
  running: { c: '#2dd4bf', bg: 'rgba(45,212,191,.1)' },
  done:    { c: '#39d98a', bg: 'rgba(57,217,138,.1)' },
}

function StepRow({ step }: { step: RunbookStep }) {
  const ss = STATUS_STYLE[step.status]
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ flexShrink: 0, width: 24, height: 24, borderRadius: 7, background: ss.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
        {step.status === 'done' && <span style={{ color: ss.c, fontSize: 12 }}>✓</span>}
        {step.status === 'running' && <span className="anim-spin" style={{ width: 10, height: 10, border: `2px solid ${ss.c}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'block' }} />}
        {step.status === 'idle' && <span style={{ color: ss.c, fontSize: 11, fontWeight: 600 }}>{step.n}</span>}
      </div>
      <div style={{ flex: 1, fontSize: 12.5, color: step.status === 'idle' ? '#7c89a0' : '#cdd6e3', lineHeight: 1.5 }}>{step.text}</div>
      <div style={{ flexShrink: 0, fontSize: 9, fontWeight: 600, letterSpacing: '.07em', color: ss.c, background: ss.bg, border: `1px solid ${ss.c}22`, borderRadius: 5, padding: '2px 8px', marginTop: 3 }}>{step.status.toUpperCase()}</div>
    </div>
  )
}

interface Props {
  state: CockpitState
  onApplyRunbook: () => void
}

export function RunbooksView({ state, onApplyRunbook }: Props) {
  const { runbookSteps, applying, resolved } = state

  return (
    <div style={{ padding: '24px 28px', overflowY: 'auto', height: '100%', boxSizing: 'border-box' }}>
      <div style={{ maxWidth: 900 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20 }}>
          <div>
            <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 800, fontSize: 20, color: '#fff', marginBottom: 3 }}>Runbook Store</div>
            <div style={{ fontSize: 11, color: '#5e6b7e' }}>auto-ranked by semantic similarity to INC-2291 · {RUNBOOKS_DATA.length} of 12 shown</div>
          </div>
          <button style={{ marginLeft: 'auto', fontSize: 11, color: '#9aa7b8', background: '#0d1117', border: '1px solid #232c3b', borderRadius: 9, padding: '8px 14px', cursor: 'pointer' }}>View all runbooks</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {RUNBOOKS_DATA.map((rb, idx) => {
            const isFirst = idx === 0
            const isApplying = isFirst && applying
            const isDone = isFirst && resolved

            return (
              <div key={rb.id} style={{ background: '#0d1117', border: `1px solid ${isApplying || isDone ? '#2a3547' : '#1d2532'}`, borderRadius: 16, overflow: 'hidden' }}>
                {/* header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderBottom: '1px solid #1a212e', flexWrap: 'wrap' }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 3 }}>{rb.sym}</div>
                    <div style={{ fontSize: 10.5, color: '#5e6b7e' }}>{rb.id} · used {rb.used}× · avg resolve {rb.time} · last {rb.last}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {rb.svc.split(', ').map(t => (
                      <span key={t} style={{ fontSize: 8.5, letterSpacing: '.07em', color: '#2dd4bf', border: '1px solid rgba(45,212,191,.25)', borderRadius: 5, padding: '2px 7px' }}>{t}</span>
                    ))}
                    {rb.drift !== 'none' && (
                      <span style={{ fontSize: 8.5, letterSpacing: '.07em', color: '#ffb454', border: '1px solid rgba(255,180,84,.25)', borderRadius: 5, padding: '2px 7px' }}>⚠ {rb.drift}</span>
                    )}
                  </div>
                  <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 11 }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 9, letterSpacing: '.1em', color: '#5e6b7e', marginBottom: 2 }}>SIMILARITY</div>
                      <div style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 14, color: '#39d98a' }}>{rb.conf}</div>
                    </div>
                    {isFirst && (
                      <button
                        onClick={onApplyRunbook}
                        disabled={applying || resolved}
                        style={{ fontSize: 12, fontWeight: 600, color: (applying || resolved) ? '#3a4557' : '#0a0e14', background: (applying || resolved) ? '#1c2533' : '#2dd4bf', border: 'none', borderRadius: 9, padding: '9px 18px', cursor: (applying || resolved) ? 'not-allowed' : 'pointer' }}
                      >
                        {isDone ? 'Applied ✓' : isApplying ? 'Running…' : 'Apply'}
                      </button>
                    )}
                    {!isFirst && (
                      <button style={{ fontSize: 12, fontWeight: 600, color: '#7c89a0', background: '#151c27', border: '1px solid #2a3547', borderRadius: 9, padding: '9px 18px', cursor: 'pointer' }}>Apply</button>
                    )}
                  </div>
                </div>

                {/* steps — only show live steps for the first runbook */}
                <div style={{ padding: '14px 20px 16px', display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {isFirst ? (
                    runbookSteps.map((step, i) => <StepRow key={i} step={step} />)
                  ) : (
                    <div style={{ fontSize: 12, color: '#5e6b7e', fontStyle: 'italic' }}>3 steps · targets {rb.svc}</div>
                  )}
                </div>

                {/* outcome bar */}
                {isDone && (
                  <div style={{ padding: '12px 20px', background: 'rgba(57,217,138,.06)', borderTop: '1px solid rgba(57,217,138,.2)', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 16 }}>✓</span>
                    <div>
                      <div style={{ fontSize: 12.5, color: '#39d98a', fontWeight: 600 }}>Runbook applied successfully</div>
                      <div style={{ fontSize: 11, color: '#5e6b7e' }}>INC-2291 marked resolved · MTTR captured</div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
