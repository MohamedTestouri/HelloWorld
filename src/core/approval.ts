/**
 * Approval state machine — the security core of the control plane.
 * Normative rules (docs/04-jarvis-architecture.md §4):
 *   pending  → approved | rejected | expired
 *   approved → executed | expired
 *   rejected, expired, executed = terminal
 * Execution requires: status === 'approved' AND deep-equal exact_parameters.
 */
export type ApprovalStatus = "pending" | "approved" | "rejected" | "expired" | "executed";

export interface Approval {
  id: string;
  action_type: string;
  exact_parameters: string; // JSON string
  expires_at: string; // ISO8601
  status: ApprovalStatus;
}

export class ApprovalError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "BAD_TRANSITION"
      | "EXPIRED"
      | "PARAM_MISMATCH"
      | "WRONG_ACTION",
    message: string,
  ) {
    super(message);
    this.name = "ApprovalError";
  }
}

const ALLOWED: Record<ApprovalStatus, ApprovalStatus[]> = {
  pending: ["approved", "rejected", "expired"],
  approved: ["executed", "expired"],
  rejected: [],
  expired: [],
  executed: [],
};

export function assertTransition(from: ApprovalStatus, to: ApprovalStatus): void {
  if (!ALLOWED[from].includes(to)) {
    throw new ApprovalError("BAD_TRANSITION", `Illegal approval transition ${from} → ${to}`);
  }
}

export function isExpired(approval: Pick<Approval, "expires_at">, now = new Date()): boolean {
  return new Date(approval.expires_at).getTime() <= now.getTime();
}

/** Stable stringify: keys sorted recursively so deep-compare is order-independent. */
export function stableStringify(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return "[" + value.map(stableStringify).join(",") + "]";
  const obj = value as Record<string, unknown>;
  const keys = Object.keys(obj).sort();
  return "{" + keys.map((k) => JSON.stringify(k) + ":" + stableStringify(obj[k])).join(",") + "}";
}

/**
 * The execution gate. Returns void if execution is authorized, throws ApprovalError otherwise.
 * NEVER execute a consequential action without passing this gate.
 */
export function assertExecutable(
  approval: Approval,
  actionType: string,
  attemptedParams: unknown,
  now = new Date(),
): void {
  if (approval.status === "pending") {
    throw new ApprovalError("EXPIRED", `Approval ${approval.id} not yet decided`);
  }
  if (approval.status === "rejected") {
    throw new ApprovalError("BAD_TRANSITION", `Approval ${approval.id} was rejected — execution forbidden`);
  }
  if (approval.status === "expired" || (approval.status === "approved" && isExpired(approval, now))) {
    throw new ApprovalError("EXPIRED", `Approval ${approval.id} expired`);
  }
  if (approval.status === "executed") {
    throw new ApprovalError("BAD_TRANSITION", `Approval ${approval.id} already executed`);
  }
  // status === 'approved' and not expired from here on
  if (approval.action_type !== actionType) {
    throw new ApprovalError("WRONG_ACTION", `Approval ${approval.id} authorizes '${approval.action_type}', not '${actionType}'`);
  }
  const authorized = stableStringify(JSON.parse(approval.exact_parameters));
  const attempted = stableStringify(attemptedParams);
  if (authorized !== attempted) {
    throw new ApprovalError(
      "PARAM_MISMATCH",
      `Parameters differ from approved set for ${approval.id}. Approved: ${authorized} / Attempted: ${attempted}`,
    );
  }
}
