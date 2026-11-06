import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { ApiService, Health } from './api.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  health: Health | null = null;
  now = new Date();

  constructor(private api: ApiService) {
    api.health().then((h) => (this.health = h)).catch(() => (this.health = null));
    setInterval(() => {
      api.health().then((h) => (this.health = h)).catch(() => (this.health = null));
    }, 15_000);
  }

  get tickerText(): string {
    const h = this.health;
    const parts = [
      'JARVIS CONTROL PLANE',
      h ? `DB ${h.db}` : 'DB UNKNOWN',
      h ? `TASKS ${h.tasks}` : '',
      h ? `APPROVALS PENDING ${h.pending_approvals}` : '',
      `SESSION ${this.now.toISOString().slice(0, 16).replace('T', ' ')}`,
      'REVENUE $0 — TARGET $5,000/MO PERSONAL NET',
      'NO UNAUTHORIZED SPEND',
    ];
    return parts.filter(Boolean).join('   ◆   ');
  }
}
