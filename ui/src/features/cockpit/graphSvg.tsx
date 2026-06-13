import type { ServiceNode, GraphEdge, DiffEdge, Health } from './types'
import { HEALTH_COLOR, EDGE_COLOR } from './data'

interface GraphSvgProps {
  nodes: ServiceNode[]
  edges: (GraphEdge | DiffEdge)[]
  opts?: {
    health?: Record<string, string>
    threshold?: number
    interactive?: boolean
    diff?: boolean
  }
  selectedNode?: string
  onSelectNode?: (id: string) => void
}

const DIFF_COLOR: Record<string, string> = {
  added: '#39d98a',
  removed: '#ff5c5c',
  changed: '#ffb454',
  same: '#2f3a4d',
}

function nodeRadius(n: ServiceNode, health: string): number {
  if (n.kind === 'Deployment') return 17
  if (health === 'incident') return 30
  return 24
}

export function GraphSvg({ nodes, edges, opts = {}, selectedNode, onSelectNode }: GraphSvgProps) {
  const byId: Record<string, ServiceNode> = {}
  nodes.forEach(n => { byId[n.id] = n })

  const healthMap = opts.health ?? {}
  const hOf = (n: ServiceNode): string => healthMap[n.id] ?? n.health
  const isDiff = !!opts.diff
  const isInteractive = !!opts.interactive
  const th = opts.threshold ?? 0

  const list: (GraphEdge | DiffEdge)[] = isDiff
    ? edges
    : edges.filter(e => e.type === 'CALLS' || e.conf >= th)

  return (
    <svg
      viewBox="0 0 1080 580"
      width="100%"
      height="100%"
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block', position: 'absolute', inset: 0 }}
    >
      <defs>
        {['CAUSED', 'CALLS', 'PRECEDED', 'RESOLVED_BY', 'SIMILAR_TO'].map(type => (
          <marker key={type} id={`arr-${type}`} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={EDGE_COLOR[type] ?? '#3a4761'} />
          </marker>
        ))}
        {['added', 'removed', 'changed', 'same'].map(status => (
          <marker key={status} id={`arr-${status}`} viewBox="0 0 10 10" refX={8} refY={5} markerWidth={6} markerHeight={6} orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill={DIFF_COLOR[status]} />
          </marker>
        ))}
      </defs>

      {list.map((e, i) => {
        const a = byId[e.from]
        const b = byId[e.to]
        if (!a || !b) return null

        const dx = b.x - a.x, dy = b.y - a.y
        const len = Math.hypot(dx, dy) || 1
        const ux = dx / len, uy = dy / len
        const ra = nodeRadius(a, hOf(a))
        const rb = nodeRadius(b, hOf(b)) + 9
        const x1 = a.x + ux * ra, y1 = a.y + uy * ra
        const x2 = b.x - ux * rb, y2 = b.y - uy * rb

        let col: string, w: number, dash: string, op: number, animate: boolean, markerId: string, label: string | null

        if (isDiff) {
          const de = e as DiffEdge
          col = DIFF_COLOR[de.status] ?? '#3a4761'
          w = de.status === 'same' ? 1.2 : 2.6
          dash = de.status === 'removed' ? '6 5' : de.status === 'same' ? '2 6' : '0'
          op = de.status === 'same' ? 0.4 : 0.96
          animate = de.status === 'added'
          markerId = `arr-${de.status}`
          label = de.status === 'same' ? null
            : de.status === 'changed' ? `${(de.fromConf ?? 0).toFixed(2)}→${e.conf.toFixed(2)}`
            : e.conf.toFixed(2)
        } else {
          const isCausal = e.type !== 'CALLS'
          const active = (e as GraphEdge).active && isCausal
          col = EDGE_COLOR[e.type] ?? '#3a4761'
          w = e.type === 'CALLS' ? 1.3 : 1.6 + e.conf * 4.2
          dash = active ? '7 7' : e.type === 'CALLS' ? '2 6' : '0'
          op = e.type === 'CALLS' ? 0.45 : 0.92
          animate = active
          markerId = `arr-${e.type}`
          label = isCausal ? (e.type === 'CAUSED' ? e.conf.toFixed(2) : e.type.toLowerCase()) : null
        }

        const mx = (x1 + x2) / 2, my = (y1 + y2) / 2
        const lw = label && label.length > 5 ? 58 : 46

        return (
          <g key={`e${i}`}>
            <line
              x1={x1} y1={y1} x2={x2} y2={y2}
              stroke={col} strokeWidth={w} strokeOpacity={op}
              strokeLinecap="round" strokeDasharray={dash}
              className={animate ? 'edge-flow' : undefined}
              markerEnd={`url(#${markerId})`}
            />
            {label && (
              <>
                <rect x={mx - lw / 2} y={my - 9} width={lw} height={17} rx={4} fill="#0a0e14" stroke={col} strokeOpacity={0.5} />
                <text x={mx} y={my + 3.5} textAnchor="middle" fontSize={9} fill={col} fontFamily="'JetBrains Mono',monospace">{label}</text>
              </>
            )}
          </g>
        )
      })}

      {nodes.map(n => {
        const r = nodeRadius(n, hOf(n))
        const hv = hOf(n) as Health
        const col = HEALTH_COLOR[hv] ?? '#5e6b7e'
        const isSelected = isInteractive && selectedNode === n.id

        return (
          <g
            key={n.id}
            style={{ cursor: isInteractive ? 'pointer' : 'default' }}
            onClick={isInteractive ? () => onSelectNode?.(n.id) : undefined}
          >
            {hv === 'incident' && (
              <circle cx={n.x} cy={n.y} r={r + 15} fill={col} opacity={0.18} className="anim-glow" />
            )}
            {isSelected && (
              <circle cx={n.x} cy={n.y} r={r + 8} fill="none" stroke="#fff" strokeWidth={1.2} strokeOpacity={0.65} />
            )}
            <circle cx={n.x} cy={n.y} r={r} fill="#0f141c" stroke={col} strokeWidth={2.6} />
            <circle cx={n.x} cy={n.y} r={r - 7} fill={col} opacity={n.kind === 'Deployment' ? 0.55 : 0.18} />
            <text x={n.x} y={n.y + r + 16} textAnchor="middle" fontSize={11.5} fill="#cdd6e3" fontFamily="'JetBrains Mono',monospace">{n.label}</text>
            <text x={n.x} y={n.y + r + 29} textAnchor="middle" fontSize={9.5} fill="#5e6b7e" fontFamily="'JetBrains Mono',monospace">{n.err}</text>
          </g>
        )
      })}
    </svg>
  )
}
