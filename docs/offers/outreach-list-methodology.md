# Outreach List Build — Methodology & Rules (Task A6)

*Status: METHODOLOGY — list itself must be built from public sources, reviewed by owner, then approved. Never committed to Git with personal emails (contains personal data → keep local/outside repo).*

## Rules (hard)

1. **Only publicly listed business contact info** (practice website contact pages, Google Business Profile listing, published practice email).
2. **No purchased lists, no scraped databases, no personal mobile numbers** unless published as business line.
3. **Source column mandatory** — every row records where the contact came from (URL).
4. **CSV stays out of Git** (`.gitignore` covers `*.csv` in `data/`): personal data minimization. Stored under `data/outreach/` locally, referenced by hash in control plane.
5. **Suppression list permanent** — anyone who opts out is added forever, checked before every send.

## CSV schema

```
practice_name,website,city,country,contact_email,contact_form_url,source_url,channel,tier,added_at,status
```
`status`: new → contacted → replied_positive → replied_negative → opted_out → bounced

## Sourcing playbook (batch 1: 100 rows)

| Source | How | Target rows |
|---|---|---|
| Google Maps "dental clinic" + city filter | Public listing email/website | 40 |
| Directories with public dentist listings (e.g., official dental association "find a dentist") | Published practice pages | 30 |
| Practice websites → /contact | Manual visit, published email or form | 30 |

**Tier A (first 30):** practices with evidence of missed calls (voicemail greetings published, reviews complaining about no answer — review text is public). Personalization field required.

## Review flow (before A7 approval)

1. Build 100 rows locally.
2. Owner reviews sample (10 rows) + methodology confirmation.
3. Exact list + copy approved → recorded as control-plane approval (`action_type: "outreach_send"`, params: list hash, batch size, copy hash).
4. Send only via approved rail; send log appended to control plane.

## Why this matters

Anti-spam laws (CAN-SPAM, GDPR for EU) + docs/06 R4. One bad campaign burns the domain and the owner's reputation. Slow, personalized, tracked — not bulk.
