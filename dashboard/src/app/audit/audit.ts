import { Component } from '@angular/core';
import { ApiService, AuditEvent } from '../api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-audit',
  imports: [DatePipe],
  templateUrl: './audit.html',
  styleUrl: './audit.css',
})
export class Audit {
  events: AuditEvent[] = [];
  error = '';
  outcomeFilter = '';

  constructor(private api: ApiService) { this.reload(); }

  reload(): void {
    this.api.audit(200).then((r) => { this.events = r.events; this.error = ''; })
      .catch((e) => (this.error = String(e)));
  }

  get visible(): AuditEvent[] {
    return this.outcomeFilter
      ? this.events.filter((e) => e.outcome === this.outcomeFilter)
      : this.events;
  }

  setFilter(o: string): void { this.outcomeFilter = o; }

  outcomeClass(o: string): string { return `tag tag--${o}`; }
}
