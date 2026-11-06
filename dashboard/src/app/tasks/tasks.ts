import { Component } from '@angular/core';
import { ApiService, Task } from '../api.service';
import { DatePipe } from '@angular/common';

const STATUSES = ['planned','ready','in_progress','awaiting_approval','blocked','completed','failed','cancelled'] as const;

@Component({
  selector: 'app-tasks',
  imports: [DatePipe],
  templateUrl: './tasks.html',
  styleUrl: './tasks.css',
})
export class Tasks {
  tasks: Task[] = [];
  filter = '';
  error = '';

  constructor(private api: ApiService) { this.reload(); }

  reload(): void {
    this.api.tasks().then((r) => { this.tasks = r.tasks; this.error = ''; })
      .catch((e) => (this.error = String(e)));
  }

  get visible(): Task[] {
    return this.filter ? this.tasks.filter((t) => t.status === this.filter) : this.tasks;
  }

  setFilter(s: string): void { this.filter = s; }

  advance(t: Task): void {
    const next: Record<string, string> = { planned: 'ready', ready: 'in_progress' };
    const target = next[t.status];
    if (!target) return;
    this.api.setTaskStatus(t.id, target).then(() => this.reload())
      .catch((e) => (this.error = String(e)));
  }

  statusClass(s: string): string { return `tag tag--${s}`; }

  parsePayload(t: Task): { note?: string; kind?: string } {
    try { return JSON.parse(t.payload); } catch { return {}; }
  }
}
