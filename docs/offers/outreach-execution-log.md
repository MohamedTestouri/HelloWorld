# Outreach execution log — batch 1 (campaign #1)

Status: **SENTS HELD by owner decision (2026-11-06)** — drafts staged in Gmail, nothing sent.
Approval: `9085ff31-287f-4144-8743-fabb2f93a905` (pending → approved 21:28 → executed `campaign1-batchA-started-2026-11-06`).

Hold reason: CAN-SPAM requires a valid physical postal address in commercial email to US
recipients; the approved template has no address block and the agent must not invent one.
**Release condition: owner supplies a postal address (or PO box) → add footer to all drafts → send.**

Send-as: mohamedtestoury@gmail.com (verified primary; only send-as address on the mailbox).
Daily cap: 100 · max_sends: 100 · sent so far: **0** · list sha256 `ace88a13…` (unchanged).

## Wave A — 5 drafts staged (personalized, true observations from public sites)

| # | Practice | To | Gmail draft id | Personalization (verified) |
|---|----------|----|----------------|----------------------------|
| 1 | Bleu Dentistry, Dallas | info@bleudentist.com | `r-8326780146739149020` | Closed Tue/Thu/Sun; hours from own site |
| 2 | Charlotte Dental Arts | office@charlottedentalarts.com | `r7315485557064825036` | Emergency page promises "when you need it most" |
| 3 | Phoenix Family Dentistry | info@phoenixfamilydentistry.com | `r7884143696021271495` | Closed Fri–Sun + lists emergency care |
| 4 | NKC Dental, Kansas City | info@nkcdental.com | `r-8068562420521419233` | Two offices, 2,314 Google reviews |
| 5 | RVA Dental Care, Richmond | info@rvadentalcare.com | `r-8331112259646845834` | Site advertises "24-hour emergency care" |

Subjects follow the approved copy (practice name + after-hours angle). Body = approved
template verbatim, [specific observation] filled with the true fact above, identity =
Mohamed Testouri / mohamedtestoury@gmail.com.

## Release procedure (when address provided)

1. `update_draft` ×5: append footer block = approved contact line + `Postale address: …`.
2. `send_draft` ×5, capture message ids.
3. Update this log (sent_at, message ids), flip batch1-starter.csv rows to `contacted`,
   append audit events (`outreach.send`), respect daily_cap 100 and permanent opt-outs.
4. Reply monitoring: any "no thanks" → suppression list `data/outreach/suppression.csv`,
   never contact again.

## Not yet sent

Remaining 112 rows (117 − 5 staged): staged only after wave A response data exists,
per copy discipline (learn from wave A before scaling).
