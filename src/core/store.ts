/**
 * Data access layer — all mutations audit-logged, approvals state-checked.
 */
import type { DatabaseSync } from "node:sqlite";
import { randomUUID } from "node:crypto";
import {
  ApprovalError,
  assertExecutable,
  assertTransition,
  isExpired,
  type Approval,
  type ApprovalStatus,
} from "./approval.js";

export type TaskStatus =
  | "planned"
  | "ready"
  | "in_progress"
  | "awaiting_approval"
  | "blocked"
  | "completed"
  | "failed"
  | "cancelled";

export interface TaskRow {
  id: string;
  title: string;
  objective: string;
  priority: number;
  status: TaskStatus;
  payload: string;
  checkpoint: string;
  attempts: number;
  max_attempts: number;
  approval_id: string | null;
  correlation_id: string;
  created_at: string;
  updated_at: string;
}

interface AuditInput {
  actor: string;
  action: string;
  entityType?: string;
  entityId?: string;
  safeParams?: unknown;
  approvalId?: string | null;
  correlationId?: string;
  outcome?: "ok" | "error" | "denied";
  durationMs?: number;
  error?: string;
}

export class Store {
  constructor(private readonly db: DatabaseSync) {}

  audit(input: AuditInput): void {
    this.db
      .prepare(
        `INSERT INTO audit_events (actor, action, entity_type, entity_id, safe_params, approval_id, correlation_id, outcome, duration_ms, error)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.actor,
        input.action,
        input.entityType ?? "",
        input.entityId ?? "",
        JSON.stringify(input.safeParams ?? {}),
        input.approvalId ?? null,
        input.correlationId ?? "",
        input.outcome ?? "ok",
        input.durationMs ?? 0,
        input.error ?? "",
      );
  }

  // ---------- Tasks ----------

  createTask(input: {
    title: string;
    objective?: string;
    priority?: number;
    payload?: unknown;
    correlationId?: string;
    actor?: string;
  }): TaskRow {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO tasks (id, title, objective, priority, status, payload, correlation_id)
         VALUES (?, ?, ?, ?, 'planned', ?, ?)`,
      )
      .run(
        id,
        input.title,
        input.objective ?? "",
        input.priority ?? 3,
        JSON.stringify(input.payload ?? {}),
        input.correlationId ?? "",
      );
    this.audit({
      actor: input.actor ?? "agent",
      action: "task.created",
      entityType: "task",
      entityId: id,
      safeParams: { title: input.title, priority: input.priority ?? 3 },
      correlationId: input.correlationId ?? "",
    });
    return this.getTask(id)!;
  }

  getTask(id: string): TaskRow | undefined {
    return this.db.prepare("SELECT * FROM tasks WHERE id = ?").get(id) as TaskRow | undefined;
  }

  listTasks(status?: TaskStatus): TaskRow[] {
    const sql = status
      ? "SELECT * FROM tasks WHERE status = ? ORDER BY priority, created_at"
      : "SELECT * FROM tasks ORDER BY priority, created_at";
    const stmt = this.db.prepare(sql);
    return (status ? stmt.all(status) : stmt.all()) as unknown as TaskRow[];
  }

  setTaskStatus(
    id: string,
    status: TaskStatus,
    opts: { actor?: string; checkpoint?: unknown; error?: string; approvalId?: string } = {},
  ): TaskRow {
    const task = this.getTask(id);
    if (!task) throw new Error(`Task ${id} not found`);
    const attempts =
      status === "in_progress" ? task.attempts : task.attempts; // attempts bumped by worker on claim
    this.db
      .prepare(
        `UPDATE tasks SET status = ?, checkpoint = ?, approval_id = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .run(
        status,
        opts.checkpoint !== undefined ? JSON.stringify(opts.checkpoint) : task.checkpoint,
        opts.approvalId !== undefined ? opts.approvalId : task.approval_id,
        id,
      );
    void attempts;
    this.audit({
      actor: opts.actor ?? "agent",
      action: "task.status_changed",
      entityType: "task",
      entityId: id,
      safeParams: { from: task.status, to: status, ...(opts.error ? { error: opts.error } : {}) },
      approvalId: opts.approvalId ?? null,
      outcome: opts.error ? "error" : "ok",
      error: opts.error ?? "",
    });
    return this.getTask(id)!;
  }

  /** Atomically claim the next ready task for the worker (optimistic — single worker MVP). */
  claimNextReady(): TaskRow | undefined {
    const row = this.db
      .prepare(
        `SELECT id FROM tasks WHERE status = 'ready' ORDER BY priority, created_at LIMIT 1`,
      )
      .get() as { id: string } | undefined;
    if (!row) return undefined;
    const res = this.db
      .prepare(
        `UPDATE tasks
         SET status = 'in_progress', attempts = attempts + 1, updated_at = datetime('now')
         WHERE id = ? AND status = 'ready'`,
      )
      .run(row.id);
    if (res.changes === 0) return undefined; // someone else claimed it
    return this.getTask(row.id);
  }

  // ---------- Approvals ----------

  requestApproval(input: {
    actionType: string;
    exactParameters: unknown;
    expiresAt: string;
    rationale?: string;
    risks?: string;
    evidence?: string;
    cost?: string;
    actor?: string;
  }): Approval {
    const id = randomUUID();
    this.db
      .prepare(
        `INSERT INTO approvals (id, action_type, exact_parameters, cost, rationale, risks, evidence, expires_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        input.actionType,
        JSON.stringify(input.exactParameters),
        input.cost ?? "0",
        input.rationale ?? "",
        input.risks ?? "",
        input.evidence ?? "",
        input.expiresAt,
      );
    this.audit({
      actor: input.actor ?? "agent",
      action: "approval.requested",
      entityType: "approval",
      entityId: id,
      safeParams: { action_type: input.actionType, cost: input.cost ?? "0" },
      approvalId: id,
    });
    return this.getApproval(id)!;
  }

  getApproval(id: string): Approval | undefined {
    return this.db.prepare("SELECT * FROM approvals WHERE id = ?").get(id) as Approval | undefined;
  }

  listApprovals(status?: ApprovalStatus): (Approval & { rationale: string; expires_at: string })[] {
    const sql = status
      ? "SELECT * FROM approvals WHERE status = ? ORDER BY created_at DESC"
      : "SELECT * FROM approvals ORDER BY created_at DESC";
    const stmt = this.db.prepare(sql);
    return (status ? stmt.all(status) : stmt.all()) as unknown as (Approval & {
      rationale: string;
      expires_at: string;
    })[];
  }

  /** Owner decision. Reject is terminal; approve moves to 'approved'. */
  decideApproval(id: string, decision: "approved" | "rejected", actor = "owner"): Approval {
    const approval = this.getApproval(id);
    if (!approval) throw new ApprovalError("NOT_FOUND", `Approval ${id} not found`);
    assertTransition(approval.status as ApprovalStatus, decision);
    this.db
      .prepare(
        `UPDATE approvals SET status = ?, decided_at = datetime('now'), updated_at = datetime('now') WHERE id = ?`,
      )
      .run(decision, id);
    this.audit({
      actor,
      action: `approval.${decision}`,
      entityType: "approval",
      entityId: id,
      approvalId: id,
      outcome: decision === "approved" ? "ok" : "denied",
    });
    return this.getApproval(id)!;
  }

  /**
   * The ONLY sanctioned way to execute an approved action.
   * Throws ApprovalError for pending/rejected/expired/param-mismatch.
   */
  executeApproved(
    approvalId: string,
    actionType: string,
    attemptedParams: unknown,
    executor: () => string | void,
    actor = "agent",
  ): { approval: Approval; executionRef?: string } {
    const approval = this.getApproval(approvalId);
    if (!approval) throw new ApprovalError("NOT_FOUND", `Approval ${approvalId} not found`);
    try {
      assertExecutable(approval, actionType, attemptedParams);
    } catch (err) {
      if (err instanceof ApprovalError) {
        this.audit({
          actor,
          action: "approval.execution_denied",
          entityType: "approval",
          entityId: approvalId,
          approvalId,
          outcome: "denied",
          error: `${err.code}: ${err.message}`,
        });
      }
      throw err;
    }
    const ref = executor() ?? randomUUID();
    this.db
      .prepare(
        `UPDATE approvals SET status = 'executed', executed_at = datetime('now'), execution_ref = ?, updated_at = datetime('now') WHERE id = ?`,
      )
      .run(ref, approvalId);
    this.audit({
      actor,
      action: "approval.executed",
      entityType: "approval",
      entityId: approvalId,
      approvalId,
      safeParams: { execution_ref: ref },
    });
    return { approval: this.getApproval(idOr(approvalId))!, executionRef: ref };
  }

  /** Lazy expiry sweep — called by API/worker on each cycle. */
  expireStaleApprovals(actor = "worker"): number {
    const rows = this.db
      .prepare("SELECT * FROM approvals WHERE status IN ('pending','approved')")
      .all() as unknown as Approval[];
    let n = 0;
    for (const a of rows) {
      if (isExpired(a)) {
        assertTransition(a.status as ApprovalStatus, "expired");
        this.db
          .prepare(
            `UPDATE approvals SET status = 'expired', updated_at = datetime('now') WHERE id = ? AND status = ?`,
          )
          .run(a.id, a.status);
        this.audit({ actor, action: "approval.expired", entityType: "approval", entityId: a.id, approvalId: a.id });
        n++;
      }
    }
    return n;
  }

  // ---------- Financials ----------

  recordFinancial(input: {
    type: "revenue" | "expense" | "fee" | "tax_reserve" | "distribution";
    amount: string;
    currency?: string;
    occurredAt: string;
    description?: string;
    evidenceRef?: string;
    approvalId?: string;
  }): number {
    if (input.type === "revenue" && !input.evidenceRef) {
      throw new Error("Revenue requires evidence_ref (payment proof) — invoiced ≠ received");
    }
    const res = this.db
      .prepare(
        `INSERT INTO financial_records (type, amount, currency, occurred_at, description, evidence_ref)
         VALUES (?, ?, ?, ?, ?, ?)`,
      )
      .run(
        input.type,
        input.amount,
        input.currency ?? "USD",
        input.occurredAt,
        input.description ?? "",
        input.evidenceRef ?? "",
      );
    this.audit({
      actor: "owner",
      action: "financial.recorded",
      entityType: "financial_record",
      entityId: String(res.lastInsertRowid),
      safeParams: { type: input.type, amount: input.amount, currency: input.currency ?? "USD" },
      approvalId: input.approvalId ?? null,
    });
    return Number(res.lastInsertRowid);
  }

  listFinancials(): unknown[] {
    return this.db.prepare("SELECT * FROM financial_records ORDER BY occurred_at DESC").all() as unknown[];
  }
}

function idOr(v: string): string {
  return v;
}
