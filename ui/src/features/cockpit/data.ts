import type { ServiceNode, GraphEdge, LogRow, RunbookData, Snapshot, Anomaly, LibraryQuery } from './types'

export const HEALTH_COLOR: Record<string, string> = {
  nominal: '#39d98a',
  degraded: '#ffb454',
  incident: '#ff5c5c',
  deploy: '#a78bfa',
}

export const HEALTH_GLOW: Record<string, string> = {
  nominal: 'rgba(57,217,138,.5)',
  degraded: 'rgba(255,180,84,.5)',
  incident: 'rgba(255,92,92,.6)',
  deploy: 'rgba(167,139,250,.5)',
}

export const SEV_COLOR: Record<string, string> = {
  TRACE: '#48515f',
  DEBUG: '#5e6b7e',
  INFO: '#5b9dff',
  WARN: '#ffb454',
  ERROR: '#ff5c5c',
  FATAL: '#ff3b6b',
}

export const SEV_LEVEL: Record<string, number> = {
  TRACE: 0, DEBUG: 1, INFO: 2, WARN: 3, ERROR: 4, FATAL: 5,
}

export const EDGE_COLOR: Record<string, string> = {
  CAUSED: '#ff5c5c',
  CALLS: '#3a4761',
  PRECEDED: '#a78bfa',
  RESOLVED_BY: '#39d98a',
  SIMILAR_TO: '#2dd4bf',
}

export const SERVICES: ServiceNode[] = [
  { id: 'auth-svc',      label: 'auth-svc',           kind: 'Service',    health: 'nominal',  err: '0.0/s',       x: 155, y: 120 },
  { id: 'api-gateway',   label: 'api-gateway',        kind: 'Service',    health: 'degraded', err: '3.1/s · 503', x: 175, y: 300 },
  { id: 'payment-svc',   label: 'payment-svc',        kind: 'Service',    health: 'incident', err: '12.4/s',      x: 445, y: 200 },
  { id: 'checkout-svc',  label: 'checkout-svc',       kind: 'Service',    health: 'degraded', err: '1.2/s',       x: 445, y: 430 },
  { id: 'redis-cache',   label: 'redis-cache',        kind: 'Service',    health: 'incident', err: 'mem 94%',     x: 715, y: 150 },
  { id: 'order-svc',     label: 'order-svc',          kind: 'Service',    health: 'nominal',  err: '0.2/s',       x: 735, y: 360 },
  { id: 'postgres-main', label: 'postgres-main',      kind: 'Service',    health: 'nominal',  err: '0.0/s',       x: 935, y: 280 },
  { id: 'notify-svc',    label: 'notification-svc',   kind: 'Service',    health: 'nominal',  err: '0.1/s',       x: 715, y: 490 },
  { id: 'deploy-redis',  label: 'redis-cache@v2.1.0', kind: 'Deployment', health: 'deploy',   err: '14m ago',     x: 935, y: 90  },
]

export const EDGES: GraphEdge[] = [
  { from: 'deploy-redis',  to: 'redis-cache',   type: 'PRECEDED', conf: 0.85, active: true  },
  { from: 'redis-cache',   to: 'payment-svc',   type: 'CAUSED',   conf: 0.91, active: true  },
  { from: 'payment-svc',   to: 'api-gateway',   type: 'CAUSED',   conf: 0.78, active: true  },
  { from: 'api-gateway',   to: 'payment-svc',   type: 'CALLS',    conf: 0.40, active: false },
  { from: 'api-gateway',   to: 'checkout-svc',  type: 'CALLS',    conf: 0.35, active: false },
  { from: 'api-gateway',   to: 'auth-svc',      type: 'CALLS',    conf: 0.30, active: false },
  { from: 'checkout-svc',  to: 'payment-svc',   type: 'CALLS',    conf: 0.33, active: false },
  { from: 'payment-svc',   to: 'redis-cache',   type: 'CALLS',    conf: 0.45, active: false },
  { from: 'order-svc',     to: 'postgres-main', type: 'CALLS',    conf: 0.32, active: false },
  { from: 'checkout-svc',  to: 'order-svc',     type: 'CALLS',    conf: 0.28, active: false },
  { from: 'notify-svc',    to: 'order-svc',     type: 'CALLS',    conf: 0.20, active: false },
]

export const SEED_LOGS: LogRow[] = [
  { t: '02:34:51.402', sev: 'ERROR', service: 'payment-svc',   msg: 'TimeoutException: redis GET payment:session:8842 exceeded 250ms',    cause: 'redis-cache',  conf: '0.91', line: 4421 },
  { t: '02:34:50.911', sev: 'ERROR', service: 'payment-svc',   msg: 'ConnectionRefused: redis-cache:6379 connection pool exhausted',        cause: 'redis-cache',  conf: '0.88' },
  { t: '02:34:50.318', sev: 'WARN',  service: 'payment-svc',   msg: 'retrying redis GET — attempt 3/3',                                     cause: null,           conf: null   },
  { t: '02:34:49.774', sev: 'ERROR', service: 'redis-cache',   msg: "OOM command not allowed when used memory > 'maxmemory'",               cause: 'deploy-redis', conf: '0.86', line: 9008 },
  { t: '02:34:49.120', sev: 'WARN',  service: 'redis-cache',   msg: 'maxmemory 4.0G reached — evicting keys (policy=allkeys-lru)',          cause: 'deploy-redis', conf: '0.84' },
  { t: '02:34:48.655', sev: 'INFO',  service: 'api-gateway',   msg: 'GET /v1/checkout 503 upstream=payment-svc 251ms',                      cause: null,           conf: null   },
  { t: '02:34:48.002', sev: 'ERROR', service: 'payment-svc',   msg: 'charge failed txn_88421 gateway_timeout',                              cause: 'redis-cache',  conf: '0.79', line: 4402 },
  { t: '02:34:47.530', sev: 'INFO',  service: 'order-svc',     msg: 'order ord_55120 created total=$84.20',                                 cause: null,           conf: null   },
  { t: '02:34:47.001', sev: 'DEBUG', service: 'checkout-svc',  msg: 'cart cart_771 revalidated — 12 items',                                 cause: null,           conf: null   },
  { t: '02:34:46.488', sev: 'WARN',  service: 'checkout-svc',  msg: 'p95 latency 840ms exceeds SLO 500ms',                                  cause: null,           conf: null   },
  { t: '02:34:46.010', sev: 'INFO',  service: 'auth-svc',      msg: 'token refreshed sub=usr_99213',                                        cause: null,           conf: null   },
  { t: '02:34:45.300', sev: 'INFO',  service: 'redis-cache',   msg: 'deployment v2.1.0 applied · maxmemory-policy changed',                 cause: null,           conf: null   },
  { t: '02:34:44.870', sev: 'INFO',  service: 'notify-svc',    msg: 'email queued recv=usr_99213',                                          cause: null,           conf: null   },
  { t: '02:34:44.221', sev: 'TRACE', service: 'api-gateway',   msg: 'trace_id=7f3a92 span=ingress dur=251ms',                               cause: null,           conf: null   },
  { t: '02:34:43.700', sev: 'INFO',  service: 'postgres-main', msg: 'checkpoint complete — 1240 buffers flushed',                           cause: null,           conf: null   },
]

export const LOG_TAIL_SAMPLES: Array<Omit<LogRow, 't'>> = [
  { sev: 'INFO',  service: 'api-gateway',  msg: 'GET /v1/orders 200 42ms',                     cause: null,           conf: null   },
  { sev: 'DEBUG', service: 'checkout-svc', msg: 'cart revalidated — items',                     cause: null,           conf: null   },
  { sev: 'INFO',  service: 'order-svc',    msg: 'order created',                                cause: null,           conf: null   },
  { sev: 'WARN',  service: 'payment-svc',  msg: 'retrying redis GET — attempt 2/3',              cause: 'redis-cache',  conf: '0.83' },
  { sev: 'ERROR', service: 'payment-svc',  msg: 'TimeoutException: redis GET exceeded 250ms',    cause: 'redis-cache',  conf: '0.90' },
  { sev: 'INFO',  service: 'auth-svc',     msg: 'token refreshed',                               cause: null,           conf: null   },
  { sev: 'TRACE', service: 'api-gateway',  msg: 'span=ingress',                                  cause: null,           conf: null   },
  { sev: 'WARN',  service: 'redis-cache',  msg: 'evicting keys (policy=allkeys-lru)',             cause: 'deploy-redis', conf: '0.82' },
]

export const RUNBOOKS_DATA: RunbookData[] = [
  { id: 'rb_a3f9c2', conf: '0.91', used: 7,  last: '3 days ago',  sym: 'TimeoutException + ConnectionRefused', svc: 'payment-svc, redis-cache',   time: '~3 min', drift: 'none'   },
  { id: 'rb_7c1e08', conf: '0.84', used: 4,  last: '1 week ago',  sym: '5xx surge + pool exhaustion',          svc: 'api-gateway, payment-svc',    time: '~6 min', drift: 'none'   },
  { id: 'rb_19be4d', conf: '0.62', used: 11, last: '12 days ago', sym: 'p95 latency SLO breach',               svc: 'checkout-svc, order-svc',     time: '~8 min', drift: 'review' },
]

export const LIBRARY: LibraryQuery[] = [
  { label: 'payment-svc timeouts in last 1h',   type: 'log_search',    uses: 12 },
  { label: 'redis OOM eviction events',          type: 'log_search',    uses: 7  },
  { label: '5xx grouped by upstream service',    type: 'log_search',    uses: 5  },
  { label: 'anomalies on payment domain',        type: 'anomaly_query', uses: 4  },
]

export const SNAPSHOTS: Snapshot[] = [
  {
    id: 'baseline', label: 'Baseline · 7d',
    edges: [
      { from: 'api-gateway',  to: 'payment-svc',   type: 'CALLS', conf: 0.40, active: false },
      { from: 'api-gateway',  to: 'checkout-svc',  type: 'CALLS', conf: 0.35, active: false },
      { from: 'api-gateway',  to: 'auth-svc',      type: 'CALLS', conf: 0.30, active: false },
      { from: 'checkout-svc', to: 'payment-svc',   type: 'CALLS', conf: 0.33, active: false },
      { from: 'payment-svc',  to: 'redis-cache',   type: 'CALLS', conf: 0.20, active: false },
      { from: 'order-svc',    to: 'postgres-main', type: 'CALLS', conf: 0.32, active: false },
      { from: 'checkout-svc', to: 'order-svc',     type: 'CALLS', conf: 0.28, active: false },
      { from: 'notify-svc',   to: 'order-svc',     type: 'CALLS', conf: 0.20, active: false },
      { from: 'auth-svc',     to: 'postgres-main', type: 'CALLS', conf: 0.25, active: false },
    ],
  },
  {
    id: 'predeploy', label: 'Pre-deploy · 02:20',
    edges: [
      { from: 'api-gateway',  to: 'payment-svc',   type: 'CALLS', conf: 0.40, active: false },
      { from: 'api-gateway',  to: 'checkout-svc',  type: 'CALLS', conf: 0.35, active: false },
      { from: 'api-gateway',  to: 'auth-svc',      type: 'CALLS', conf: 0.30, active: false },
      { from: 'checkout-svc', to: 'payment-svc',   type: 'CALLS', conf: 0.33, active: false },
      { from: 'payment-svc',  to: 'redis-cache',   type: 'CALLS', conf: 0.22, active: false },
      { from: 'order-svc',    to: 'postgres-main', type: 'CALLS', conf: 0.32, active: false },
      { from: 'checkout-svc', to: 'order-svc',     type: 'CALLS', conf: 0.28, active: false },
      { from: 'notify-svc',   to: 'order-svc',     type: 'CALLS', conf: 0.20, active: false },
    ],
  },
  {
    id: 'now', label: 'Now · 02:34',
    edges: [
      { from: 'deploy-redis',  to: 'redis-cache',   type: 'PRECEDED', conf: 0.85, active: true  },
      { from: 'redis-cache',   to: 'payment-svc',   type: 'CAUSED',   conf: 0.91, active: true  },
      { from: 'payment-svc',   to: 'api-gateway',   type: 'CAUSED',   conf: 0.78, active: true  },
      { from: 'api-gateway',   to: 'payment-svc',   type: 'CALLS',    conf: 0.40, active: false },
      { from: 'api-gateway',   to: 'checkout-svc',  type: 'CALLS',    conf: 0.35, active: false },
      { from: 'api-gateway',   to: 'auth-svc',      type: 'CALLS',    conf: 0.30, active: false },
      { from: 'checkout-svc',  to: 'payment-svc',   type: 'CALLS',    conf: 0.33, active: false },
      { from: 'payment-svc',   to: 'redis-cache',   type: 'CALLS',    conf: 0.45, active: false },
      { from: 'order-svc',     to: 'postgres-main', type: 'CALLS',    conf: 0.32, active: false },
      { from: 'checkout-svc',  to: 'order-svc',     type: 'CALLS',    conf: 0.28, active: false },
      { from: 'notify-svc',    to: 'order-svc',     type: 'CALLS',    conf: 0.20, active: false },
    ],
  },
]

export const ANOMALIES: Anomaly[] = [
  {
    id: 'redis-mem', service: 'redis-cache', metric: 'memory_usage', sev: 'critical', score: 3.8, dir: 'up',
    when: '14m ago', baseline: '62%', current: '94%', forecast: 'OOM in ~6 min',
    desc: 'Crossed 2σ above the 7-day baseline immediately after deploy v2.1.0.',
    causal: 'Upstream root cause of INC-2291 → payment-svc (0.91)',
    bandLo: 0.55, bandHi: 0.69, thr: 0.78,
    hist: [0.60, 0.61, 0.62, 0.60, 0.63, 0.61, 0.65, 0.71, 0.80, 0.88, 0.94],
    fc: [0.94, 0.98, 1.0, 1.0, 1.0],
  },
  {
    id: 'pay-err', service: 'payment-svc', metric: 'error_rate', sev: 'critical', score: 5.2, dir: 'up',
    when: '13m ago', baseline: '0.3/s', current: '12.4/s', forecast: 'Sustained until redis recovers',
    desc: 'Error rate spiked ~40× over baseline within 90 seconds.',
    causal: 'Caused by redis-cache (0.91)',
    bandLo: 0.05, bandHi: 0.16, thr: 0.30,
    hist: [0.08, 0.10, 0.09, 0.11, 0.10, 0.12, 0.20, 0.45, 0.70, 0.85, 0.92],
    fc: [0.92, 0.93, 0.90, 0.91, 0.92],
  },
  {
    id: 'gw-lat', service: 'api-gateway', metric: 'p95_latency', sev: 'warning', score: 2.3, dir: 'up',
    when: '12m ago', baseline: '180ms', current: '251ms', forecast: '~320ms within 15 min',
    desc: 'Gradual climb, 2.3σ above baseline as upstream timeouts accumulate.',
    causal: 'Downstream of payment-svc (0.78)',
    bandLo: 0.38, bandHi: 0.52, thr: 0.70,
    hist: [0.44, 0.46, 0.45, 0.47, 0.48, 0.50, 0.52, 0.55, 0.58, 0.60, 0.62],
    fc: [0.62, 0.66, 0.70, 0.74, 0.78],
  },
  {
    id: 'checkout-lat', service: 'checkout-svc', metric: 'p95_latency', sev: 'warning', score: 2.0, dir: 'up',
    when: '11m ago', baseline: '500ms', current: '840ms', forecast: 'Stabilizing',
    desc: 'p95 latency SLO breach (500ms target).',
    causal: 'Downstream of payment-svc',
    bandLo: 0.42, bandHi: 0.58, thr: 0.72,
    hist: [0.50, 0.52, 0.50, 0.55, 0.60, 0.65, 0.70, 0.74, 0.78, 0.80, 0.80],
    fc: [0.80, 0.80, 0.79, 0.80, 0.80],
  },
  {
    id: 'order-thru', service: 'order-svc', metric: 'throughput', sev: 'info', score: 1.4, dir: 'down',
    when: '9m ago', baseline: '120/s', current: '88/s', forecast: 'Recovering',
    desc: 'Mild dip, 1.4σ below baseline — within tolerance.',
    causal: 'No causal link found',
    bandLo: 0.62, bandHi: 0.78, thr: 0.58,
    hist: [0.72, 0.70, 0.71, 0.69, 0.68, 0.62, 0.56, 0.50, 0.50, 0.52, 0.55],
    fc: [0.55, 0.58, 0.60, 0.62, 0.63],
  },
]
