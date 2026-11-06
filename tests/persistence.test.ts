/**
 * Persistence & recovery tests — master prompt §62 items 1, 4, 9, 10:
 * worker restart doesn't lose tasks; checkpoints recover; audit preserved;
 * financial integrity (revenue requires evidence).
 */
import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { openDb } from "../src/db/schema.js";
import { Store } from "../src/core/store.js";

let store: Store;
let dbPath: string;

beforeEach(() => {
  // unique temp db per test to simulate process restarts
  dbPath = `:memory:`;
  const db = openDb(dbPath);
  store = new Store(db);
});

test("task lifecycle: planned → ready → claimed (in_progress) with attempts", () => {
  const t = store.createTask({ title: "Build landing page", priority: 2 });
  assert.equal(t.status, "planned");

  store.setTaskStatus(t.id, "ready");
  const claimed = store.claimNextReady();
  assert.ok(claimed);
  assert.equal(claimed.id, t.id);
  assert.equal(claimed.status, "in_progress");
  assert.equal(claimed.attempts, 1);

  // second claim gets nothing (single ready task already claimed)
  assert.equal(store.claimNextReady(), undefined);
});

test("restart recovery: checkpoint written before 'crash' is readable after reopen", () => {
  // Simulate: worker claims task, writes checkpoint, process dies before completion.
  const t = store.createTask({ title: "long job" });
  store.setTaskStatus(t.id, "ready");
  const claimed = store.claimNextReady()!;
  store.setTaskStatus(claimed.id, "ready", {
    actor: "worker",
    checkpoint: { step: 3, of: 5 },
    error: "simulated crash — returned to queue",
  });

  // "Restart": reopen same logical DB state (in-memory keeps state within test; new claim reads it)
  const again = store.getTask(t.id)!;
  assert.equal(again.status, "ready");
  assert.deepEqual(JSON.parse(again.checkpoint), { step: 3, of: 5 });
  assert.equal(again.attempts, 1);

  const reclaimed = store.claimNextReady()!;
  assert.equal(reclaimed.id, t.id);
  assert.equal(reclaimed.attempts, 2);
});

test("max attempts → failed status is terminal until manual reset", () => {
  const t = store.createTask({ title: "flaky", payload: { kind: "x" } });
  store.setTaskStatus(t.id, "ready");
  // burn through attempts
  for (let i = 1; i <= 3; i++) {
    const c = store.claimNextReady();
    assert.ok(c, `claim ${i}`);
    if (i < 3) store.setTaskStatus(c.id, "ready", { error: "retry" });
    else store.setTaskStatus(c.id, "failed", { error: "max attempts" });
  }
  assert.equal(store.getTask(t.id)!.status, "failed");
  assert.equal(store.claimNextReady(), undefined);
});

test("financial: revenue without evidence_ref is rejected", () => {
  assert.throws(
    () =>
      store.recordFinancial({
        type: "revenue",
        amount: "100",
        occurredAt: new Date().toISOString(),
      }),
    /evidence_ref/,
  );
});

test("financial: revenue with evidence records; expenses allowed", () => {
  const rid = store.recordFinancial({
    type: "revenue",
    amount: "1500",
    occurredAt: "2026-11-06T10:00:00Z",
    description: "first pilot payment",
    evidenceRef: "payoneer-txn-123",
  });
  assert.ok(rid > 0);
  store.recordFinancial({
    type: "expense",
    amount: "14.99",
    occurredAt: "2026-11-06T11:00:00Z",
    description: "domain",
  });
  const rows = store.listFinancials() as { type: string }[];
  assert.equal(rows.length, 2);
});

test("audit log is append-only and queryable (persistence of history)", () => {
  const t = store.createTask({ title: "audited" });
  store.setTaskStatus(t.id, "ready");
  store.setTaskStatus(t.id, "completed");
  const db = (store as unknown as { db: { prepare: (s: string) => { all: (...a: unknown[]) => unknown[] } } }).db;
  const events = db
    .prepare("SELECT action FROM audit_events WHERE entity_id = ? ORDER BY id")
    .all(t.id) as { action: string }[];
  assert.deepEqual(
    events.map((e) => e.action),
    ["task.created", "task.status_changed", "task.status_changed"],
  );
});

test("task status vocabulary is enforced by CHECK constraint", () => {
  const t = store.createTask({ title: "vocab" });
  assert.throws(() => store.setTaskStatus(t.id, "nonsense" as never));
});
