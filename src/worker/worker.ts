/**
 * JARVIS background worker — persistent task execution.
 * Tasks live in SQLite; a worker restart resumes from checkpoint, never losing state.
 * AI-dependent handlers report 'blocked' when no AI provider session is available —
 * they do NOT fail silently and do NOT fabricate results.
 */
import { openDb } from "../db/schema.js";
import { Store } from "../core/store.js";
import type { TaskRow } from "../core/store.js";

const DB_PATH = process.env.JARVIS_DB ?? "data/jarvis.db";
const INTERVAL_MS = Number(process.env.WORKER_INTERVAL_MS ?? 2000);
const RUN_ONCE = process.argv.includes("--once");

const db = openDb(DB_PATH);
const store = new Store(db);

type HandlerResult = "completed" | "blocked" | "failed";
type Handler = (task: TaskRow, checkpoint: Record<string, unknown>) => Promise<{ result: HandlerResult; checkpoint?: Record<string, unknown>; error?: string }>;

/**
 * Handler registry. MVP ships with safe built-ins only;
 * real business handlers register here as capabilities come online.
 */
const handlers: Record<string, Handler> = {
  // Demo/no-op: marks itself complete — proves the persistence loop end-to-end.
  "noop.complete": async (task, checkpoint) => {
    void task;
    return { result: "completed", checkpoint: { ...checkpoint, done_at: new Date().toISOString() } };
  },
  // Honest blocker: AI-dependent work waits for a provider session (never faked).
  "ai.waiting_for_provider": async () => ({
    result: "blocked",
    error: "No AI provider session available — will retry when provider reconnects",
  }),
  "log.message": async (task, checkpoint) => {
    const payload = typeof task.payload === "string" ? JSON.parse(task.payload) : task.payload;
    const msg = (payload as { message?: string }).message ?? "";
    console.log(`[worker] task=${task.id} message=${JSON.stringify(msg)}`);
    return { result: "completed", checkpoint: { ...checkpoint, logged: true } };
  },
};

function resolveHandler(task: TaskRow): Handler {
  // payload is stored as a JSON string in SQLite — parse before reading
  const payload = typeof task.payload === "string" ? (JSON.parse(task.payload) as Record<string, unknown>) : (task.payload as Record<string, unknown>);
  const kind = payload.kind as string | undefined;
  if (kind && handlers[kind]) return handlers[kind];
  // Default: blocked, not failed — unknown work waits for a handler, never guesses.
  return async () => ({ result: "blocked", error: `No handler for payload.kind=${kind ?? "(none)"}` });
}

async function runOnce(): Promise<boolean> {
  store.expireStaleApprovals("worker");
  const task = store.claimNextReady();
  if (!task) return false;

  const started = Date.now();
  const handler = resolveHandler(task);
  const checkpoint = JSON.parse(task.checkpoint) as Record<string, unknown>;
  try {
    const outcome = await handler(task, checkpoint);
    if (outcome.result === "completed") {
      store.setTaskStatus(task.id, "completed", {
        actor: "worker",
        checkpoint: outcome.checkpoint ?? checkpoint,
      });
      console.log(`[worker] completed ${task.id} in ${Date.now() - started}ms`);
    } else if (outcome.result === "blocked") {
      store.setTaskStatus(task.id, "blocked", {
        actor: "worker",
        checkpoint: { ...checkpoint, blocked_reason: outcome.error, blocked_at: new Date().toISOString() },
        error: outcome.error,
      });
      console.warn(`[worker] blocked ${task.id}: ${outcome.error}`);
    } else {
      throw new Error(outcome.error ?? "handler reported failure");
    }
  } catch (err) {
    const attempts = task.attempts; // already incremented at claim
    const message = (err as Error).message;
    if (attempts >= task.max_attempts) {
      store.setTaskStatus(task.id, "failed", { actor: "worker", error: message });
      console.error(`[worker] FAILED permanently ${task.id} after ${attempts} attempts: ${message}`);
    } else {
      // Return to ready for retry — checkpoint preserved.
      store.setTaskStatus(task.id, "ready", {
        actor: "worker",
        checkpoint: { ...checkpoint, last_error: message },
        error: message,
      });
      console.warn(`[worker] retry ${task.id} (${attempts}/${task.max_attempts}): ${message}`);
    }
  }
  return true;
}

async function main(): Promise<void> {
  console.log(`[worker] starting (db=${DB_PATH}, interval=${INTERVAL_MS}ms${RUN_ONCE ? ", once" : ""})`);
  if (RUN_ONCE) {
    const did = await runOnce();
    console.log(`[worker] --once: ${did ? "processed one task" : "no ready tasks"}`);
    process.exit(0);
  }
  for (;;) {
    try {
      const did = await runOnce();
      if (!did) await new Promise((r) => setTimeout(r, INTERVAL_MS));
    } catch (err) {
      console.error("[worker] loop error:", err);
      await new Promise((r) => setTimeout(r, INTERVAL_MS));
    }
  }
}

void main();
