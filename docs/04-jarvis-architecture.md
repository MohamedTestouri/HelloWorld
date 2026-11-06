# 04 — JARVIS Control Plane Architecture

*Phase 1 deliverable. Compiled 2026-11-06. Design per master prompt Part XII–XIII, trimmed to what is justified **before** first revenue (principle: revenue before unnecessary complexity).*

## 1. Design mandate

The dashboard/control plane is a **separate persistent system**. AI sessions (Claude or otherwise) are interchangeable clients that read and write business state through the control plane. When a session ends, nothing is lost.

## 2. Target stack (owner-skill aligned, per master prompt)

| Layer | Technology | Rationale |
|---|---|---|
| Dashboard | Angular + TypeScript | Owner's stack; FUI design system (§3) |
| API | ASP.NET Core (modular monolith) | Owner's stack; one deployable, not microservices |
| Orchestration | .NET background services (Phase 2); Python only if ML needs arise | Fewer moving parts initially |
| DB | PostgreSQL | Source of truth; Docker |
| Queue | RabbitMQ (Phase 3+); **PostgreSQL-backed outbox until then** | Avoid extra infra without need |
| Cache | Redis (Phase 3+, only if measured need) | Premature now |
| Secrets | Environment-injected secrets → **HashiCorp Vault in Phase 4** | No plaintext in Git, ever |
| Observability | Structured logging + OpenTelemetry later | Start: JSON logs + health endpoints |
| Deploy | Docker + GitHub Actions | Free tiers only |
| Proxy | Caddy | Auto-TLS, simple |

**Deviation note:** full RabbitMQ/Redis/Vault/Prometheus stack from day one is explicitly *rejected* — master prompt itself says avoid over-engineering before first paying customer. Each addition must be justified by a real load/failure.

## 3. Phase 2 MVP scope (minimum viable control plane)

Build order (each increment independently testable):

1. **Solution skeleton** — `src/Jarvis.Api` (ASP.NET Core), `src/Jarvis.Core` (domain), `src/Jarvis.Worker` (background runner), `dashboard/` (Angular), `docker-compose.yml` (api + postgres).
2. **Persistence model (v1 tables):**
   - `tasks` (id, title, objective, priority, status[planned|ready|in_progress|awaiting_approval|blocked|completed|failed|cancelled], payload JSONB, attempts, checkpoint JSONB, timestamps)
   - `approvals` (id, action_type, exact_parameters JSONB, cost, rationale, risks, expires_at, status[pending|approved|rejected|expired|executed], decided_at, execution_ref)
   - `audit_events` (id, ts, actor, correlation_id, action, safe_params, approval_id, outcome, duration_ms)
   - `financial_records` (id, type[revenue|expense|fee|tax_reserve], amount, currency, occurred_at, description, evidence_ref)
   - `agents` (id, name, role, capabilities, permissions, status, last_heartbeat)
3. **API v1:** CRUD tasks; POST approval requests + approve/reject endpoints (**owner-only decision** — auth stub with single owner account in MVP); append-only audit write on every mutation; GET /health.
4. **Worker:** polls `tasks` where status=ready, executes registered handler or marks `blocked` (AI-dependent tasks queue until provider session active), records checkpoints; survives restart via DB state. **This is the first genuinely persistent execution.**
5. **Dashboard v1:** Executive Overview + Task Board + Approval Center + Audit feed — all reading real API data (no mock figures, ever).
6. **Tests:** approval state machine (rejected ⇒ cannot execute), task recovery after worker kill, audit append integrity.

Explicitly **out of scope for Phase 2:** RabbitMQ, Redis, Vault, multi-tenancy, billing, agent marketplace, public internet exposure (localhost + owner-only).

## 4. Approval state machine (normative)

```
pending → approved → executed
pending → rejected   (terminal)
pending → expired    (terminal, by expires_at)
approved → expired   (if execution not started before expiry)
```
Rules: execution requires a valid `approved` record whose `exact_parameters` **deep-match** the attempted action; any parameter drift ⇒ new approval. Rejected/expired ⇒ worker refuses. All transitions write `audit_events`.

## 5. Security baseline (MVP)

- Single owner account, strong password, JWT; no public registration.
- Secrets via `.env` (git-ignored) only; `.gitignore` covers `*.env`, `credentials*`.
- Parameterized SQL (EF Core); no string-concat queries.
- Audit redaction helper for secrets/PII before persist.
- No production exposure without explicit owner approval (public deployment = approval-gated).

## 6. Evolution map

| Phase | Adds |
|---|---|
| 2 | Skeleton, tasks, approvals, audit, worker, dashboard v1 (this) |
| 3 | Outreach/campaign records, landing-page hosting, financial ledger UI, CI/CD pipeline |
| 4 | RabbitMQ outbox, multi-agent registry, secrets vault, backups, monitoring |
| 5 | Provider abstraction API (multi-model), scheduler for recurring jobs, international-mobility module |
| 6 | Scale-out, HA, formal SOC-style controls as revenue justifies |

## 7. Honest reporting rule

Until `docker compose up` + worker + tests are **verified running**, status stays "Not started." After each milestone: paste real test/health output into the roadmap log.
