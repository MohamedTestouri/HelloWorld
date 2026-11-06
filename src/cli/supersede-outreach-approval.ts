/** One-shot: replace placeholder outreach approval with final exact-parameter version. */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { openDb } from "../db/schema.js";
import { Store } from "../core/store.js";

const db = openDb(process.env.JARVIS_DB ?? "data/jarvis.db");
const store = new Store(db);

const olds = store.listApprovals("pending").filter((a) => a.action_type === "outreach_send");
for (const o of olds) {
  store.decideApproval(o.id, "rejected", "agent");
  store.audit({
    actor: "agent",
    action: "approval.superseded",
    entityType: "approval",
    entityId: o.id,
    approvalId: o.id,
    safeParams: { reason: "placeholder list_hash replaced with final list digest" },
  });
}

const listHash = createHash("sha256")
  .update(readFileSync("data/outreach/batch1-starter.csv"))
  .digest("hex");

const final = store.requestApproval({
  actionType: "outreach_send",
  exactParameters: {
    batch: 1,
    max_sends: 100,
    total_rows_available: 117,
    channels: ["email", "contact_form", "linkedin"],
    copy_doc: "docs/offers/outreach-campaign-1.md",
    list_sha256: listHash,
    list_location: "data/outreach/batch1-starter.csv (git-ignored)",
    daily_cap: 100,
    opt_out_handling: "suppression list permanent",
  },
  expiresAt: "2026-12-06T00:00:00Z",
  rationale:
    "Campaign #1 — first demand validation for Dental Answering Engine; 117 leads sourced from public practice websites",
  risks:
    "Anti-spam compliance; domain reputation; owner personal brand. Mitigations: personalized copy, opt-out honored, no purchased lists (docs/offers/outreach-campaign-1.md)",
  cost: "0",
  actor: "agent",
});

console.log("final approval:", final.id, final.status);
