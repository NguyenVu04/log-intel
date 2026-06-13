import type { Anomaly } from './types'

export function AnomalyChart({ a }: { a: Anomaly }) {
  const W = 620, H = 250, x0 = 14, x1 = 606, top = 18, bot = 206, h = bot - top
  const col = a.sev === 'critical' ? '#ff5c5c' : a.sev === 'warning' ? '#ffb454' : '#5b9dff'
  const { hist, fc } = a
  const nH = hist.length, nF = fc.length
  const xNow = x0 + (x1 - x0) * 0.66
  const xh = (i: number) => x0 + (xNow - x0) * (i / (nH - 1))
  const xf = (i: number) => xNow + (x1 - xNow) * (i / (nF - 1))
  const y = (v: number) => bot - Math.max(0, Math.min(1, v)) * h

  const sp = (i: number) => 5 + (i / (nF - 1)) * 30
  const conePts = [
    ...fc.map((v, i) => `${xf(i).toFixed(1)},${(y(v) - sp(i)).toFixed(1)}`),
    ...fc.map((_v, i) => `${xf(nF - 1 - i).toFixed(1)},${(y(fc[nF - 1 - i]) + sp(nF - 1 - i)).toFixed(1)}`),
  ]
  const areaD = `M ${x0} ${bot} ${hist.map((v, i) => `L ${xh(i).toFixed(1)} ${y(v).toFixed(1)}`).join(' ')} L ${xNow.toFixed(1)} ${bot} Z`
  const histPts = hist.map((v, i) => `${xh(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')
  const fcPts = fc.map((v, i) => `${xf(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ')

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {/* baseline band */}
      <rect x={x0} y={y(a.bandHi)} width={x1 - x0} height={Math.max(2, y(a.bandLo) - y(a.bandHi))} fill="rgba(120,140,170,.10)" />
      <line x1={x0} y1={y(a.bandHi)} x2={x1} y2={y(a.bandHi)} stroke="#3a4761" strokeWidth={1} strokeDasharray="3 4" strokeOpacity={0.6} />
      <line x1={x0} y1={y(a.bandLo)} x2={x1} y2={y(a.bandLo)} stroke="#3a4761" strokeWidth={1} strokeDasharray="3 4" strokeOpacity={0.6} />
      <text x={x0 + 5} y={y(a.bandHi) - 5} fontSize={9} fill="#5e6b7e" fontFamily="'JetBrains Mono',monospace">7-day baseline ±1σ</text>

      {/* 2σ threshold */}
      <line x1={x0} y1={y(a.thr)} x2={x1} y2={y(a.thr)} stroke={col} strokeWidth={1} strokeDasharray="2 5" strokeOpacity={0.5} />
      <text x={x1 - 4} y={y(a.thr) - 5} textAnchor="end" fontSize={9} fill={col} fillOpacity={0.85} fontFamily="'JetBrains Mono',monospace">2σ threshold</text>

      {/* forecast cone */}
      <polygon points={conePts.join(' ')} fill={col} fillOpacity={0.10} />

      {/* area under hist */}
      <path d={areaD} fill={col} fillOpacity={0.12} />

      {/* observed line */}
      <polyline points={histPts} fill="none" stroke={col} strokeWidth={2.2} strokeLinejoin="round" />

      {/* forecast line */}
      <polyline points={fcPts} fill="none" stroke={col} strokeWidth={1.8} strokeDasharray="5 4" strokeOpacity={0.85} />

      {/* now line */}
      <line x1={xNow} y1={top - 4} x2={xNow} y2={bot} stroke="#46505f" strokeWidth={1} strokeDasharray="3 3" />
      <text x={xNow} y={top - 7} textAnchor="middle" fontSize={9} fill="#9aa7b8" fontFamily="'JetBrains Mono',monospace">now</text>
      <text x={(xNow + x1) / 2} y={top - 7} textAnchor="middle" fontSize={9} fill={col} fontFamily="'JetBrains Mono',monospace">forecast · next 15 min</text>

      {/* end dots */}
      <circle cx={xh(nH - 1)} cy={y(hist[nH - 1])} r={3.5} fill={col} stroke="#0a0e14" strokeWidth={1.5} />
      <circle cx={xf(nF - 1)} cy={y(fc[nF - 1])} r={3} fill="none" stroke={col} strokeWidth={1.5} />

      {/* x axis */}
      <line x1={x0} y1={bot} x2={x1} y2={bot} stroke="#1d2532" strokeWidth={1} />
    </svg>
  )
}
