/**
 * JARVIS Control Plane API (MVP).
 * Single-owner auth via JARVIS_OWNER_TOKEN bearer token (env). No public registration.
 * Every mutation is audited through Store.
 */
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { openDb } from "../db/schema.js";
import { Store } from "../core/store.js";
import { ApprovalError } from "../core/approval.js";

const PORT = Number(process.env.PORT ?? 8787);
const DB_PATH = process.env.JARVIS_DB ?? "data/jarvis.db";
const OWNER_TOKEN = process.env.JARVIS_OWNER_TOKEN ?? "";

if (!OWNER_TOKEN) {
  console.error("FATAL: JARVIS_OWNER_TOKEN is not set. Refusing to start without auth.");
  process.exit(1);
}

const db = openDb(DB_PATH);
const store = new Store(db);

type Handler = (req: IncomingMessage, res: ServerResponse, body: unknown, query: URLSearchParams) => void;

function send(res: ServerResponse, status: number, data: unknown): void {
  const payload = JSON.stringify(data);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
  });
  res.end(payload);
}

function readBody(req: IncomingMessage): Promise<unknown> {
  return new Promise((resolve, reject) => {
    let raw = "";
    let size = 0;
    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > 1_000_000) {
        reject(new Error("payload too large"));
        req.destroy();
        return;
      }
      raw += chunk.toString("utf8");
    });
    req.on("end", () => {
      if (!raw) return resolve({});
      try {
        resolve(JSON.parse(raw));
      } catch {
        reject(new Error("invalid JSON"));
      }
    });
    req.on("error", reject);
  });
}

function requireOwner(req: IncomingMessage): boolean {
  const auth = req.headers["authorization"] ?? "";
  return auth === `Bearer ${OWNER_TOKEN}`;
}

const routes: Record<string, Handler> = {
  // Health — unauthenticated, for monitoring only (no sensitive data)
  "GET /health": (_req, res) => {
    const taskCount = (db.prepare("SELECT COUNT(*) c FROM tasks").get() as { c: number }).c;
    const pendingApprovals = (
      db.prepare("SELECT COUNT(*) c FROM approvals WHERE status = 'pending'").get() as { c: number }
    ).c;
    send(res, 200, {
      status: "ok",
      db: "ok",
      tasks: taskCount,
      pending_approvals: pendingApprovals,
      time: new Date().toISOString(),
    });
  },

  // --- Tasks ---
  "GET /tasks": (_req, res, _body, query) => {
    const status = query.get("status") ?? undefined;
    send(res, 200, { tasks: store.listTasks(status as never) });
  },
  "POST /tasks": (_req, res, body) => {
    const b = body as { title?: string; objective?: string; priority?: number; payload?: unknown };
    if (!b.title) return send(res, 400, { error: "title required" });
    const task = store.createTask({
      title: b.title,
      objective: b.objective,
      priority: b.priority,
      payload: b.payload,
    });
    send(res, 201, { task });
  },

  // --- Approvals ---
  "GET /approvals": (_req, res, _body, query) => {
    const status = query.get("status") ?? undefined;
    send(res, 200, { approvals: store.listApprovals(status as never) });
  },
  "POST /approvals": (_req, res, body) => {
    const b = body as {
      action_type?: string;
      exact_parameters?: unknown;
      expires_at?: string;
      rationale?: string;
      risks?: string;
      evidence?: string;
      cost?: string;
    };
    if (!b.action_type || b.exact_parameters === undefined || !b.expires_at) {
      return send(res, 400, { error: "action_type, exact_parameters, expires_at required" });
    }
    const approval = store.requestApproval({
      actionType: b.action_type,
      exactParameters: b.exact_parameters,
      expiresAt: b.expires_at,
      rationale: b.rationale,
      risks: b.risks,
      evidence: b.evidence,
      cost: b.cost,
      actor: "agent",
    });
    send(res, 201, { approval });
  },

  // --- Financials ---
  "GET /financials": (_req, res) => {
    send(res, 200, { records: store.listFinancials() });
  },
  "POST /financials": (_req, res, body) => {
    const b = body as {
      type?: string;
      amount?: string;
      currency?: string;
      occurred_at?: string;
      description?: string;
      evidence_ref?: string;
    };
    if (!b.type || !b.amount || !b.occurred_at) {
      return send(res, 400, { error: "type, amount, occurred_at required" });
    }
    try {
      const id = store.recordFinancial({
        type: b.type as never,
        amount: b.amount,
        currency: b.currency,
        occurredAt: b.occurred_at,
        description: b.description,
        evidenceRef: b.evidence_ref,
      });
      send(res, 201, { id });
    } catch (err) {
      send(res, 400, { error: (err as Error).message });
    }
  },

  // --- Audit (read-only) ---
  "GET /audit": (_req, res, _body, query) => {
    const limit = Math.min(Number(query.get("limit") ?? 100), 500);
    const rows = db
      .prepare("SELECT * FROM audit_events ORDER BY id DESC LIMIT ?")
      .all(limit) as unknown[];
    send(res, 200, { events: rows });
  },
};

// Dynamic routes with path params: /tasks/:id/status, /approvals/:id/decision
function matchRoute(method: string, path: string): { handler: Handler; id?: string } | undefined {
  const exact = routes[`${method} ${path}`];
  if (exact) return { handler: exact };

  const taskStatus = path.match(/^\/tasks\/([0-9a-f-]+)\/status$/);
  if (method === "POST" && taskStatus) {
    const id = taskStatus[1];
    return {
      id,
      handler: (req, res, body) => {
        const b = body as { status?: string; checkpoint?: unknown; error?: string };
        if (!b.status) return send(res, 400, { error: "status required" });
        try {
          const task = store.setTaskStatus(id, b.status as never, {
            actor: "owner",
            checkpoint: b.checkpoint,
            error: b.error,
          });
          send(res, 200, { task });
        } catch (err) {
          send(res, 400, { error: (err as Error).message });
        }
      },
    };
  }

  const approvalDecision = path.match(/^\/approvals\/([0-9a-f-]+)\/decision$/);
  if (method === "POST" && approvalDecision) {
    const id = approvalDecision[1];
    return {
      id,
      handler: (_req, res, body) => {
        const b = body as { decision?: string };
        if (b.decision !== "approved" && b.decision !== "rejected") {
          return send(res, 400, { error: "decision must be 'approved' or 'rejected'" });
        }
        try {
          const approval = store.decideApproval(id, b.decision, "owner");
          send(res, 200, { approval });
        } catch (err) {
          if (err instanceof ApprovalError) {
            return send(res, 409, { error: err.code, message: err.message });
          }
          throw err;
        }
      },
    };
  }
  return undefined;
}

const server = createServer(async (req, res) => {
  const started = Date.now();
  const url = new URL(req.url ?? "/", "http://localhost");
  const method = req.method ?? "GET";
  const isPublic = method === "GET" && url.pathname === "/health";

  try {
    if (!isPublic && !requireOwner(req)) {
      store.audit({
        actor: "unknown",
        action: "api.auth_denied",
        safeParams: { method, path: url.pathname },
        outcome: "denied",
      });
      return send(res, 401, { error: "unauthorized" });
    }

    const matched = matchRoute(method, url.pathname);
    if (!matched) return send(res, 404, { error: "not found" });

    const body = method === "POST" ? await readBody(req) : {};
    matched.handler(req, res, body, url.searchParams);
    store.expireStaleApprovals();
  } catch (err) {
    store.audit({
      actor: "system",
      action: "api.error",
      safeParams: { method, path: url.pathname },
      outcome: "error",
      error: (err as Error).message,
      durationMs: Date.now() - started,
    });
    send(res, 500, { error: "internal error" });
  }
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`JARVIS control plane API listening on :${PORT} (db=${DB_PATH})`);
});
