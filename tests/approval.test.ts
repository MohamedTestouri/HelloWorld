/**
 * Approval state-machine tests — master prompt §62 items 5, 6, 7:
 * approval history persists; rejected actions cannot execute; duplicates prevented.
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db/schema.js";
import { Store } from "../src/core/store.js";
import { ApprovalError, assertExecutable, stableStringify } from "../src/core/approval.js";

let store: Store;

beforeEach(() => {
  const db = openDb(":memory:");
  store = new Store(db);
});

const future = () => new Date(Date.now() + 60_000).toISOString();
const past = () => new Date(Date.now() - 1_000).toISOString();

test("happy path: request → approve → execute with exact params", () => {
  const params = { amount: "14.99", currency: "USD", vendor: "namecheap" };
  const a = store.requestApproval({
    actionType: "expense",
    exactParameters: params,
    expiresAt: future(),
    cost: "14.99",
    rationale: "domain",
  });
  assert.equal(a.status, "pending");

  store.decideApproval(a.id, "approved");
  let executed = false;
  const { executionRef } = store.executeApproved(a.id, "expense", params, () => {
    executed = true;
    return "ref-1";
  });
  assert.ok(executed);
  assert.equal(executionRef, "ref-1");
  assert.equal(store.getApproval(a.id)!.status, "executed");
});

test("rejected approval can NEVER execute", () => {
  const params = { amount: "999" };
  const a = store.requestApproval({
    actionType: "expense",
    exactParameters: params,
    expiresAt: future(),
  });
  store.decideApproval(a.id, "rejected");
  assert.throws(
    () => store.executeApproved(a.id, "expense", params, () => "should-not-run"),
    (err: ApprovalError) => err.code === "BAD_TRANSITION",
  );
  // double-execution guard also holds for rejected
  assert.equal(store.getApproval(a.id)!.status, "rejected");
});

test("pending approval cannot execute before decision", () => {
  const params = { x: 1 };
  const a = store.requestApproval({ actionType: "deployment", exactParameters: params, expiresAt: future() });
  assert.throws(
    () => store.executeApproved(a.id, "deployment", params, () => "nope"),
    (err: ApprovalError) => err.code === "EXPIRED" || err.code === "BAD_TRANSITION",
  );
});

test("expired approval cannot execute", () => {
  const params = { x: 1 };
  const a = store.requestApproval({ actionType: "expense", exactParameters: params, expiresAt: past() });
  store.decideApproval(a.id, "approved");
  assert.throws(
    () => store.executeApproved(a.id, "expense", params, () => "nope"),
    (err: ApprovalError) => err.code === "EXPIRED",
  );
});

test("parameter drift: approved ≠ attempted → PARAM_MISMATCH", () => {
  const approved = { amount: "100", vendor: "aws" };
  const attempted = { amount: "1000", vendor: "aws" }; // note the drift
  const a = store.requestApproval({ actionType: "expense", exactParameters: approved, expiresAt: future() });
  store.decideApproval(a.id, "approved");
  assert.throws(
    () => store.executeApproved(a.id, "expense", attempted, () => "nope"),
    (err: ApprovalError) => err.code === "PARAM_MISMATCH",
  );
  // still approved (not consumed by failed attempt) — can execute with EXACT params
  let ok = false;
  store.executeApproved(a.id, "expense", approved, () => {
    ok = true;
    return "r";
  });
  assert.ok(ok);
});

test("wrong action type on same params → WRONG_ACTION", () => {
  const params = { amount: "50" };
  const a = store.requestApproval({ actionType: "expense", exactParameters: params, expiresAt: future() });
  store.decideApproval(a.id, "approved");
  assert.throws(
    () => store.executeApproved(a.id, "paid_advertising", params, () => "nope"),
    (err: ApprovalError) => err.code === "WRONG_ACTION",
  );
});

test("duplicate execution prevented (executed is terminal)", () => {
  const params = { amount: "10" };
  const a = store.requestApproval({ actionType: "expense", exactParameters: params, expiresAt: future() });
  store.decideApproval(a.id, "approved");
  store.executeApproved(a.id, "expense", params, () => "first");
  assert.throws(
    () => store.executeApproved(a.id, "expense", params, () => "second"),
    (err: ApprovalError) => err.code === "BAD_TRANSITION",
  );
});

test("illegal transitions are rejected by assertTransition", () => {
  const a = store.requestApproval({ actionType: "x", exactParameters: {}, expiresAt: future() });
  store.decideApproval(a.id, "rejected");
  assert.throws(() => store.decideApproval(a.id, "approved"), ApprovalError);
  assert.throws(() => store.decideApproval(a.id, "rejected"), ApprovalError);
});

test("stableStringify is key-order independent", () => {
  assert.equal(stableStringify({ b: 1, a: 2 }), stableStringify({ a: 2, b: 1 }));
  assert.notEqual(stableStringify({ a: 1 }), stableStringify({ a: 2 }));
});

test("every approval mutation leaves an audit trail", () => {
  const a = store.requestApproval({ actionType: "expense", exactParameters: { n: 1 }, expiresAt: future() });
  store.decideApproval(a.id, "approved");
  try {
    store.executeApproved(a.id, "expense", { n: 2 }, () => "x"); // denied
  } catch {
    /* expected */
  }
  const db = (store as unknown as { db: { prepare: (s: string) => { all: (...args: unknown[]) => unknown[] } } }).db;
  const events = db
    .prepare("SELECT action FROM audit_events WHERE approval_id = ?")
    .all(a.id) as { action: string }[];
  const actions = events.map((e) => e.action);
  assert.ok(actions.includes("approval.requested"));
  assert.ok(actions.includes("approval.approved"));
  assert.ok(actions.includes("approval.execution_denied"));
});

test("assertExecutable is pure and covers rejected directly", () => {
  assert.throws(
    () =>
      assertExecutable(
        {
          id: "a1",
          action_type: "expense",
          exact_parameters: "{}",
          expires_at: future(),
          status: "rejected",
        },
        "expense",
        {},
      ),
    (err: ApprovalError) => err.code === "BAD_TRANSITION",
  );
});
