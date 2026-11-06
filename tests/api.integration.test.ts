/**
 * API integration tests — spawn the real server, hit real HTTP endpoints.
 * Catches router/wiring bugs unit tests can't see (found two this way:
 * payload-as-string handling, literal ':id' route keys).
 */
import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { spawn, type ChildProcess } from "node:child_process";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const TOKEN = "integration-test-token";
const PORT = "8799";
let child: ChildProcess;
let dir: string;

async function waitForHealth(timeoutMs = 15_000): Promise<void> {
  const start = Date.now();
  for (;;) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    if (Date.now() - start > timeoutMs) throw new Error("server did not become healthy");
    await new Promise((r) => setTimeout(r, 250));
  }
}

function api(path: string, init: RequestInit = {}) {
  return fetch(`http://127.0.0.1:${PORT}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${TOKEN}`,
      "content-type": "application/json",
      ...(init.headers ?? {}),
    },
  });
}

before(async () => {
  dir = mkdtempSync(join(tmpdir(), "jarvis-test-"));
  // spawn in its own process group so we can kill the whole tree (npx → sh → tsx → node)
  child = spawn("npx", ["tsx", "src/api/server.ts"], {
    env: {
      ...process.env,
      JARVIS_OWNER_TOKEN: TOKEN,
      JARVIS_DB: join(dir, "test.db"),
      PORT,
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  child.stderr?.on("data", () => {});
  await waitForHealth();
});

after(() => {
  try {
    if (child.pid) process.kill(-child.pid, "SIGTERM");
  } catch {
    child.kill("SIGTERM");
  }
  rmSync(dir, { recursive: true, force: true });
});

test("health is public, everything else requires auth", async () => {
  const health = await fetch(`http://127.0.0.1:${PORT}/health`);
  assert.equal(health.status, 200);
  const noAuth = await fetch(`http://127.0.0.1:${PORT}/tasks`);
  assert.equal(noAuth.status, 401);
  const wrongAuth = await fetch(`http://127.0.0.1:${PORT}/tasks`, {
    headers: { authorization: "Bearer wrong" },
  });
  assert.equal(wrongAuth.status, 401);
});

test("task CRUD + status route with real UUID", async () => {
  const created = await api("/tasks", {
    method: "POST",
    body: JSON.stringify({ title: "integration task", priority: 1, payload: { kind: "noop.complete" } }),
  });
  assert.equal(created.status, 201);
  const { task } = (await created.json()) as { task: { id: string; status: string } };
  assert.equal(task.status, "planned");

  const statusRes = await api(`/tasks/${task.id}/status`, {
    method: "POST",
    body: JSON.stringify({ status: "ready" }),
  });
  assert.equal(statusRes.status, 200);
  const { task: updated } = (await statusRes.json()) as { task: { status: string } };
  assert.equal(updated.status, "ready");

  const list = await (await api("/tasks")).json() as { tasks: { id: string }[] };
  assert.ok(list.tasks.some((t) => t.id === task.id));
});

test("approval decision route with real UUID (regression: literal ':id' route key)", async () => {
  const created = await api("/approvals", {
    method: "POST",
    body: JSON.stringify({
      action_type: "expense",
      exact_parameters: { amount: "9.99" },
      expires_at: new Date(Date.now() + 60_000).toISOString(),
    }),
  });
  assert.equal(created.status, 201);
  const { approval } = (await created.json()) as { approval: { id: string } };

  const decided = await api(`/approvals/${approval.id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision: "approved" }),
  });
  assert.equal(decided.status, 200);
  const after = (await decided.json()) as { approval: { status: string } };
  assert.equal(after.approval.status, "approved");

  // second decision must conflict
  const again = await api(`/approvals/${approval.id}/decision`, {
    method: "POST",
    body: JSON.stringify({ decision: "rejected" }),
  });
  assert.equal(again.status, 409);
});

test("financial endpoint enforces evidence rule", async () => {
  const bad = await api("/financials", {
    method: "POST",
    body: JSON.stringify({ type: "revenue", amount: "10", occurred_at: "2026-11-06T00:00:00Z" }),
  });
  assert.equal(bad.status, 400);
  const good = await api("/financials", {
    method: "POST",
    body: JSON.stringify({
      type: "revenue",
      amount: "10",
      occurred_at: "2026-11-06T00:00:00Z",
      evidence_ref: "txn-1",
    }),
  });
  assert.equal(good.status, 201);
});

test("audit endpoint returns events newest-first", async () => {
  const res = await (await api("/audit?limit=10")).json() as { events: { id: number; action: string }[] };
  assert.ok(res.events.length > 0);
  const ids = res.events.map((e) => e.id);
  assert.deepEqual(ids, [...ids].sort((a, b) => b - a));
});
