export type IconName = 'command' | 'graph' | 'logs' | 'chat' | 'anomalies' | 'runbooks' | 'settings' | 'search'

export function Icon({ name }: { name: IconName }) {
  const s = { width: 19, height: 19, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

  switch (name) {
    case 'command':
      return (
        <svg {...s}>
          <rect x={4} y={4} width={7} height={7} rx={1.6} />
          <rect x={13} y={4} width={7} height={7} rx={1.6} />
          <rect x={4} y={13} width={7} height={7} rx={1.6} />
          <rect x={13} y={13} width={7} height={7} rx={1.6} />
        </svg>
      )
    case 'graph':
      return (
        <svg {...s}>
          <circle cx={6} cy={7} r={2.4} />
          <circle cx={18} cy={6} r={2.4} />
          <circle cx={13} cy={18} r={2.4} />
          <line x1={8} y1={8} x2={11.5} y2={16} />
          <line x1={16} y1={7.4} x2={14.2} y2={16} />
          <line x1={8} y1={6.6} x2={15.6} y2={6.2} />
        </svg>
      )
    case 'logs':
      return (
        <svg {...s}>
          <line x1={5} y1={7} x2={19} y2={7} />
          <line x1={5} y1={12} x2={19} y2={12} />
          <line x1={5} y1={17} x2={14} y2={17} />
        </svg>
      )
    case 'chat':
      return (
        <svg {...s}>
          <path d="M4.5 6.5C4.5 5.4 5.4 4.5 6.5 4.5h11C18.6 4.5 19.5 5.4 19.5 6.5v6c0 1.1-.9 2-2 2H9l-4 3.2V6.5z" />
        </svg>
      )
    case 'anomalies':
      return (
        <svg {...s}>
          <polyline points="3,13 7,13 9,7 12,18 15,10 17,13 21,13" />
        </svg>
      )
    case 'runbooks':
      return (
        <svg {...s}>
          <rect x={5} y={3.5} width={14} height={17} rx={2} />
          <line x1={8.5} y1={8} x2={15.5} y2={8} />
          <line x1={8.5} y1={11.5} x2={15.5} y2={11.5} />
          <line x1={8.5} y1={15} x2={12.5} y2={15} />
        </svg>
      )
    case 'settings':
      return (
        <svg {...s}>
          <line x1={5} y1={7} x2={19} y2={7} />
          <line x1={5} y1={12} x2={19} y2={12} />
          <line x1={5} y1={17} x2={19} y2={17} />
          <circle cx={9} cy={7} r={2} fill="#0c1119" />
          <circle cx={15} cy={12} r={2} fill="#0c1119" />
          <circle cx={8} cy={17} r={2} fill="#0c1119" />
        </svg>
      )
    case 'search':
      return (
        <svg width={15} height={15} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <circle cx={11} cy={11} r={7} />
          <line x1={16.5} y1={16.5} x2={21} y2={21} />
        </svg>
      )
  }
}
