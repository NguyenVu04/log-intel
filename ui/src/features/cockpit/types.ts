export type ViewId = 'command' | 'graph' | 'logs' | 'chat' | 'anomalies' | 'runbooks'
export type Health = 'nominal' | 'degraded' | 'incident' | 'deploy'
export type Severity = 'TRACE' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'FATAL'
export type SevFilter = 'all' | 'warn' | 'error'
export type CompareLayout = 'overlay' | 'side'
export type StepStatus = 'idle' | 'running' | 'done'

export interface ServiceNode {
  id: string
  label: string
  kind: 'Service' | 'Deployment'
  health: Health
  err: string
  x: number
  y: number
}

export interface GraphEdge {
  from: string
  to: string
  type: string
  conf: number
  active: boolean
}

export interface DiffEdge extends GraphEdge {
  status: 'added' | 'removed' | 'changed' | 'same'
  delta?: number
  fromConf?: number
}

export interface LogRow {
  t: string
  sev: Severity
  service: string
  msg: string
  cause: string | null
  conf: string | null
  line?: number
}

export interface RunbookStep {
  n: number
  text: string
  status: StepStatus
}

export interface ChatCitation {
  label: string
  kind: 'log' | 'graph'
}

export interface ChatAst {
  type: string
  filters: string[]
  timeRange: string
  limit: number
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  full: string
  shown: string
  done: boolean
  cites: ChatCitation[]
  ast: ChatAst | null
  runbook: boolean
}

export interface Snapshot {
  id: string
  label: string
  edges: GraphEdge[]
}

export interface Anomaly {
  id: string
  service: string
  metric: string
  sev: 'critical' | 'warning' | 'info'
  score: number
  dir: 'up' | 'down'
  when: string
  baseline: string
  current: string
  forecast: string
  desc: string
  causal: string
  bandLo: number
  bandHi: number
  thr: number
  hist: number[]
  fc: number[]
}

export interface RunbookData {
  id: string
  conf: string
  used: number
  last: string
  sym: string
  svc: string
  time: string
  drift: string
}

export interface LibraryQuery {
  label: string
  type: string
  uses: number
}

export interface CockpitState {
  view: ViewId
  compareMode: boolean
  compareLayout: CompareLayout
  compareA: string
  compareB: string
  showExport: boolean
  copied: boolean
  selectedAnomaly: string
  logs: LogRow[]
  tailing: boolean
  query: string
  sevFilter: SevFilter
  svcFilter: string
  selectedNode: string
  confThreshold: number
  scrub: number
  mttr: number
  resolved: boolean
  runbookSteps: RunbookStep[]
  applying: boolean
  edgeConfirmed: boolean
  eventsJitter: number
  messages: ChatMessage[]
  slashOpen: boolean
  draft: string
}
