<div align="center">

<img src="https://img.shields.io/badge/version-0.1.0--alpha-1B3A5C?style=for-the-badge" alt="version"/>
<img src="https://img.shields.io/badge/license-Apache%202.0-2E86AB?style=for-the-badge" alt="license"/>
<img src="https://img.shields.io/badge/status-active%20development-00ACD7?style=for-the-badge" alt="status"/>
<img src="https://img.shields.io/badge/Go-1.22+-00ACD7?style=for-the-badge&logo=go&logoColor=white" alt="go"/>
<img src="https://img.shields.io/badge/Rust-1.78+-CE422B?style=for-the-badge&logo=rust&logoColor=white" alt="rust"/>
<img src="https://img.shields.io/badge/Java-21+-E67E22?style=for-the-badge&logo=openjdk&logoColor=white" alt="java"/>
<img src="https://img.shields.io/badge/React-18+-0B7285?style=for-the-badge&logo=react&logoColor=white" alt="react"/>

<br/>
<br/>

```
██╗      ██████╗  ██████╗ ██╗███╗   ██╗████████╗███████╗██╗
██║     ██╔═══██╗██╔════╝ ██║████╗  ██║╚══██╔══╝██╔════╝██║
██║     ██║   ██║██║  ███╗██║██╔██╗ ██║   ██║   █████╗  ██║
██║     ██║   ██║██║   ██║██║██║╚██╗██║   ██║   ██╔══╝  ██║
███████╗╚██████╔╝╚██████╔╝██║██║ ╚████║   ██║   ███████╗███████╗
╚══════╝ ╚═════╝  ╚═════╝ ╚═╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝╚══════╝
```

### **Causal Log Intelligence Platform**

*Beyond log aggregation — LogIntel understands causality, learns from every incident resolution,*
*and answers your questions in plain English.*

<br/>

[📖 Documentation](#-documentation) · [🚀 Quick Start](#-quick-start) · [🏗 Architecture](#-system-architecture) · [✨ Features](#-key-features) · [🗺 Roadmap](#-roadmap) · [🤝 Contributing](#-contributing)

<br/>

</div>

---

## 📌 What is LogIntel?

Most observability tools answer **"what happened?"** — they collect logs, store them, and let you search. LogIntel is built to answer the harder and more valuable questions:

> **"Why did it happen? What caused what? And how did we fix it last time?"**

LogIntel is a polyglot observability platform combining four capabilities that have never existed together in any single tool — commercial or open-source:

| # | Capability | Description |
|---|-----------|-------------|
| **1** | **Standard log collection** | Lightweight Go sidecar, OTLP-compatible, runs in every Kubernetes pod |
| **2** | **Causal knowledge graph** | Statistically-scored cause-and-effect relationships — not just static service topology |
| **3** | **Runbook learning** | The system learns from every resolved incident and builds your team's institutional memory automatically |
| **4** | **NL query compiler** | Plain English compiles to LogQL+ — a typed, saveable, shareable query language |

<br/>

### The problem LogIntel solves

```
A typical incident without LogIntel:

  02:34 — Alert fires: payment-svc error rate spikes
  02:34 — Engineer opens Grafana, manually searches logs
  02:41 — Finds redis-cache is involved, but unclear why
  02:48 — Searches Confluence, finds a stale runbook
  02:55 — Tries restarting services — no effect
  03:10 — Finally identifies root cause: Redis memory pressure
  03:22 — Incident resolved.  MTTR: 48 minutes.

The same incident with LogIntel:

  02:34 — Alert fires
  02:34 — LogIntel shows: payment-svc ← [CAUSED, confidence 0.91] ← redis-cache
  02:35 — Chat surfaces: "similar incident occurred before, here is the runbook that worked"
  02:38 — Engineer applies runbook, incident resolved.  MTTR: 4 minutes.
```

<br/>

---

## ✨ Key Features

### 🔍 Causal Knowledge Graph

This is the core differentiator. Where other tools store a static topology map of service calls, LogIntel builds a **dynamic causal graph** where every edge carries a statistically-derived confidence weight computed via Granger causality testing.

```
payment-svc ──[CAUSED, p=0.003, confidence=0.91]──► redis-cache
     │                                                     │
     │                                            [CAUSED, p=0.021]
     │                                                     │
     └──[CALLS, freq=2400/min]──── api-gateway ◄───────────┘
```

- **Granger causality test** runs continuously on a 10-minute sliding window with a 1-minute lag over per-service log-derived metrics
- **Edge lifecycle**: a new CAUSED edge is created when p < 0.05 over three consecutive windows; edges decay 5%/hour without reinforcement and are pruned below confidence 0.1
- **Engineer confirmation**: an edge confirmed via chat is pinned at confidence = 1.0 and excluded from decay
- **Graph snapshots**: the graph state at any past timestamp is queryable — essential for post-incident review

<details>
<summary><b>Example: causal path query in LogQL+</b></summary>

```sql
-- Find the shortest causal path from payment-svc to the incident root
graph
  | from service="payment-svc"
  | traverse CAUSED confidence>0.7
  | depth 3
  | since 24h
```

Result:
```
payment-svc [error_rate=12.4/s]
  └─CAUSED(0.91)─► redis-cache [memory_usage=94%]
       └─PRECEDED(0.85)─► deployment/redis-cache@v2.1.0 [deployed 14min ago]
```

</details>

<br/>

### 🧠 Runbook Learning — Automatic Institutional Memory

Every resolved incident becomes a lesson. LogIntel automatically:

1. **Captures** a symptom fingerprint: error classes, service graph subgraph topology, 768-dim semantic embedding
2. **Records** the resolution steps extracted from the engineer's chat interaction
3. **Validates** effectiveness by monitoring log signals for 30 minutes post-resolution
4. **Detects drift**: if a runbook stops working, it is automatically flagged for review
5. **Suggests** matching runbooks when a new incident has a similar fingerprint (cosine similarity on embeddings)

```
📋 Runbook #rb_a3f9c2
   Confidence: 0.91 | Used: 7 times | Last triggered: 3 days ago

   Symptoms:   TimeoutException + ConnectionRefused
   Services:   payment-svc, redis-cache

   Resolution steps:
   1. Check Redis memory usage — alert threshold: > 85%
   2. kubectl rollout restart deployment/redis-cache
   3. Confirm payment-svc error rate drops within 90 seconds

   Expected resolution time: ~3 minutes
   ⚠️  Drift flag: none
```

**The compounding value**: after six months of production use, the runbook store encodes your team's hard-won operational knowledge in a form that is accurate, searchable, and automatically maintained — something no static documentation achieves.

<br/>

### 💬 Natural Language Query Compiler

Plain English → typed LogQL+ AST → safe execution. The LLM never generates raw query strings.

```
Engineer: "Show me all timeout errors in payment-svc that happened
           around the same time as the Redis restart yesterday"

Compiles to:
┌─────────────────────────────────────────────────────────────┐
│  LogQL+ AST                                                 │
│  type:     LOG_SEARCH                                       │
│  filters:                                                   │
│    - service    = "payment-svc"                             │
│    - severity  >= ERROR                                     │
│    - message contains "timeout"                             │
│    - timestamp WITHIN 5min OF                               │
│        (graph.event type=DEPLOYMENT service=redis-cache)    │
│  timeRange:  yesterday                                      │
│  limit:      100                                            │
└─────────────────────────────────────────────────────────────┘
```

**Four-stage compilation pipeline:**

| Stage | Technology | What happens |
|-------|-----------|--------------|
| Intent classification | Fine-tuned classifier (LangChain4j) | Classifies query as `log_search`, `graph_query`, `runbook_lookup`, or `anomaly_query` |
| Entity extraction | NER model (ONNX) | Extracts service names, time ranges, severity levels, error class names |
| AST synthesis | LLM with typed output schema | Generates a structured JSON AST — never a raw string |
| Validation & execution | Java query executor | Validates against schema, optimises execution plan, dispatches to Rust query API |

**Query Library**: every successfully-executed query is tracked. Queries used more than three times are automatically promoted to the team-wide library and appear as one-click shortcuts in the UI, ranked by relevance to the current incident context.

<br/>

### 📊 Three purpose-built React views

**Causal Graph Explorer**
- Cytoscape.js with `cytoscape-fcose` layout and WebGL renderer — handles 500+ nodes smoothly
- Node color encodes health: green (nominal) → amber (degraded) → red (incident)
- Edge thickness encodes causal confidence weight
- Active CAUSED edges pulse with a subtle animation
- Click any node: side panel shows last 20 relevant log lines, active runbooks, and the causal subgraph for the current incident
- Time scrubber to replay the graph state at any past timestamp

**Log Explorer with Causal Context**
- TanStack Virtual — never renders more than 200 DOM rows regardless of log volume
- Live tail via Server-Sent Events with pause/resume
- Every log line participating in an active causal edge is highlighted with its confidence score
- "Explain this error" button on any log line — opens chat with the line pre-loaded as context
- All filter state encoded in URL params from day one — every query is a shareable link

**Chat Interface**
- Token streaming via `ReadableStream` from the SSE endpoint — rendered incrementally
- Citation chips: clicking `[payment-svc:line 4421]` jumps directly to that log line
- Graph citations: `[payment-svc → redis-cache, conf 0.87]` opens the causal graph at that edge
- Runbook suggestions rendered inline as expandable cards
- Slash commands: `/graph <service>`, `/anomalies last-1h`, `/runbooks`, `/resolve`
- Conversation history persisted in `localStorage` with a 24-hour TTL

<br/>

---

## 🏗 System Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          Kubernetes Cluster                          │
│                                                                      │
│  ┌───────────────┐   ┌───────────────┐   ┌───────────────┐          │
│  │   App Pod     │   │   App Pod     │   │   App Pod     │          │
│  │ ┌───────────┐ │   │ ┌───────────┐ │   │ ┌───────────┐ │          │
│  │ │    App    │ │   │ │    App    │ │   │ │    App    │ │          │
│  │ ├───────────┤ │   │ ├───────────┤ │   │ ├───────────┤ │          │
│  │ │  Sidecar  │ │   │ │  Sidecar  │ │   │ │  Sidecar  │ │          │
│  │ │   (Go)    │ │   │ │   (Go)    │ │   │ │   (Go)    │ │          │
│  └──────┬────────┘   └──────┬────────┘   └──────┬────────┘          │
│         │                   │                   │                    │
│         └───────────────────┼───────────────────┘                   │
│                             │  gRPC  ·  LogEvent protobuf            │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────┐            │
│  │               Intelligence Core  (Rust)              │            │
│  │  ┌─────────────────────────┐  ┌────────────────────┐ │            │
│  │  │   Aggregation & Store   │  │   Causal Graph     │ │            │
│  │  │   tantivy  ·  WAL       │  │   petgraph         │ │            │
│  │  │   LogEvent normaliser   │  │   Granger engine   │ │            │
│  │  └────────────┬────────────┘  └─────────┬──────────┘ │            │
│  └───────────────┼─────────────────────────┼────────────┘            │
│                  │                         │  GraphQL API            │
│                  └──────────┬──────────────┘                         │
│                             │  gRPC                                  │
│                             ▼                                        │
│  ┌──────────────────────────────────────────────────────┐            │
│  │             Retrieval & Chat  (Java)                 │            │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │            │
│  │  │ RAG Pipeline│  │   Chatbot   │  │  NL Query   │  │            │
│  │  │ LangChain4j │  │  Streaming  │  │  Compiler   │  │            │
│  │  │ ONNX embed  │  │  SSE / WS   │  │  LogQL+ AST │  │            │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  │            │
│  │                  Query API Gateway                   │            │
│  └──────────────────────────┬───────────────────────────┘            │
│                             │  REST  +  WebSocket                    │
└─────────────────────────────┼────────────────────────────────────────┘
                              │
                              ▼
            ┌──────────────────────────────┐
            │      React + Vite  (SPA)     │
            │  Graph · Log Explorer · Chat │
            └──────────────────────────────┘
```

### Technology stack

| Layer | Language | Rationale |
|-------|----------|-----------|
| **Collection** | Go | Goroutine model maps perfectly to the sidecar pattern — non-blocking I/O, < 20 MB image, < 96 MB RSS |
| **Intelligence core** | Rust | Zero-cost abstractions for safe concurrent graph mutations; no GC pauses in the ingest path; `petgraph` + `tantivy` |
| **Retrieval & chat** | Java | Mature LangChain4j ecosystem; ONNX Runtime integration; Spring Boot Actuator for K8s health probes |
| **Visualisation** | React + Vite | Pure SPA — no SSR needed for a real-time authenticated dashboard; zero hydration complexity |
| **Schema contract** | Protocol Buffers | Canonical `LogEvent` defined once; Go, Rust, and Java all generate from it |
| **Graph storage** | `petgraph::StableGraph` | Node indices survive deletions — critical for causal edge lifecycle management |
| **Full-text search** | `tantivy` | Lucene-grade indexing speed with no GC pauses |
| **Embeddings** | ONNX (all-MiniLM-L6-v2, 22 MB) | Embedded directly in the Java service — no external embedding API dependency |

<br/>

---

## 🔌 Canonical Log Event Schema

The most important contract in the system. Defined once as a protobuf; every service generates from this definition. Schema drift in polyglot systems is the root cause of the hardest-to-reproduce bugs — one source of truth, enforced at compile time.

```protobuf
message LogEvent {
  string   event_id         = 1;  // UUID v7  (time-ordered)
  int64    timestamp_ns     = 2;  // Unix nanoseconds
  string   service_name     = 3;
  string   namespace        = 4;
  string   pod_name         = 5;
  string   container_name   = 6;
  Severity severity         = 7;  // TRACE / DEBUG / INFO / WARN / ERROR / FATAL
  string   message          = 8;
  string   trace_id         = 9;  // optional — propagated from X-Trace-Id header
  string   span_id          = 10;
  map<string, string> labels = 11;
  bytes    raw_bytes        = 12; // original unmodified log line
}
```

<br/>

---

## 🚀 Quick Start

### Prerequisites

- Docker and Docker Compose
- Kubernetes cluster (or minikube for local development)
- Go 1.22+, Rust 1.78+, Java 21+, Node.js 20+

### Run locally with Docker Compose

```bash
# Clone the repository
git clone https://github.com/your-org/logintel.git
cd logintel

# Start all services
docker compose up -d

# Verify health
docker compose ps

# Open the UI
open http://localhost:3000
```

### Deploy to Kubernetes

```bash
# Apply CRDs and RBAC
kubectl apply -f k8s/crds/
kubectl apply -f k8s/rbac/

# Deploy the Intelligence Core
kubectl apply -f k8s/rust-engine/

# Deploy Retrieval & Chat
kubectl apply -f k8s/java-retrieval/

# Deploy the UI
kubectl apply -f k8s/react-ui/

# Inject the sidecar into your application pods
# See: docs/sidecar-injection.md
```

### Add the sidecar to your pod

```yaml
spec:
  containers:
    - name: your-app
      image: your-app:latest

    # LogIntel sidecar
    - name: logintel-sidecar
      image: logintel/sidecar:latest
      env:
        - name: LOGINTEL_AGGREGATOR_ADDR
          value: "logintel-aggregator:9090"
        - name: LOGINTEL_SERVICE_NAME
          valueFrom:
            fieldRef:
              fieldPath: metadata.labels['app']
        - name: LOGINTEL_LOG_PATHS
          value: "/var/log/app/*.log"
      resources:
        requests:
          memory: "64Mi"
          cpu: "25m"
        limits:
          memory: "96Mi"
          cpu: "50m"
      volumeMounts:
        - name: app-logs
          mountPath: /var/log/app
```

<br/>

---

## 📂 Repository Structure

```
logintel/
├── proto/                           # Canonical protobuf schemas
│   └── log_event.proto              # LogEvent — the central contract
│
├── sidecar/                         # Go — log collection agent
│   ├── cmd/agent/
│   ├── internal/
│   │   ├── tailer/                  # fsnotify + inode-based rotation tracking
│   │   ├── buffer/                  # bounded ring buffer with backpressure metrics
│   │   └── transport/               # gRPC client + exponential backoff retry
│   └── Dockerfile
│
├── engine/                          # Rust — intelligence core
│   ├── aggregator/                  # log parsing, normalisation, tantivy index
│   │   ├── src/
│   │   └── Cargo.toml
│   └── graph/                       # causal knowledge graph
│       ├── src/
│       │   ├── engine.rs            # petgraph StableGraph wrapper
│       │   ├── granger.rs           # Granger causality test implementation
│       │   ├── lifecycle.rs         # edge decay and pruning scheduler
│       │   └── api/                 # GraphQL interface
│       └── Cargo.toml
│
├── retrieval/                       # Java — RAG, chatbot, NL compiler
│   ├── src/main/java/io/logintel/
│   │   ├── rag/                     # LangChain4j embedding + retrieval pipeline
│   │   ├── chat/                    # chatbot service + SSE streaming
│   │   ├── compiler/                # NL → LogQL+ AST compiler
│   │   ├── runbook/                 # runbook store + drift detection
│   │   └── gateway/                 # REST + WebSocket API gateway
│   └── pom.xml
│
├── ui/                              # React + Vite — frontend SPA
│   ├── src/
│   │   ├── features/
│   │   │   ├── graph-explorer/      # Cytoscape.js causal graph view
│   │   │   ├── log-explorer/        # TanStack Virtual log list
│   │   │   └── chat/                # streaming chat interface
│   │   ├── shared/
│   │   └── lib/
│   ├── ARCHITECTURE.md              # frontend conventions and folder structure
│   └── vite.config.ts
│
├── k8s/                             # Kubernetes manifests
├── docs/                            # documentation
│   ├── architecture/
│   ├── api/
│   └── runbook-format.md
└── docker-compose.yml
```

<br/>

---

## 📐 Architecture Decision Records

These decisions were made deliberately. They should not be changed without a corresponding ADR and team discussion.

### ADR-001 — Rust engine starts as a single binary

**Decision**: `aggregator` and `graph` are separate Rust modules with clean internal boundaries, but compiled as one binary in the MVP.

**Rationale**: Aggregation and graph construction have different scaling profiles — the aggregator scales with write throughput, the graph scales with query complexity. Module boundaries are established now so the binary split is straightforward when profiling justifies it. A monolith that can be split is better than a premature microservice split that adds operational overhead before the bottlenecks are known.

### ADR-002 — No Next.js; React + Vite only

**Decision**: The frontend is a pure client-side SPA built with Vite. No server-side rendering.

**Rationale**: The dashboard is a real-time authenticated SPA. No page can be meaningfully server-rendered or statically generated — all data is user-session-specific and changes every few seconds. SSR adds deployment complexity and actively conflicts with WebSocket and SSE streaming state. Next.js's core value proposition is irrelevant here.

### ADR-003 — The LLM never generates raw LogQL+ strings

**Decision**: The NL compiler always produces a typed JSON AST. The LLM output is validated against a schema before execution.

**Rationale**: Raw string generation from an LLM cannot be validated at compile time and opens prompt injection vulnerabilities. A typed AST is inspectable, replayable, and safe to display to the engineer before execution. Showing the compiled query before running it also builds user trust.

### ADR-004 — Protobuf is the single source of truth for LogEvent

**Decision**: `LogEvent` is defined in `proto/log_event.proto`. Go, Rust, and Java all generate their types from this file. No hand-written struct mirrors the schema.

**Rationale**: Schema drift in a polyglot system is the root cause of the hardest-to-reproduce production bugs. One definition, enforced at compile time across all three runtimes, eliminates this entire failure class.

### ADR-005 — Granger test requires minimum event volume

**Decision**: The Granger causality test does not run for a service pair unless both services have at least 500 events in the 10-minute window.

**Rationale**: Granger tests are unreliable on short time series. A false-positive CAUSED edge is actively harmful — it sends engineers in the wrong direction during an incident. No edge is better than a wrong edge.

<br/>

---

## 🗺 Roadmap

### MVP — 11 weeks (current focus)

```
Phase 1  (weeks 1–2)   ████████░░░░  Go sidecar + Rust aggregator + log store
Phase 2  (weeks 3–4)   ░░░░░░░░░░░░  Causal graph + CALLS edges + service map UI
Phase 3  (weeks 5–6)   ░░░░░░░░░░░░  Granger test + CAUSED edges + causal highlighting
Phase 4  (weeks 7–8)   ░░░░░░░░░░░░  Java RAG + chatbot + runbook store (manual seed)
Phase 5  (weeks 9–10)  ░░░░░░░░░░░░  NL query compiler + automated runbook learning
Phase 6  (week 11)     ░░░░░░░░░░░░  Integration, load testing, internal dogfooding
```

### v2.0 — Post-MVP

- [ ] **Predictive anomaly detection** — small ONNX model embedded in the Rust core; forecasts the next 15 minutes of log behavior
- [ ] **Implicit distributed trace reconstruction** — reconstruct trace trees from logs without OpenTelemetry instrumentation
- [ ] **Cross-team anomaly fingerprinting** — match incident patterns across teams and surface historical cross-team resolutions
- [ ] **Deployment edge derivation** — automatically create PRECEDED edges from Kubernetes deployment events
- [ ] **WAL for at-least-once delivery** — durable local write-ahead log in the sidecar
- [ ] **Graph time scrubber** — replay the causal graph state at any arbitrary past timestamp
- [ ] **Runbook export** — push runbook store entries to Confluence, Notion, or PagerDuty

<br/>

---

## 📊 Success Metrics

These are the metrics that determine whether the MVP has succeeded — not vanity metrics, but direct measures of the core value proposition.

| Metric | Target at 90 days |
|--------|-------------------|
| Mean time to identify root cause | < 8 minutes (baseline measured at launch) |
| Runbook suggestion acceptance rate | > 40% of surfaced runbooks accepted by engineers |
| Causal edge precision | > 70% of CAUSED edges confirmed when engineers are prompted |
| NL query compilation success rate | > 85% of queries compile to valid LogQL+ without retry |
| Log ingest end-to-end latency (sidecar → searchable) | < 5 seconds at p99 |
| Sidecar resource overhead | < 50m CPU, < 96 MB RAM per pod at steady state |
| Runbook drift detection true-positive rate | > 60% (validated via engineer feedback) |
| Query library adoption | > 50% of queries use a saved library query after 60 days |

<br/>

---

## 🆚 How LogIntel compares

| Capability | Loki / Grafana | Datadog | Splunk | **LogIntel** |
|------------|---------------|---------|--------|--------------|
| Log collection | ✅ | ✅ | ✅ | ✅ |
| Full-text search | ✅ | ✅ | ✅ | ✅ |
| Service topology | ⚠️ static | ✅ APM | ⚠️ | **✅ causal, confidence-weighted** |
| Anomaly detection | ⚠️ metrics only | ✅ metrics | ⚠️ | **✅ log-semantic causality** |
| AI chat / assistant | ❌ | ⚠️ generic RAG | ⚠️ | **✅ runbook-grounded** |
| Automatic runbook learning | ❌ | ❌ | ❌ | **✅** |
| Natural language → typed query | ❌ | ⚠️ keyword | ⚠️ | **✅ typed AST compiler** |
| Cross-incident learning | ❌ | ❌ | ❌ | **✅ fingerprint similarity** |
| Self-hosted | ✅ | ❌ | ✅ | **✅** |
| Open source | ✅ | ❌ | ❌ | **✅** |

**The defensible moat**: the runbook store and causal graph are self-reinforcing. More incidents → more accurate runbook store → faster resolutions → more resolution data to learn from. After six months of production use, the system's value is not portable to a competing tool. That value belongs to your team.

<br/>

---

## ⚠️ Key Risks

| Risk | Likelihood | Mitigation |
|------|-----------|------------|
| Granger test produces false CAUSED edges at low event volumes | High in early deployment | Require ≥ 500 events/service/window before running. Show confidence intervals in UI. Let engineers reject edges. |
| Runbook store is empty at launch | Certain for new deployments | Seed with manually-written runbooks. Provide a migration tool to import from Confluence / Notion. |
| LLM hallucinates log content in chat responses | Medium | Ground every factual claim in retrieved context. System prompt instructs the LLM to say "I don't have data for this time range" rather than infer. |
| Go sidecar delays application container startup | Low | Sidecar starts asynchronously — it does not block the application container. Validated by a startup benchmark in CI. |
| Rust graph grows unbounded in memory at scale | Medium at high scale | Hot/cold split at 7 days. Cap CAUSED edges per node pair at 10 (keep highest-confidence). Hourly compaction pass. |
| NL compiler generates valid but semantically wrong LogQL+ | Medium | Show the compiled query to the engineer before execution. Allow direct LogQL+ editing. Log all compiler errors for retraining. |

<br/>

---

## 🤝 Contributing

LogIntel is an open-source project in active development. All contributions are welcome.

### Getting started

```bash
# Fork and clone
git clone https://github.com/your-username/logintel.git
cd logintel

# Install development dependencies
make dev-setup

# Run all tests
make test

# Run linters
make lint
```

### Before you open a pull request

Please read [CONTRIBUTING.md](CONTRIBUTING.md). A few important points:

- **Protobuf schema changes** require review from at least two maintainers — this is the contract that affects the entire system
- **Granger implementation changes** must be accompanied by a benchmark test on a real-world log dataset
- **Breaking API changes** require an approved Architecture Decision Record before any code is written

### Areas where contributions are most welcome

- 🦀 **Rust** — optimise Granger causality test performance; improve edge lifecycle logic; WAL implementation
- ☕ **Java** — improve NL query compiler accuracy; expand the LogQL+ AST node types
- ⚛️ **React** — improve Cytoscape.js rendering for large graphs; accessibility improvements
- 📖 **Docs** — deployment guides, runbook format examples, LogQL+ tutorial
- 🧪 **Tests** — integration tests, load testing scripts, Granger test fixtures

<br/>

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [Architecture Overview](docs/architecture/overview.md) | System architecture and key design decisions |
| [Sidecar Injection Guide](docs/sidecar-injection.md) | How to instrument your Kubernetes pods |
| [LogQL+ Reference](docs/api/logql-plus.md) | Complete query language documentation |
| [Runbook Format](docs/runbook-format.md) | Schema and guide for writing seed runbooks |
| [Causal Graph API](docs/api/graph-graphql.md) | GraphQL schema for graph queries |
| [Development Setup](docs/development.md) | Local development environment guide |
| [MVP Design Document](docs/mvp-design.md) | Full product design specification |

<br/>

---

## 📄 License

LogIntel is released under the [Apache License 2.0](LICENSE).

---

<div align="center">

Built by engineers who were tired of searching logs at 3 AM.

**[⭐ Star this repo if you find it useful](https://github.com/your-org/logintel)**

</div>
