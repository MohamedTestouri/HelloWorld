import { Component } from '@angular/core';
import { ApiService, Approval } from '../api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-approvals',
  imports: [DatePipe],
  templateUrl: './approvals.html',
  styleUrl: './approvals.css',
})
export class Approvals {
  approvals: Approval[] = [];
  error = '';
  busy = '';

  constructor(private api: ApiService) { this.reload(); }

  reload(): void {
    this.api.approvals().then((r) => { this.approvals = r.approvals; this.error = ''; })
      .catch((e) => (this.error = String(e)));
  }

  decide(a: Approval, decision: 'approved' | 'rejected'): void {
    if (decision === 'rejected' &&
        !confirm(`Reject "${a.action_type}"? Rejected approvals can never execute.`)) return;
    if (decision === 'approved' &&
        !confirm(`APPROVE exact action:\n\n${a.action_type}\nparams: ${a.exact_parameters}\ncost: ${a.cost}\n\nExecute this authorization?`)) return;
    this.busy = a.id;
    this.api.decide(a.id, decision)
      .then(() => this.reload())
      .catch((e) => (this.error = String(e)))
      .finally(() => (this.busy = ''));
  }

  pretty(json: string): string {
    try { return JSON.stringify(JSON.parse(json), null, 1); } catch { return json; }
  }

  statusClass(s: string): string { return `tag tag--${s}`; }
}
