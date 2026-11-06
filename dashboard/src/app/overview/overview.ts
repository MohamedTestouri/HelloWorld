import { Component } from '@angular/core';
import { ApiService, Task, Approval, FinancialRecord, Health } from '../api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-overview',
  imports: [DatePipe],
  templateUrl: './overview.html',
  styleUrl: './overview.css',
})
export class Overview {
  health: Health | null = null;
  tasks: Task[] = [];
  approvals: Approval[] = [];
  financials: FinancialRecord[] = [];
  error = '';

  constructor(private api: ApiService) {
    this.reload();
    setInterval(() => this.reload(), 15_000);
  }

  reload(): void {
    Promise.all([this.api.health(), this.api.tasks(), this.api.approvals(), this.api.financials()])
      .then(([h, t, a, f]) => {
        this.health = h; this.tasks = t.tasks; this.approvals = a.approvals; this.financials = f.records;
        this.error = '';
      })
      .catch((e) => (this.error = String(e)));
  }

  get byStatus(): Record<string, number> {
    const m: Record<string, number> = {};
    for (const t of this.tasks) m[t.status] = (m[t.status] ?? 0) + 1;
    return m;
  }

  get statusSummary(): string {
    const m = this.byStatus;
    return Object.keys(m).sort().map((s) => `${s} ${m[s]}`).join(' · ');
  }

  get pendingApprovals(): Approval[] {
    return this.approvals.filter((a) => a.status === 'pending');
  }

  get revenueReceived(): number {
    return this.financials
      .filter((r) => r.type === 'revenue')
      .reduce((s, r) => s + Number(r.amount), 0);
  }

  get targetProgress(): number {
    // personal net target $5,000/mo — revenue-based proxy until distributions modeled
    return Math.min(100, Math.round((this.revenueReceived / 5000) * 100));
  }
}
