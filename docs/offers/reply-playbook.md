# Reply-handling playbook — campaign #1

Companion to `outreach-execution-log.md`. Applies to the 5 wave A threads (label:
`outreach/wave-a`) and every future wave. Approved copy/cap: approval `9085ff31…`,
max 100 sends total (follow-ups consume the same budget — log every send).

## 0. Monitoring

- Check `label:outreach/wave-a` + `in:inbox newer_than:7d from:<lead domains>` each session.
- Bounce (mailer-daemon) → mark row `bounced` in `batch1-status.csv`, never retry that address.
- Any complaint/unsubscribe language → `data/outreach/suppression.csv` immediately (permanent).

## 1. Positive reply (interested / tell me more / pricing?)

**SLA: answer the same day.** Template (adapt tone, keep facts exact):

> Hi [Name],
>
> Thanks for getting back to me — glad it's relevant.
>
> The quickest next step is a 15-minute call where I'll show you exactly how it would
> work for [Practice]: [https://calendly.com/mohamedtestoury](https://calendly.com/mohamedtestoury)
>
> What you get on that call:
> - A walkthrough with a live demo of the receptionist answering a practice call
> - How booking into your existing calendar works (no new software for your team)
> - Setup timeline (48 hours) and what the first month costs your practice
>
> If scheduling is easier, just reply with two time windows that suit you and I'll
> work around them.
>
> Mohamed Testouri
> mohamedtestoury@gmail.com · (+216) 25 020 249

Notes:
- Calendly link verified live 2026-11-07 (`calendly.com/mohamedtestoury`).
- Demo assets for the call: `docs/offers/demo/artifacts.md` (transcript + weekly
  report + 48h checklist; audio blocked — use the transcript live).
- **Pricing rule:** the approved public claim is only "$0 setup for the first 25
  practices, month-to-month". The tier prices (Starter $249 / Standard $499) are
  hypotheses [H] — **do not put them in writing to prospects until the owner
  approves publishing prices** (offer doc A3 gate). On the call, if asked directly,
  answer honestly that intro pricing for founding practices is being finalized and
  the first-25 setup is free; record the price reaction as demand data (A9 gate input).
- Log every positive reply: `batch1-status.csv` → `contacted_reply` + audit
  `outreach.reply_positive` + roadmap A9 counter.

## 2. Soft reply (curious, not ready)

One helpful reply (answer their question + Calendly link), then leave them.
Re-contact only as part of an approved follow-up sequence (not yet approved —
follow-ups are new sends against the same 100 cap and need their own approval entry
if the owner wants a sequence).

## 3. Negative / "no thanks" / unsubscribe

Reply once, courteously (good practice, 1 line):

> Understood — I won't follow up. Thanks for your time.

Then: row → `suppression.csv` (reason: explicit opt-out), status `suppressed`,
audit `outreach.opt_out`. **Permanent — never contact again.**

## 4. Bounce / deliverability

- Hard bounce → status `bounced`, remove from any future wave, no retry.
- 2+ bounces in a wave → pause sending, report to owner (list-quality issue).

## 5. Demo call → close

- Demo happens in Calendly → send same-day recap email with `agreement-invoice-templates.md`
  (service agreement first — counsel review flag stands before first use).
- Pilot pricing: founding-practice offer, $0 setup (approved claim). Paid pilot =
  first revenue milestone → record in control plane financials (`revenue.recorded`
  needs evidence: received payment, not promise).
- On payment received: financial record + milestone "First paying customer" in roadmap.

## 6. Day-30 gate (A9)

Trigger 2026-12-06: count = (positive replies ×1) OR (paid pilots ×1) across ≥100
sends. Success: ≥5 positive replies OR ≥1 paid pilot → continue + scale wave.
Failure: re-niche decision back to owner with full evidence.
