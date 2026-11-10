import { useEffect, useRef, useState } from 'react';
import { FloppyDiskIcon, PlusIcon, XIcon, FolderOpenIcon, CopyIcon } from '@phosphor-icons/react';
import type { Project, Scenario } from '../../src/schema';
import { api } from '../api';
import { Empty, ErrorNotice } from './Shared';

export function Scenarios({
  project,
  onSaved,
}: {
  project: Project;
  onSaved: (project: Project) => void;
}) {
  const [selected, setSelected] = useState(project.config.scenarios[0]?.id ?? '');
  const scenario = project.config.scenarios.find((item) => item.id === selected);
  const [draft, setDraft] = useState(JSON.stringify(scenario, null, 2) ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const choose = (item: Scenario) => {
    setSelected(item.id);
    setDraft(JSON.stringify(item, null, 2));
    setError('');
    setNotice('');
  };
  const add = () => {
    setSelected('');
    setDraft(
      JSON.stringify(
        {
          id: `scenario-${Date.now().toString(36)}`,
          name: 'New scenario',
          description: '',
          routes: [
            {
              method: 'GET',
              path: '/example',
              status: 200,
              delayMs: 0,
              body: { message: 'hello' },
            },
          ],
        },
        null,
        2,
      ),
    );
    setError('');
    setNotice('');
  };
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const parsed = JSON.parse(draft) as Scenario;
      const config = {
        ...project.config,
        scenarios: selected
          ? project.config.scenarios.map((item) => (item.id === selected ? parsed : item))
          : [...project.config.scenarios, parsed],
      };
      const saved = await api<Project>(`/projects/${project.config.id}`, {
        method: 'PUT',
        body: { config },
      });
      onSaved(saved);
      setSelected(parsed.id);
      setNotice('Scenario saved. New runs use this version.');
    } catch (error) {
      setError(String(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="editor-layout">
      <section className="scenario-list">
        <div className="section-label">
          MOCK SCENARIOS <span>{project.config.scenarios.length}</span>
        </div>
        {project.config.scenarios.map((item) => (
          <button
            key={item.id}
            className={`scenario-item ${selected === item.id ? 'selected' : ''}`}
            onClick={() => choose(item)}
          >
            <strong>{item.name}</strong>
            <span>
              {item.routes.length} route{item.routes.length === 1 ? '' : 's'}
            </span>
          </button>
        ))}
        <button className="new-scenario" onClick={add}>
          <PlusIcon size={17} aria-hidden="true" />
          Add scenario
        </button>
      </section>
      <section className="editor-panel">
        {draft ? (
          <>
            <div className="editor-heading">
              <div>
                <h2>{scenario?.name ?? 'New scenario'}</h2>
                <p className="description">Define HTTP responses or a sequence of SSE events.</p>
              </div>
              <button className="primary" disabled={saving} onClick={() => void save()}>
                <FloppyDiskIcon size={17} aria-hidden="true" />
                {saving ? 'Saving' : 'Save scenario'}
              </button>
            </div>
            {error && <ErrorNotice message={error} />}
            {notice && (
              <p className="success-message" role="status">
                {notice}
              </p>
            )}
            <label htmlFor="scenario-json">Scenario JSON</label>
            <textarea
              id="scenario-json"
              className="code-editor"
              spellCheck={false}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                setNotice('');
              }}
            />
            <details className="schema-help">
              <summary>Supported stream actions</summary>
              <pre>
                {JSON.stringify(
                  [
                    { type: 'event', id: '1', data: '{"status":"processing"}' },
                    { type: 'delay', ms: 500 },
                    { type: 'checkpoint', name: 'continue' },
                    { type: 'disconnect' },
                  ],
                  null,
                  2,
                )}
              </pre>
              <p>
                Routes match an exact method and path. Checkpoints are scoped to one run. Original
                event IDs are used for SSE resumption.
              </p>
            </details>
          </>
        ) : (
          <Empty title="Create the first scenario">
            Add a local HTTP or event-stream scenario for your tests.
          </Empty>
        )}
      </section>
    </div>
  );
}
export function Configuration({
  project,
  onSaved,
}: {
  project: Project;
  onSaved: (project: Project) => void;
}) {
  const [draft, setDraft] = useState(JSON.stringify(project.config, null, 2));
  const [writeToSource, setWrite] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    setSaving(true);
    setError('');
    try {
      const saved = await api<Project>(`/projects/${project.config.id}`, {
        method: 'PUT',
        body: { config: JSON.parse(draft), writeToSource },
      });
      onSaved(saved);
      setNotice('Project configuration saved.');
    } catch (error) {
      setError(String(error));
    } finally {
      setSaving(false);
    }
  };
  return (
    <section className="configuration">
      <div className="editor-heading">
        <div>
          <h2>Project configuration</h2>
          <p className="description">
            Suites, scenarios, target URL, and an optional environment command.
          </p>
        </div>
        <button className="primary" disabled={saving} onClick={() => void save()}>
          <FloppyDiskIcon size={17} aria-hidden="true" />
          Save configuration
        </button>
      </div>
      <dl className="project-paths">
        <div>
          <dt>Project root</dt>
          <dd>{project.root}</dd>
        </div>
        <div>
          <dt>Source manifest</dt>
          <dd>{project.sourcePath ?? 'Stored in this workspace only'}</dd>
        </div>
      </dl>
      {error && <ErrorNotice message={error} />}
      {notice && (
        <p role="status" className="success-message">
          {notice}
        </p>
      )}
      <label htmlFor="project-json">Project JSON</label>
      <textarea
        id="project-json"
        className="code-editor"
        value={draft}
        spellCheck={false}
        onChange={(e) => {
          setDraft(e.target.value);
          setNotice('');
        }}
      />
      {project.sourcePath && (
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={writeToSource}
            onChange={(e) => setWrite(e.target.checked)}
          />
          Also write changes to the source manifest
        </label>
      )}
      <p className="quiet-note">
        Environment commands run only when you choose Start environment. Import manifests from
        repositories you trust.
      </p>
    </section>
  );
}
export function ImportDialog({
  onClose,
  onImported,
}: {
  onClose: () => void;
  onImported: (project: Project) => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [path, setPath] = useState('');
  const [error, setError] = useState('');
  const [working, setWorking] = useState(false);
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  const choose = async () => {
    try {
      const { open } = await import('@tauri-apps/plugin-dialog');
      const value = await open({
        multiple: false,
        filters: [{ name: 'Project manifest', extensions: ['json'] }],
      });
      if (typeof value === 'string') setPath(value);
    } catch (error) {
      setError(String(error));
    }
  };
  return (
    <dialog ref={ref} className="dialog" onCancel={onClose} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          setWorking(true);
          setError('');
          void api<Project>('/projects/import', { method: 'POST', body: { path } })
            .then(onImported)
            .catch((error) => setError(String(error)))
            .finally(() => setWorking(false));
        }}
      >
        <div className="dialog-heading">
          <h2>Import a project</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="Close import dialog"
            onClick={onClose}
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <p>
          Choose an existing <code>rehearsal.json</code> manifest. Importing registers suites and
          scenarios without starting processes.
        </p>
        <label htmlFor="manifest-path">Absolute manifest path</label>
        <div className="path-input">
          <input
            id="manifest-path"
            value={path}
            onChange={(e) => setPath(e.target.value)}
            placeholder="/path/to/project/rehearsal.json"
            required
            autoFocus
          />
          {'__TAURI_INTERNALS__' in window && (
            <button
              type="button"
              className="icon-button"
              aria-label="Choose manifest file"
              onClick={() => void choose()}
            >
              <FolderOpenIcon size={20} aria-hidden="true" />
            </button>
          )}
        </div>
        {error && <ErrorNotice message={error} />}
        <div className="dialog-actions">
          <button type="button" onClick={onClose}>
            Cancel
          </button>
          <button className="primary" disabled={working || !path.trim()}>
            {working ? 'Importing' : 'Import project'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
export function Agents() {
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const [settings, setSettings] = useState<{
    mcpServers: unknown;
    workspace: string;
    httpUrl: string;
  }>();
  useEffect(() => {
    void api<{ mcpServers: unknown; workspace: string; httpUrl: string }>('/connection')
      .then(setSettings)
      .catch((error) => setError(String(error)));
  }, []);
  const config = settings
    ? JSON.stringify({ mcpServers: settings.mcpServers }, null, 2)
    : 'Loading this workspace’s connection settings...';
  return (
    <section className="agent-view">
      <div className="agent-intro">
        <span className="section-label">MCP + CLI</span>
        <h2>Your agent, the same workbench.</h2>
        <p>
          Connect an external agent to inspect projects, run suites, release checkpoints, and read
          the same evidence you see here. No model API key is required by Rehearsal.
        </p>
      </div>
      <div className="agent-columns">
        <section>
          <div className="editor-heading">
            <h3>Local MCP connection</h3>
            <button
              disabled={!settings}
              onClick={() => {
                void navigator.clipboard
                  .writeText(config)
                  .then(() => setCopied(true))
                  .catch((error) => setError(String(error)));
              }}
            >
              <CopyIcon size={16} aria-hidden="true" />
              {copied ? 'Copied' : 'Copy configuration'}
            </button>
          </div>
          <p className="description">These absolute paths connect your agent to this workspace.</p>
          <pre>{config}</pre>
          {settings && (
            <p className="quiet-note">
              Workspace: <code>{settings.workspace}</code>
              <br />
              HTTP MCP endpoint: <code>{settings.httpUrl}</code>
            </p>
          )}
          <p className="quiet-note">
            Local agents can use stdio. Hosted clients need a supported HTTP connection and cannot
            directly reach your machine’s loopback address.
          </p>
        </section>
        <section>
          <h3>Command-line workflow</h3>
          <pre>
            {
              'node dist-engine/main.cjs projects\nnode dist-engine/main.cjs run example-storefront checkout --json\nnode dist-engine/main.cjs inspect RUN_ID\nnode dist-engine/main.cjs export RUN_ID'
            }
          </pre>
          <h3>Agent tools</h3>
          <ul className="tool-list">
            {[
              'list_projects',
              'inspect_project',
              'prepare_environment',
              'run_suite',
              'inspect_run',
              'release_checkpoint',
              'cancel_run',
              'rerun_saved',
              'get_artifact',
              'export_run',
            ].map((tool) => (
              <li key={tool}>
                <code>{tool}</code>
              </li>
            ))}
          </ul>
          <p className="quiet-note">
            Only a final “passed” result means the configured assertions passed. A screenshot or a
            started run is not a passing test.
          </p>
        </section>
      </div>
      {error && <ErrorNotice message={error} />}
    </section>
  );
}
