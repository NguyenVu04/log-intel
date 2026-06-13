import { useCockpit } from './useCockpit'
import { Icon } from './icons'
import { CommandCenter } from './views/CommandCenter'
import { GraphExplorer } from './views/GraphExplorer'
import { LogExplorer } from './views/LogExplorer'
import { ChatView } from './views/ChatView'
import { AnomaliesView } from './views/AnomaliesView'
import { RunbooksView } from './views/RunbooksView'
import { SERVICES, EDGES } from './data'
import type { ViewId } from './types'

const NAV: { id: ViewId; label: string }[] = [
  { id: 'command',   label: 'Command' },
  { id: 'graph',     label: 'Graph' },
  { id: 'logs',      label: 'Logs' },
  { id: 'chat',      label: 'Chat' },
  { id: 'anomalies', label: 'Anomalies' },
  { id: 'runbooks',  label: 'Runbooks' },
]

const ICON_MAP: Record<ViewId, 'command' | 'graph' | 'logs' | 'chat' | 'anomalies' | 'runbooks'> = {
  command:   'command',
  graph:     'graph',
  logs:      'logs',
  chat:      'chat',
  anomalies: 'anomalies',
  runbooks:  'runbooks',
}

export function CockpitPage() {
  const { state, actions } = useCockpit()
  const { view, mttr, eventsJitter, applying, resolved } = state

  const fmtMttr = (s: number) => `${Math.floor(s / 60)}m ${String(s % 60).padStart(2, '0')}s`

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', background: '#0a0e14', color: '#e8edf4', overflow: 'hidden' }}>
      {/* top bar */}
      <div style={{ flexShrink: 0, height: 48, display: 'flex', alignItems: 'center', borderBottom: '1px solid #151d2b', padding: '0 18px', gap: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'linear-gradient(135deg,#0e7c7b,#0a4f4e)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: '#fff', fontFamily: "'Syne',sans-serif" }}>L</div>
          <span style={{ fontFamily: "'Syne',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff' }}>LogIntel</span>
          <span style={{ fontSize: 10, color: '#39d98a', border: '1px solid rgba(57,217,138,.25)', borderRadius: 4, padding: '1px 6px' }}>Cockpit</span>
        </div>

        {/* incident badge */}
        <div className="anim-pulse" style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255,92,92,.07)', border: '1px solid rgba(255,92,92,.22)', borderRadius: 8, padding: '5px 12px' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ff5c5c', flexShrink: 0 }} />
          <span style={{ fontSize: 11, fontWeight: 700, color: '#ff8a8a' }}>INC-2291</span>
          <span style={{ fontSize: 11, color: '#9aa7b8' }}>payment-svc · redis-cache</span>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 18 }}>
          <div>
            <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#46505f' }}>MTTR </span>
            <span style={{ fontSize: 11, fontWeight: 600, color: resolved ? '#39d98a' : '#ffb454', fontFamily: "'JetBrains Mono',monospace" }}>{fmtMttr(mttr)}</span>
          </div>
          <div>
            <span style={{ fontSize: 9, letterSpacing: '.1em', color: '#46505f' }}>EVENTS/s </span>
            <span className="anim-liblink" style={{ fontSize: 11, fontWeight: 600, color: '#5b9dff', fontFamily: "'JetBrains Mono',monospace" }}>{eventsJitter.toFixed(1)}</span>
          </div>
          {applying && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#2dd4bf' }}>
              <span className="anim-spin" style={{ width: 10, height: 10, border: '2px solid #2dd4bf', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block' }} />
              applying runbook…
            </div>
          )}
          {resolved && !applying && (
            <span style={{ fontSize: 11, color: '#39d98a', fontWeight: 600 }}>✓ resolved</span>
          )}
          <button style={{ width: 30, height: 30, borderRadius: 8, background: '#0d1117', border: '1px solid #1d2532', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#5e6b7e' }}>
            <Icon name="settings" />
          </button>
        </div>
      </div>

      {/* body */}
      <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
        {/* left rail */}
        <div style={{ width: 64, flexShrink: 0, borderRight: '1px solid #151d2b', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 12, gap: 4 }}>
          {NAV.map(n => {
            const active = view === n.id
            return (
              <button
                key={n.id}
                onClick={() => actions.setView(n.id)}
                title={n.label}
                style={{ width: 44, height: 44, borderRadius: 11, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, cursor: 'pointer', border: active ? '1px solid #2a3547' : '1px solid transparent', background: active ? '#151c27' : 'transparent', color: active ? '#e8edf4' : '#46505f', transition: 'all .15s' }}
              >
                <Icon name={ICON_MAP[n.id]} />
                <span style={{ fontSize: 7.5, letterSpacing: '.04em' }}>{n.label.slice(0, 3).toUpperCase()}</span>
              </button>
            )
          })}
        </div>

        {/* view pane */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {view === 'command' && (
            <CommandCenter
              state={state}
              services={SERVICES}
              onGoGraph={() => actions.setView('graph')}
              onGoLogs={() => actions.setView('logs')}
              onGoChat={() => actions.setView('chat')}
              onGoAnomalies={() => actions.setView('anomalies')}
              onApplyRunbook={actions.applyRunbook}
              onSelectService={actions.selectNode}
            />
          )}
          {view === 'graph' && (
            <GraphExplorer
              state={state}
              services={SERVICES}
              edges={EDGES}
              onSelectNode={actions.selectNode}
              onSetThreshold={actions.setThreshold}
              onSetScrub={actions.setScrub}
              onConfirmEdge={actions.confirmEdge}
              onToggleCompare={actions.toggleCompare}
              onSetCompareA={actions.setCompareA}
              onSetCompareB={actions.setCompareB}
              onSetLayoutOverlay={() => actions.setCompareLayout('overlay')}
              onSetLayoutSide={() => actions.setCompareLayout('side')}
              onOpenExport={actions.openExport}
              onCloseExport={actions.closeExport}
              onCopyExport={actions.copyExport}
              onGoLogs={() => actions.setView('logs')}
            />
          )}
          {view === 'logs' && (
            <LogExplorer
              state={state}
              onSetQuery={actions.setQuery}
              onSetSevFilter={actions.setSevFilter}
              onSetSvcFilter={actions.setSvcFilter}
              onToggleTail={actions.toggleTail}
              onExplain={(msg) => {
                actions.setView('chat')
                actions.send(`Explain this log: ${msg}`)
              }}
            />
          )}
          {view === 'chat' && (
            <ChatView
              state={state}
              onSend={actions.send}
              onSetDraft={actions.setDraft}
              onCitation={actions.onCitation}
              onRunQuery={actions.runQuery}
              onGoCommand={() => actions.setView('command')}
            />
          )}
          {view === 'anomalies' && (
            <AnomaliesView
              state={state}
              onSelectAnomaly={actions.selectAnomaly}
              onGoGraph={() => actions.setView('graph')}
            />
          )}
          {view === 'runbooks' && (
            <RunbooksView
              state={state}
              onApplyRunbook={actions.applyRunbook}
            />
          )}
        </div>
      </div>
    </div>
  )
}
