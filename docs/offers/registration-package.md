# Auto-Entrepreneur Registration — Complete Package (Task B2)

*Owner decision D1: APPROVED 2026-11-06 (recorded in control plane, approval `registration_auto_entrepreneur`).*
*Your involvement: only the steps marked [OWNER] — identity assertions I cannot legally make.*

## What this gives us

Legal basis to invoice, receive Payoneer withdrawals into a Tunisian bank under a declared regime, and pay 0.5% tax on turnover up to 75,000 TND/yr with quarterly declarations. [V] — sources: docs/03 §1.1

## Step-by-step checklist

| # | Step | Who | Detail |
|---|---|---|---|
| 1 | Confirm eligibility | [OWNER] | Tunisian national, no existing patente/fiscal ID for another activity, annual revenue will stay ≤75,000 TND (~$24K) for now |
| 2 | Create account on **autoentrepreneur.tn** | [OWNER] | Requires your *identité numérique* (Tunisian e-ID / metadata) — identity step only you can complete |
| 3 | Select activity category | [OWNER] | Choose the category covering **software/IT services** (numérique/créatif services are eligible) [V] docs/03 [2] |
| 4 | Pay registration fee | [OWNER] | **10 TND** (already approved as cost in control plane) |
| 5 | Receive auto-entrepreneur card | [OWNER] | Serves as declaration of existence per art. 56 of the IRPP/IS code [V] docs/03 [2] |
| 6 | CNSS affiliation | [OWNER] | Card triggers social coverage; year-1 contribution covered by Fonds National de l'Emploi [V] |
| 7 | Record registration in control plane | agent (me) | You send me the registration receipt → I log it in `financial_records` (expense: 10 TND) + archive reference |
| 8 | Quarterly declaration routine | agent (me) | I prepare the declarations from our ledger; **you submit/confirm** via the platform quarterly (legally required act) |

## Obligations we must respect (recorded in risk register R1)

- Quarterly turnover declarations — even zero-turnover quarters must be declared [V] docs/03 [2]
- 75,000 TND/yr cap → at ~$2K/mo revenue we must revisit regime (patente) with accountant — **trigger documented in docs/05 §3**
- Duration: 4 years + 3 renewal — calendar reminders needed (add to control plane when scheduler exists)

## Payoneer setup (D2: APPROVED — Payoneer first)

| # | Step | Who | Detail |
|---|---|---|---|
| 1 | Register at payoneer.com | [OWNER] | Real identity + address only; business type: individual/freelancer |
| 2 | KYC: passport/ID + address proof | [OWNER] | Use same address as tax registration |
| 3 | Link Tunisian bank account for withdrawal | [OWNER] | Bank name/account exactly matching your ID |
| 4 | Receive first client payment | client | Prefer client-side Payoneer transfer or marketplace integration; note Global Payment Service unlocks at $5,000 received [V] docs/03 [6] |
| 5 | Log every receipt | agent (me) | `financial_records` with `evidence_ref` = Payoneer transaction ID; ledger → tax reserve 15% |
| 6 | Declare income | [OWNER]+agent | I compute quarterly figures from ledger; you file |

## Compliance notes (docs/06 R1, R9)

- **Every** foreign receipt is declared income. CRS exists; concealment is prohibited by policy and law.
- Do not share Payoneer credentials with me or anyone — credential reference only in control plane (vault = Phase 4).
- No offshore account shortcuts.

## Expected timeline

Day 1: steps 1–4 (~30 min of your time). Day 2–5: card issued. Same week: Payoneer account. **First invoice: ready when client #1 says yes.**
