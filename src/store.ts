import { DatabaseSync } from 'node:sqlite';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import type { Project, Run } from './schema.js';

export class Store {
  readonly db: DatabaseSync;
  constructor(readonly directory: string) {
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    // Keep existing workspaces in place; new workspaces use the permanent product name.
    const legacy = join(directory, 'rehearsal.sqlite');
    this.db = new DatabaseSync(existsSync(legacy) ? legacy : join(directory, 'testrill.sqlite'));
    this.db.exec(`PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000;
      CREATE TABLE IF NOT EXISTS projects (id TEXT PRIMARY KEY, data TEXT NOT NULL);
      CREATE TABLE IF NOT EXISTS runs (id TEXT PRIMARY KEY, project_id TEXT NOT NULL, started_at TEXT NOT NULL, data TEXT NOT NULL);
      CREATE INDEX IF NOT EXISTS runs_project ON runs(project_id, started_at DESC);`);
  }
  projects(): Project[] {
    return this.db
      .prepare('SELECT data FROM projects ORDER BY id')
      .all()
      .map((row) => JSON.parse(String(row.data)));
  }
  project(id: string): Project | undefined {
    const row = this.db.prepare('SELECT data FROM projects WHERE id = ?').get(id);
    return row ? JSON.parse(String(row.data)) : undefined;
  }
  saveProject(project: Project): Project {
    this.db
      .prepare(
        'INSERT INTO projects (id, data) VALUES (?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
      )
      .run(project.config.id, JSON.stringify(project));
    return project;
  }
  runs(projectId?: string): Run[] {
    const rows = projectId
      ? this.db
          .prepare('SELECT data FROM runs WHERE project_id = ? ORDER BY started_at DESC LIMIT 100')
          .all(projectId)
      : this.db.prepare('SELECT data FROM runs ORDER BY started_at DESC LIMIT 100').all();
    return rows.map((row) => JSON.parse(String(row.data)));
  }
  run(id: string): Run | undefined {
    const row = this.db.prepare('SELECT data FROM runs WHERE id = ?').get(id);
    return row ? JSON.parse(String(row.data)) : undefined;
  }
  saveRun(run: Run): void {
    this.db
      .prepare(
        'INSERT INTO runs (id, project_id, started_at, data) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET data=excluded.data',
      )
      .run(run.id, run.projectId, run.startedAt, JSON.stringify(run));
  }
  recoverInterrupted(): void {
    for (const run of this.runs()) {
      if (run.status === 'queued' || run.status === 'running') {
        run.status = 'interrupted';
        run.error = 'The engine stopped before this run completed. Rerun the saved configuration.';
        run.finishedAt = new Date().toISOString();
        this.saveRun(run);
      }
    }
  }
  close(): void {
    this.db.close();
  }
}
