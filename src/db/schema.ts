/**
 * JARVIS control plane — schema v1.
 * Source of truth: SQLite via node:sqlite (MVP; PostgreSQL-compatible DDL notes in comments).
 * Every design decision follows docs/04-jarvis-architecture.md §3.
 */
import { DatabaseSync } from "node:sqlite";

const DDL = `
-- Tasks: persistent business work items (survive session/worker restarts)
CREATE TABLE IF NOT EXISTS tasks (
  id            TEXT PRIMARY KEY,
  title         TEXT NOT NULL,
  objective     TEXT NOT NULL DEFAULT '',
  priority      INTEGER NOT NULL DEFAULT 3,          -- 1=highest
  status        TEXT NOT NULL DEFAULT 'planned'
                CHECK (status IN ('planned','ready','in_progress','awaiting_approval',
                                  'blocked','completed','failed','cancelled')),
  payload       TEXT NOT NULL DEFAULT '{}',           -- JSON
  checkpoint    TEXT NOT NULL DEFAULT '{}',           -- JSON — recovery point
  attempts      INTEGER NOT NULL DEFAULT 0,
  max_attempts  INTEGER NOT NULL DEFAULT 3,
  approval_id   TEXT REFERENCES approvals(id),
  correlation_id TEXT NOT NULL DEFAULT '',
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Approvals: parameter-bound human authorization (owner is sole approver in MVP)
CREATE TABLE IF NOT EXISTS approvals (
  id            TEXT PRIMARY KEY,
  action_type   TEXT NOT NULL,                        -- e.g. 'expense', 'outreach_send', 'deployment'
  exact_parameters TEXT NOT NULL,                     -- JSON — deep-compared at execution
  cost          TEXT NOT NULL DEFAULT '0',            -- decimal string + currency in params
  rationale     TEXT NOT NULL DEFAULT '',
  risks         TEXT NOT NULL DEFAULT '',
  evidence      TEXT NOT NULL DEFAULT '',
  expires_at    TEXT NOT NULL,                        -- ISO8601
  status        TEXT NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending','approved','rejected','expired','executed')),
  decided_at    TEXT,
  executed_at   TEXT,
  execution_ref TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Audit: append-only event log (no UPDATE/DELETE by application code)
CREATE TABLE IF NOT EXISTS audit_events (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  ts            TEXT NOT NULL DEFAULT (datetime('now')),
  actor         TEXT NOT NULL,                        -- 'owner' | 'agent' | 'worker'
  action        TEXT NOT NULL,
  entity_type   TEXT NOT NULL DEFAULT '',
  entity_id     TEXT NOT NULL DEFAULT '',
  safe_params   TEXT NOT NULL DEFAULT '{}',           -- JSON, redacted
  approval_id   TEXT,
  correlation_id TEXT NOT NULL DEFAULT '',
  outcome       TEXT NOT NULL DEFAULT 'ok',           -- ok | error | denied
  duration_ms   INTEGER NOT NULL DEFAULT 0,
  error         TEXT NOT NULL DEFAULT ''
);

-- Financial ledger: append-only money movements (revenue recognized only on receipt)
CREATE TABLE IF NOT EXISTS financial_records (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  type          TEXT NOT NULL
                CHECK (type IN ('revenue','expense','fee','tax_reserve','distribution')),
  amount        TEXT NOT NULL,                        -- decimal string
  currency      TEXT NOT NULL DEFAULT 'USD',
  occurred_at   TEXT NOT NULL,
  description   TEXT NOT NULL DEFAULT '',
  evidence_ref  TEXT NOT NULL DEFAULT '',             -- payment proof reference
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Agents: registry (MVP: rows created only when an agent actually runs)
CREATE TABLE IF NOT EXISTS agents (
  id            TEXT PRIMARY KEY,
  name          TEXT NOT NULL,
  role          TEXT NOT NULL DEFAULT '',
  capabilities  TEXT NOT NULL DEFAULT '[]',           -- JSON array
  permissions   TEXT NOT NULL DEFAULT '[]',           -- JSON array
  status        TEXT NOT NULL DEFAULT 'offline'
                CHECK (status IN ('online','offline','error')),
  last_heartbeat TEXT,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status, priority);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON approvals(status);
CREATE INDEX IF NOT EXISTS idx_audit_ts ON audit_events(ts);
`;

export function openDb(path: string): DatabaseSync {
  const db = new DatabaseSync(path);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  db.exec(DDL);
  return db;
}
