import { Routes } from '@angular/router';
import { Overview } from './overview/overview';
import { Tasks } from './tasks/tasks';
import { Approvals } from './approvals/approvals';
import { Audit } from './audit/audit';

export const routes: Routes = [
  { path: '', component: Overview, title: 'JARVIS · Overview' },
  { path: 'tasks', component: Tasks, title: 'JARVIS · Tasks' },
  { path: 'approvals', component: Approvals, title: 'JARVIS · Approvals' },
  { path: 'audit', component: Audit, title: 'JARVIS · Audit' },
  { path: '**', redirectTo: '' },
];
