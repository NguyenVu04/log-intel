import type { CockpitState } from '../types'
import { SEV_COLOR, SEV_LEVEL, SERVICES } from '../data'
import { Icon } from '../icons'

interface Props {
  state: CockpitState
  onSetQuery: (q: string) => void
  onSetSevFilter: (f: CockpitState['sevFilter']) => void
  onSetSvcFilter: (f: string) => void
  onToggleTail: () => void
  onExplain: (msg: string) => void
}

export function LogExplorer({ state, onSetQuery, onSetSevFilter, onSetSvcFilter, onToggleTail, onExplain }: Props) {
  const { logs, query, sevFilter, svcFilter, tailing } = state
  const sevMin = sevFilter === 'error' ? 4 : sevFilter === 'warn' ? 3 : 0

  const nameOf = (id: string) => SERVICES.find(s => s.id === id)?.label ?? id

  const filtered = logs.filter(l => {
    if ((SEV_LEVEL[l.sev] ?? 0) < sevMin) return false
    if (svcFilter !== 'all' && l.service !== svcFilter) return false
    if (query && !(l.msg.toLowerCase().includes(query.toLowerCase()) || l.service.includes(query.toLowerCase()))) return false
    return true
  })

  const mkSev = (id: CockpitState['sevFilter'], label: string) => {
    const active = sevFilter === id
    return { id, label, color: active ? '#e8edf4' : '#7c89a0', bg: active ? '#1c2533' : '#0d1117', border: active ? '#2f3a4d' : '#232c3b' }
  }
  const mkSvc = (id: string, label: string) => {
    const active = svcFilter === id
    return { id, label, color: active ? '#e8edf4' : '#7c89a0', bg: active ? '#1c2533' : '#0d1117', border: active ? '#2f3a4d' : '#232c3b' }
  }

  const sevFilters = [mkSev('all', 'ALL'), mkSev('warn', 'WARN+'), mkSev('error', 'ERROR+')]
  const svcFilters = [mkSvc('all', 'all'), mkSvc('payment-svc', 'payment-svc'), mkSvc('redis-cache', 'redis-cache'), mkSvc('api-gateway', 'api-gateway')]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
      {/* filter bar */}
      <div style={{ flexShrink: 0, borderBottom: '1px solid #1a212e', padding: '13px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, height: 34, padding: '0 11px', background: '#0a0e14', border: '1px solid #232c3b', borderRadius: 9, minWidth: 230 }}>
          <span style={{ color: '#46505f' }}><Icon name="search" /></span>
          <input
            value={query}
            onChange={e => onSetQuery(e.target.value)}
            placeholder="filter messages…"
            style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e8edf4', fontSize: 12 }}
          />
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {sevFilters.map(f => (
            <button key={f.id} onClick={() => onSetSevFilter(f.id)} style={{ fontSize: 10.5, fontWeight: 500, color: f.color, background: f.bg, border: `1px solid ${f.border}`, borderRadius: 7, padding: '6px 11px', cursor: 'pointer' }}>{f.label}</button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 5 }}>
          {svcFilters.map(f => (
            <button key={f.id} onClick={() => onSetSvcFilter(f.id)} style={{ fontSize: 10.5, color: f.color, background: f.bg, border: `1px solid ${f.border}`, borderRadius: 7, padding: '6px 11px', cursor: 'pointer' }}>{f.label}</button>
          ))}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 11 }}>
          <span style={{ fontSize: 10.5, color: '#5e6b7e' }}>{filtered.length} lines</span>
          <button onClick={onToggleTail} style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, fontWeight: 500, color: tailing ? '#39d98a' : '#9aa7b8', background: tailing ? 'rgba(57,217,138,.08)' : '#0d1117', border: `1px solid ${tailing ? 'rgba(57,217,138,.25)' : '#232c3b'}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: tailing ? '#39d98a' : '#5e6b7e' }} />
            {tailing ? 'Live tail' : 'Paused'}
          </button>
        </div>
      </div>

      {/* column header */}
      <div style={{ flexShrink: 0, display: 'flex', gap: 13, padding: '7px 20px', borderBottom: '1px solid #1a212e', fontSize: 9, letterSpacing: '.13em', color: '#46505f', background: '#0c1119' }}>
        <span style={{ width: 92, flexShrink: 0 }}>TIMESTAMP</span>
        <span style={{ width: 50, flexShrink: 0 }}>LEVEL</span>
        <span style={{ width: 118, flexShrink: 0 }}>SERVICE</span>
        <span style={{ flex: 1 }}>MESSAGE</span>
      </div>

      {/* log rows */}
      <div style={{ flex: 1, overflowY: 'auto', minHeight: 0 }}>
        {filtered.map((l, i) => (
          <div key={i} style={{ borderLeft: `2px solid ${l.cause ? '#ff5c5c' : 'transparent'}`, background: l.cause ? 'rgba(255,92,92,.045)' : 'transparent' }}>
            <div style={{ display: 'flex', gap: 13, padding: '6px 20px', fontSize: 12, alignItems: 'baseline' }}>
              <span style={{ width: 92, flexShrink: 0, color: '#46505f', fontSize: 11 }}>{l.t}</span>
              <span style={{ width: 50, flexShrink: 0, fontSize: 9.5, fontWeight: 600, color: SEV_COLOR[l.sev] }}>{l.sev}</span>
              <span style={{ width: 118, flexShrink: 0, color: '#7c89a0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.service}</span>
              <span style={{ flex: 1, color: '#b3bdcc', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{l.msg}</span>
              <button onClick={() => onExplain(l.msg)} style={{ flexShrink: 0, fontSize: 10, color: '#5b9dff', background: 'rgba(91,157,255,.08)', border: '1px solid rgba(91,157,255,.2)', borderRadius: 6, padding: '3px 9px', cursor: 'pointer' }}>Explain ↗</button>
            </div>
            {l.cause && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 20px 6px 145px', fontSize: 10.5, color: '#ff8a8a' }}>
                <span style={{ color: '#ff5c5c' }}>↳ CAUSED by</span>
                <span style={{ color: '#e8edf4' }}>{nameOf(l.cause)}</span>
                <span style={{ color: '#5e6b7e' }}>·</span>
                <span style={{ background: 'rgba(255,92,92,.12)', border: '1px solid rgba(255,92,92,.3)', borderRadius: 5, padding: '1px 7px', color: '#ff5c5c', fontWeight: 600 }}>conf {l.conf}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
