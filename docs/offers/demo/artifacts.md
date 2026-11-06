# A5 — Demo Proof Assets

*Status: assets 1 & 2 complete (synthetic, labeled). Asset 3 (48h setup checklist) at `docs/offers/setup-checklist-48h.md`. Live demo call recording pending — needs telephony infra (spend approval) OR owner prefers AI-synthesized call; decide before outreach.*

## Asset 1 — Sample call transcript (SYNTHETIC — no real patient data)

> **SYNTHETIC DEMO** — scripted conversation, invented names, for illustration only.

---

**AI:** Good evening, Bright Smiles Dental, this is the virtual receptionist. I can help with hours, location, or booking an appointment. How can I help?

**Caller:** Hi, uh — I chipped my tooth like an hour ago. Do you have anything tomorrow?

**AI:** I'm sorry to hear that — I can help you get in. First, can I get your name and a callback number?

**Caller:** Sarah Mitchell, 555-0134.

**AI:** Thanks, Sarah. I have two openings tomorrow: 9:20 AM or 2:45 PM with Dr. Alvarez. Which works better?

**Caller:** 9:20.

**AI:** Booked — 9:20 AM tomorrow, Dr. Alvarez, 221 Oak Street. You'll get a confirmation text shortly. If anything changes or the pain gets worse before then, press 0 anytime to reach our team, and we'll call you back within 15 minutes. Anything else?

**Caller:** Nope, that's it. Thanks!

**AI:** You're welcome, Sarah. See you tomorrow.

---

**System log (what the practice receives):**
```
LEAD CAPTURED → SMS + email to front desk
name: Sarah Mitchell | phone: 555-0134
intent: chipped_tooth (urgency: same-day)
booked: 2026-11-07 09:20 Dr. Alvarez
handoff_offered: yes (0 key) | handoff_taken: no
```

## Asset 2 — Sample weekly report (SYNTHETIC data, Week 45)

```
DENTAL ANSWERING ENGINE — WEEKLY REPORT
Practice: [Client] | Week of Nov 3–9, 2026 (SAMPLE DATA)

Calls after hours:        18   (answered 18 / missed 0)
Calls overflow:           11   (answered 11 / missed 0)
Appointments booked:       7
Callback requests:         3   (all contacted ≤15 min)
Human handoffs taken:      2
Abandonment rate:        0.0%
Avg. answer time:        <1 ring

Top reasons after hours:  rescheduling (6), tooth pain (4), insurance Q (3)
Action items:  update Saturday hours (client), add parking FAQ
```

## Asset 3 — 48h setup checklist

→ `docs/offers/setup-checklist-48h.md` (complete)

## Still needed before campaign send

- [ ] **Demo call audio** — **BLOCKED (2026-11-06):** text-to-speech voice audition failed for every candidate (4 attempts, both `en` and `en-US`). No audio generated; nothing fabricated. Transcript asset above stands as the demo. Retry in a later session or record a real call after first telephony spend approval (decision (b)).
- [x] All other A5 assets complete (transcript, weekly report sample, 48h checklist).
