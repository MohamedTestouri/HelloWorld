import { Injectable } from '@angular/core';

export interface Task {
  id: string; title: string; objective: string; priority: number;
  status: string; payload: string; checkpoint: string;
  attempts: number; max_attempts: number; correlation_id: string;
  created_at: string; updated_at: string;
}
export interface Approval {
  id: string; action_type: string; exact_parameters: string; cost: string;
  rationale: string; risks: string; evidence: string; expires_at: string;
  status: string; decided_at: string | null; executed_at: string | null;
  created_at: string; updated_at: string;
}
export interface AuditEvent {
  id: number; ts: string; actor: string; action: string;
  entity_type: string; entity_id: string; safe_params: string;
  approval_id: string | null; outcome: string; error: string;
}
export interface FinancialRecord {
  id: number; type: string; amount: string; currency: string;
  occurred_at: string; description: string; evidence_ref: string;
}
export interface Health { status: string; db: string; tasks: number; pending_approvals: number; time: string; }

/**
 * All requests are relative (/api/*) — dev proxy injects auth server-side.
 * The browser never holds credentials (docs/04 §5).
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/api';

  private async req<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(this.base + path, {
      ...init,
      headers: { 'content-type': 'application/json', ...(init?.headers ?? {}) },
    });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.json() as Promise<T>;
  }

  health() { return this.req<Health>('/health'); }
  tasks(status?: string) { return this.req<{ tasks: Task[] }>(`/tasks${status ? `?status=${status}` : ''}`); }
  setTaskStatus(id: string, status: string) {
    return this.req<{ task: Task }>(`/tasks/${id}/status`, { method: 'POST', body: JSON.stringify({ status }) });
  }
  approvals(status?: string) { return this.req<{ approvals: Approval[] }>(`/approvals${status ? `?status=${status}` : ''}`); }
  decide(id: string, decision: 'approved' | 'rejected') {
    return this.req<{ approval: Approval }>(`/approvals/${id}/decision`, { method: 'POST', body: JSON.stringify({ decision }) });
  }
  audit(limit = 100) { return this.req<{ events: AuditEvent[] }>(`/audit?limit=${limit}`); }
  financials() { return this.req<{ records: FinancialRecord[] }>('/financials'); }
}
