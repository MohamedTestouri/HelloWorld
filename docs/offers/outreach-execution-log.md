# Outreach execution log — batch 1 (campaign #1)

Status: **WAVE A SENT — 5/100 (2026-11-06 ~23:52 UTC)**. Owner instruction: send without
postal address until one is supplied (recorded override of the CAN-SPAM hold; add address
to all future waves once provided).
Approval: `9085ff31-287f-4144-8743-fabb2f93a905` (pending → approved 21:28 → executed
`campaign1-batchA-started-2026-11-06`). Each send audited `outreach.send` with approval_id
and correlation_id (audit ids …, see control plane /audit?limit=6).

Send-as: mohamedtestoury@gmail.com (verified primary; only send-as address on the mailbox).
Daily cap: 100 · max_sends: 100 · sent so far: **5** (wave A) · remaining budget today: 95 ·
list sha256 `ace88a13…` (approved CSV kept immutable; send state in
`data/outreach/batch1-status.csv` sidecar).

## Wave A — SENT 2026-11-06 (personalized, true observations from public sites)

| # | Practice | To | Gmail message id | Personalization (verified) |
|---|----------|----|------------------|----------------------------|
| 1 | Bleu Dentistry, Dallas | info@bleudentist.com | `1a1b3460cc25bea1` | Closed Tue/Thu/Sun; hours from own site |
| 2 | Charlotte Dental Arts | office@charlottedentalarts.com | `1a1b3460fa93ce13` | Emergency page promises "when you need it most" |
| 3 | Phoenix Family Dentistry | info@phoenixfamilydentistry.com | `1a1b346112773e55` | Closed Fri–Sun + lists emergency care |
| 4 | NKC Dental, Kansas City | info@nkcdental.com | `1a1b34614ebc4116` | Two offices, 2,314 Google reviews |
| 5 | RVA Dental Care, Richmond | info@rvadentalcare.com | `1a1b34617d6f22bb` | Site advertises "24-hour emergency care" |

Subjects follow the approved copy (practice name + after-hours angle). Body = approved
template verbatim, [specific observation] filled with the true fact above, identity =
Mohamed Testouri / mohamedtestoury@gmail.com.

## Future waves — postal address required

Before wave B: owner supplies a physical postal address → footer block appended to every
template instance (`Mohamed Testouri … / mohamedtestoury@gmail.com / address line`).
Wave A sent on explicit owner instruction of 2026-11-06 ("send without a postal address
for now until i get one") — recorded here so the override is auditable.

## Reply monitoring (starts now)

1. Check replies daily (Gmail thread on each message id above).
2. Any "no thanks" / unsubscribe → row into `data/outreach/suppression.csv`, permanent,
   never contact again (approved opt-out policy).
3. Positive reply → book call, move lead to `contacted_reply` in batch1-status.csv.
4. Day-30 gate (A9): ≥5 positive replies OR ≥1 paid pilot across ≥100 sends, else re-niche.

## Not yet sent

Remaining 112 rows (117 − 5 sent): staged only after wave A response data exists,
per copy discipline (learn from wave A before scaling).
