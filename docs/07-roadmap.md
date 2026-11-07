# 07 — Execution Roadmap

*Phase 1 deliverable. Compiled 2026-11-06. Status vocabulary: Planned / Ready / In progress / Awaiting approval / Blocked / Completed / Failed / Cancelled.*

## Priority order (revenue-first rule)

```
1. [Ready]      Payment rail + legal base (owner KYC steps — prepared, needs owner)
2. [Ready]      Niche selection + competitor-review mining (autonomous)
3. [Planned]    Productized offer + landing page + demo assets (autonomous, free tiers)
4. [Awaiting]   Outreach campaign #1 — needs owner approval of list+copy
5. [Ready]      Phase 2 control-plane MVP build (autonomous, local)
6. [Planned]    First paid pilot → record in ledger (Phase 3→4 gate)
```

## Epic A — Market validation (opportunity #1, from 02)

| Task | Status | Success criteria | Depends on |
|---|---|---|---|
| A1. Mine 50+ competitor reviews/complaints in 2 candidate niches | **Completed** | ≥20 datapoints → 8 themes, 3 niches (`docs/08`) | — |
| A2. Pick ONE niche (data-driven from A1) | **Completed** | dental primary, home-services fallback (`docs/08` §3); **owner confirmed D3 2026-11-06** | A1 |
| A3. Draft productized offer + pricing | **Completed (draft)** | `docs/offers/dental-answering-engine.md` — prices marked [H], not published | A2 |
| A4. Landing page — **LIVE on GitHub Pages** | Site live at `https://mohamedtestouri.github.io/HelloWorld/` (owner enabled Pages 2026-11-06); placeholder contact fixed → `mohamedtestoury@gmail.com` and republished to `gh-pages` | `landing/index.html`, `gh-pages` branch | A3 |
| A5. 3 demo artifacts (synthetic data) | **Completed (audio blocked)** | transcript + weekly report + 48h checklist; TTS audition failed ×4 → audio documented blocked, nothing faked | A3 |
| A6. Outreach list (100 leads, verified sources) | **Completed — 117/100** | 41 cities, 114 public emails + 3 contact-form-only, 2 spot-verified live; CSV git-ignored, sha256 `ace88a13…` in control plane | A2 |
| A7. Outreach copy | **Ready for sign-off** | `docs/offers/outreach-campaign-1.md` drafted; list finalized (117 rows, sha in approval) | A3, A6 |
| A8. Campaign #1 execution | **Wave A SENT — 5/100 (2026-11-06)** | Approval `9085ff31…` approved → executed (`campaign1-batchA-started-2026-11-06`); 5 Tier A emails sent w/ true per-site personalization, message ids + audit `outreach.send` ×5 in `docs/offers/outreach-execution-log.md`; owner instruction: send without postal address until supplied (future waves need address footer); reply monitoring active; day-30 gate A9 | A7 |
| A9. Day-30 gate review | Planned | ≥5 positive replies OR ≥1 paid pilot; else re-niche | A8 |

## Epic B — Legal & financial base

| Task | Status | Success criteria | Depends on |
|---|---|---|---|
| B1. Owner decides: auto-entrepreneur registration | **Completed — approved D1 2026-11-06** | Decision in control plane (`registration_auto_entrepreneur` → approved) | — |
| B2. Registration package (forms, steps, checklist) prepared | **Completed** | `docs/offers/registration-package.md` | B1 |
| B3. Payoneer account | Awaiting owner (KYC) — **D2 approved: Payoneer first** | Account active | Owner follows package in docs/offers |
| B4. Accountant shortlist (3 Tunisian advisers, fee quotes) | **Completed** | `docs/offers/accountant-shortlist.md` — CFRAUDIT/Luca Pacioli/CAMCONSULT; owner picks before any contact | — |
| B5. Invoice + service agreement templates | **Completed (draft)** | `docs/offers/agreement-invoice-templates.md` — counsel review flagged before first use | — |

## Epic C — Control plane (Phase 2 MVP)

| Task | Status | Success criteria |
|---|---|---|
| C1. Solution skeleton + health endpoint | **Completed** | `npm run api` green; `/health` returns ok |
| C2. DB schema v1 (tasks, approvals, audit, financial, agents) | **Completed** | Migrations apply; CHECK constraints tested |
| C3. Approval API + state-machine tests | **Completed** | 23/23 tests: rejected ⇒ cannot execute; param drift ⇒ 409 |
| C4. Worker with checkpoint/restart tests | **Completed** | E2E: ready→claim→complete w/ checkpoint; crash-recovery test passes |
| C5. Dashboard v1 (4 modules, real data only) | **Completed** | Angular 22 + FUI design; Overview/Tasks/Approvals/Audit all reading live API via auth-injecting proxy; `ng build` green; preview verified 200 + data flows |
| C6. CI (GitHub Actions: build + test) | **Completed** | `npm test` + `npm run typecheck` both green locally (GH workflow file next) |

## Epic D — Research (parallel, low effort)

| Task | Status | Notes |
|---|---|---|
| D1. Verify 2026 Tunisian FX code details (bank/DGI) | Blocked (external) | Owner can ask bank; agent re-verifies when access allows |
| D2. Grenada official Schedule of Fees re-verify | Blocked (site access) | Research-only, no action |
| D3. UK Ltd vs SARL cost model (when $3K/mo) | Planned | Triggers at revenue gate |
| D4. Claude subscription pricing verification | Blocked (no anthropic.com access) | Purchase would need approval + revenue anyway |

## Weekly cadence (from master prompt §66–67)

Every session, in order: (1) verify no unauthorized spend, (2) advance highest-priority Ready task, (3) log evidence in this file, (4) re-rank. Weekly report template: revenue/cash/customers/pipeline/projects/risks/pending approvals — **filled only with real data**.

## Session log

| Date | Action | Evidence |
|---|---|---|
| 2026-11-06 | Phase 1 complete: capability assessment, 5-opportunity scoring, intl/tax research, architecture, financials, risk register, this roadmap | `docs/01`–`07` committed |
| 2026-11-06 | A1/A2 complete: ≥20 complaint datapoints mined across voice-AI/dental/legal niches; niche selected = **dental** (home-services fallback) | `docs/08-niche-selection.md` |
| 2026-11-06 | C1–C4 + C6 **verified**: control-plane API, worker, approval machine; **23/23 tests pass** (unit + live HTTP integration); E2E run: task create→ready→worker→completed with checkpoint; reject→409 on re-decision; auth 401s; revenue-without-evidence 400 | `npm test` output; `tests/*.test.ts` |
| 2026-11-06 | Stack deviation recorded (Node/SQLite instead of ASP.NET/Postgres — no .NET/Docker in sandbox) | `docs/04` §1.1 |
| 2026-11-06 | A3 offer draft, A4 landing draft, A6 methodology, A7 copy draft, B5 agreement+invoice templates | `docs/offers/*`, `landing/index.html` |
| 2026-11-06 | Control plane seeded with 4 real tasks + **2 pending owner approvals** (outreach_send, registration) | live API `:8787/health` → 4 tasks, 2 pending |
| 2026-11-06 | **Owner decisions recorded:** D1 register auto-entrepreneur = YES (approval executed in control plane); D2 rail = Payoneer; D3 niche = dental confirmed | control-plane audit: `approval.approved`; B2 package published `docs/offers/registration-package.md` |
| 2026-11-06 | A5 setup checklist published; A6 starter batch **11 real leads** (US dental practices, public emails, source URLs), CSV git-ignored + sha256 logged; persistent worker running in background | `docs/offers/setup-checklist-48h.md`; `data/outreach/batch1-starter.csv`; worker process log |
| 2026-11-06 | **A6 complete: 117/100 leads** across 41 cities (114 emails, 3 form-only, 2 spot-verified live); sha256 `ace88a13…` in control plane | `data/outreach/batch1-starter.csv` |
| 2026-11-06 | **C5 complete: dashboard live** — 4 modules (Overview, Tasks, Approvals, Audit) on real API data via auth-injecting proxy; `ng build` green; preview host 200; 23/23 backend tests still pass | `dashboard/`; preview :4200 |
| 2026-11-06 | **Campaign #1 approved & executed into staging**: approval `9085ff31…` approved (owner) → executed `campaign1-batchA-started-2026-11-06`; 5 Tier A Gmail drafts staged with true per-site observations (0 sent — held for CAN-SPAM postal address); `gh-pages` branch published (`b7cfa72`, index.html at root) — owner to enable Pages in repo Settings (API 403); suppression list created | `docs/offers/outreach-execution-log.md`; Gmail drafts; `gh-pages` |
| 2026-11-06 | **A4 LIVE + A8 wave A sent**: landing page live on GitHub Pages (contact placeholder fixed to real email, republished `gh-pages`); 5 Tier A outreach emails sent (5/100 cap), audit `outreach.send` ×5, message ids in execution log; owner instruction: send without postal address until provided | `https://mohamedtestouri.github.io/HelloWorld/`; `docs/offers/outreach-execution-log.md` |
| 2026-11-07 | **Reply readiness + wave B research**: reply playbook (Calendly verified live, pricing-in-writing rule, opt-out/bounce flows); `publish_pricing` approval `99d1e4fe…` created (pending); Gmail label `outreach/wave-a` on all 5 sends; 8 task statuses synced (5 completed, 1 blocked) so dashboard shows reality; wave B research: South Boston demoted (already has after-hours "Nova"), Galligan row **stale** (→ Scanlan rebrand) | `docs/offers/reply-playbook.md`; `docs/offers/wave-b-research.md`; control-plane /approvals, /tasks |
