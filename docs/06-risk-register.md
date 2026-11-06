# 06 — Risk Register

*Phase 1 deliverable. Compiled 2026-11-06. Severity 1–5 (5 highest). Updated as events occur.*

| ID | Risk | Sev | Likelihood | Mitigation | Owner trigger |
|---|---|---|---|---|---|
| R1 | **Tunisian FX/payment non-compliance** — receiving foreign income through undeclared rails; CRS reporting makes concealment impossible | 5 | Medium | Only declared rails (Payoneer→bank under chosen regime); accountant review before first large receipt; no offshore concealment, ever | Before first payment received |
| R2 | **Spending without authorization** — any $1 committed without approval | 5 | Low | $0 budget default; every cost documented in 05 + approval request | Every expense |
| R3 | **Fabricated progress** — claiming agents/revenue/tests that don't exist | 5 | Low | Status vocabulary enforced; roadmap entries require pasted evidence | Every report |
| R4 | **Outreach/spam compliance** — anti-spam law violations, domain burn | 4 | Medium | Owner-approved lists; personalized ≤100/day first campaign; unsubscribe honored; no purchased lists | First campaign |
| R5 | **Platform dependency** — Upwork/Payoneer account freeze | 4 | Medium | Diversify rails early; keep client relationships off-platform where contractually allowed | On any platform warning |
| R6 | **Single-operator burnout / key-person risk** | 4 | Medium | Automation investment; documentation of all processes; pace planning in roadmap | Ongoing |
| R7 | **AI provider outage** — delivery stalls if one provider down | 3 | Medium | Provider abstraction (Phase 5); non-AI tasks continue independently | First outage |
| R8 | **Wrong-niche persistence** — 30+ days outreach with 0 replies | 3 | Medium | Hard re-niche gate at Day 30 (see 02 §validation plan) | Day 30, zero replies |
| R9 | **Regulatory change** — Tunisian FX code implementation details differ from secondary reporting | 3 | Medium | Verify with bank/DGI before relying on 2026 code; accountant | Before FX account setup |
| R10 | **Intellectual property / client data mishandling** | 3 | Low | Synthetic data in demos; NDAs offered; no client secrets in Git or logs | On first client |
| R11 | **Scope creep into infrastructure** — polishing control plane while zero revenue | 3 | Medium | Phase gates: dashboard work capped until first outreach sent | Weekly review |
| R12 | **Grenada CBI agent fraud** — unofficial agents, stale fee figures | 3 | Low (no action planned) | Official Schedule of Fees only; zero transfers without explicit approval; research-only status | If CBI reopened |
| R13 | **Credential leak in Git** | 4 | Low | `.gitignore` for env/secrets; audit before every push; rotate on suspicion | Pre-push checklist |
| R14 | **Legal entity mistake** — adopting foreign structure that creates Tunisian CFC/PE problems | 4 | Low | Accountant models before any incorporation; substance-first | Any incorporation decision |

**Accepted risks:** none currently. Every high-severity risk has an active mitigation.
