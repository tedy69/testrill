import { useCallback, useEffect, useState } from 'react';
import {
  SquaresFourIcon,
  ListChecksIcon,
  SlidersHorizontalIcon,
  ClockCounterClockwiseIcon,
  CodeIcon,
  PlusIcon,
  TerminalWindowIcon,
  FolderIcon,
  ArrowRightIcon,
  ListIcon,
  XIcon,
  PlayIcon,
  StopIcon,
} from '@phosphor-icons/react';
import type { Project, Run, Suite, Environment } from '../src/schema';
import { api, duration, environment, projectList, runList, shortTime } from './api';
import { Empty, ErrorNotice, Loading, Status } from './components/Shared';
import { Suites } from './components/Suites';
import { RunDetail } from './components/RunDetail';
import { Agents, Configuration, ImportDialog, Scenarios } from './components/Editors';

type View = 'suites' | 'scenarios' | 'history' | 'configuration' | 'agents';
const views = [
  { id: 'suites', label: 'Test suites', Icon: ListChecksIcon },
  { id: 'scenarios', label: 'Scenarios', Icon: SlidersHorizontalIcon },
  { id: 'history', label: 'Run history', Icon: ClockCounterClockwiseIcon },
  { id: 'configuration', label: 'Project configuration', Icon: CodeIcon },
] as const;
export function App() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [projectId, setProjectId] = useState(localStorage.getItem('rehearsal-project') ?? '');
  const [view, setView] = useState<View>('suites');
  const [runs, setRuns] = useState<Run[]>([]);
  const [runId, setRunId] = useState('');
  const [run, setRun] = useState<Run>();
  const [env, setEnv] = useState<Environment>({ status: 'stopped', logs: [] });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [toast, setToast] = useState('');
  const project = projects.find((item) => item.config.id === projectId) ?? projects[0];
  const refreshProjects = useCallback(async () => {
    const items = await projectList();
    setProjects(items);
    setConnected(true);
    setLoading(false);
  }, []);
  useEffect(() => {
    void refreshProjects().catch((error) => {
      setError(String(error));
      setLoading(false);
      setConnected(false);
    });
  }, [refreshProjects]);
  useEffect(() => {
    if (!project) return;
    localStorage.setItem('rehearsal-project', project.config.id);
    let disposed = false;
    let pending = false;
    const refresh = async () => {
      if (pending) return;
      pending = true;
      try {
        const [items, state, detail] = await Promise.all([
          runList(project.config.id),
          environment(project.config.id),
          runId ? api<Run>(`/runs/${runId}`) : Promise.resolve(undefined),
        ]);
        if (!disposed) {
          setRuns(items);
          setEnv(state);
          setRun(detail);
          setConnected(true);
        }
      } catch (error) {
        if (!disposed) {
          setConnected(false);
          setError(String(error));
        }
      } finally {
        pending = false;
      }
    };
    void refresh();
    const timer = setInterval(() => void refresh(), 1200);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [project?.config.id, runId]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(''), 6000);
    return () => clearTimeout(timer);
  }, [toast]);
  const perform = async (action: () => Promise<void>) => {
    setBusy(true);
    setError('');
    try {
      await action();
    } catch (error) {
      setError(String(error));
    } finally {
      setBusy(false);
    }
  };
  const inspect = (id: string) => {
    setRun(undefined);
    setRunId(id);
    setView('history');
  };
  const acceptRun = (value: Run) => {
    setRun(value);
    setRunId(value.id);
    setView('history');
  };
  const startRun = (suite: Suite, scenarioId?: string) => {
    if (!project) return;
    void perform(async () =>
      acceptRun(
        await api<Run>('/runs', {
          method: 'POST',
          body: { projectId: project.config.id, suiteId: suite.id, scenarioId },
        }),
      ),
    );
  };
  const saved = (item: Project) => {
    setProjects((values) =>
      values.map((value) => (value.config.id === item.config.id ? item : value)),
    );
    setToast('Configuration saved');
  };
  const navigate = (next: View) => {
    setView(next);
    setRunId('');
    setRun(undefined);
    setMenuOpen(false);
  };
  const title =
    view === 'agents'
      ? 'Agent connection'
      : (views.find((item) => item.id === view)?.label ?? 'Workspace');
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main">
        Skip to workspace
      </a>
      <aside
        className={`sidebar ${menuOpen ? 'sidebar-open' : ''}`}
        aria-label="Workspace navigation"
      >
        <div className="brand">
          <span className="brand-word">
            Rehearsal<span aria-hidden="true">.</span>
          </span>
          <button
            className="icon-button mobile-close"
            aria-label="Close navigation"
            onClick={() => setMenuOpen(false)}
          >
            <XIcon size={20} aria-hidden="true" />
          </button>
        </div>
        <span className="brand-caption">THE TESTING WORKBENCH</span>
        <div className="project-picker">
          <label htmlFor="project-picker">PROJECT</label>
          <div>
            <FolderIcon size={18} aria-hidden="true" />
            <select
              id="project-picker"
              value={project?.config.id ?? ''}
              onChange={(e) => {
                setProjectId(e.target.value);
                setRunId('');
                setRun(undefined);
                setRuns([]);
                navigate('suites');
              }}
            >
              {projects.length ? (
                projects.map((item) => (
                  <option value={item.config.id} key={item.config.id}>
                    {item.config.name}
                  </option>
                ))
              ) : (
                <option value="">No projects</option>
              )}
            </select>
          </div>
        </div>
        <nav>
          {views.map(({ id, label, Icon }) => (
            <button
              className={`nav-item ${view === id ? 'active' : ''}`}
              key={id}
              aria-current={view === id ? 'page' : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={20} aria-hidden="true" />
              {label}
              {id === 'suites' && project && (
                <span className="nav-count">{project.config.suites.length}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <button
            className={`nav-item ${view === 'agents' ? 'active' : ''}`}
            aria-current={view === 'agents' ? 'page' : undefined}
            onClick={() => navigate('agents')}
          >
            <TerminalWindowIcon size={20} aria-hidden="true" />
            Agent connection
          </button>
          <div className="local-status">
            <span className={`connection-dot ${connected ? 'connected' : ''}`} aria-hidden="true" />
            <span>
              {connected ? 'Local engine connected' : 'Engine disconnected'}
              <small>Rehearsal 0.1.0</small>
            </span>
          </div>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="breadcrumbs">
            <button
              className="icon-button mobile-menu"
              aria-label="Open navigation"
              onClick={() => setMenuOpen(true)}
            >
              <ListIcon size={22} aria-hidden="true" />
            </button>
            <SquaresFourIcon size={18} aria-hidden="true" />
            <span>Workspace</span>
            <span aria-hidden="true">/</span>
            <strong>{project?.config.name ?? 'No project selected'}</strong>
          </div>
          <button onClick={() => setImporting(true)} disabled={!connected}>
            <PlusIcon size={17} aria-hidden="true" />
            Import project
          </button>
        </header>
        <main id="main">
          <div className="page-heading">
            <div>
              <div className="section-label">
                {project?.config.id === 'example-storefront'
                  ? 'BUNDLED EXAMPLE PROJECT'
                  : 'LOCAL PROJECT'}
              </div>
              <h1>{title}</h1>
              <p>
                {view === 'agents'
                  ? 'Give your agent the tools to test, inspect, and reproduce.'
                  : (project?.config.description ??
                    'Connect the engine to open your testing workspace.')}
              </p>
            </div>
            {project && view !== 'agents' && (
              <div className="environment-controls">
                <span className={`environment-state env-${env.status}`}>
                  Environment: {env.status}
                </span>
                <button
                  disabled={busy}
                  onClick={() =>
                    void perform(async () => {
                      setEnv(
                        await api<Environment>(
                          `/projects/${project.config.id}/environment/${env.pid ? 'stop' : 'start'}`,
                          { method: 'POST' },
                        ),
                      );
                    })
                  }
                >
                  {env.pid ? (
                    <StopIcon size={15} aria-hidden="true" />
                  ) : (
                    <PlayIcon size={15} aria-hidden="true" />
                  )}
                  {env.pid ? 'Stop environment' : 'Check / start'}
                </button>
              </div>
            )}
          </div>
          {error && (
            <div className="global-error">
              <ErrorNotice message={error} />
              <button
                className="text-button"
                onClick={() => {
                  setError('');
                  void perform(refreshProjects);
                }}
              >
                Retry connection
              </button>
              <button
                className="icon-button"
                aria-label="Dismiss error"
                onClick={() => setError('')}
              >
                <XIcon size={17} aria-hidden="true" />
              </button>
            </div>
          )}
          {loading ? (
            <Loading />
          ) : !project ? (
            <Empty title="No project available">
              Start the local engine, then import a project manifest.
            </Empty>
          ) : (
            <>
              {view === 'suites' && (
                <Suites
                  key={project.config.id}
                  project={project}
                  runs={runs}
                  onRun={startRun}
                  onInspect={inspect}
                  busy={busy || !connected}
                />
              )}
              {view === 'scenarios' && (
                <Scenarios key={project.config.id} project={project} onSaved={saved} />
              )}
              {view === 'configuration' && (
                <Configuration key={project.config.id} project={project} onSaved={saved} />
              )}
              {view === 'agents' && <Agents />}
              {view === 'history' &&
                (runId ? (
                  run ? (
                    <RunDetail
                      key={run.id}
                      run={run}
                      onBack={() => {
                        setRunId('');
                        setRun(undefined);
                      }}
                      onRun={acceptRun}
                      onError={setError}
                    />
                  ) : (
                    <Loading label="Loading run evidence" />
                  )
                ) : (
                  <History runs={runs} onInspect={inspect} />
                ))}
            </>
          )}
          {env.error && <ErrorNotice message={env.error} />}
          {env.logs.length > 0 && (
            <details className="environment-log">
              <summary>Environment log ({env.logs.length} lines)</summary>
              <pre>{env.logs.join('\n')}</pre>
            </details>
          )}
        </main>
        <footer className="workspace-footer">
          <span>Local execution. Evidence stays in this workspace.</span>
          <span>
            {runs.length} recent run{runs.length === 1 ? '' : 's'}
          </span>
        </footer>
      </div>
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
      {importing && (
        <ImportDialog
          onClose={() => setImporting(false)}
          onImported={(item) => {
            setProjects((values) => [...values, item]);
            setProjectId(item.config.id);
            setImporting(false);
            navigate('suites');
            setToast('Project imported');
          }}
        />
      )}
    </div>
  );
}
function History({ runs, onInspect }: { runs: Run[]; onInspect: (id: string) => void }) {
  const [baseline, setBaseline] = useState('');
  const [candidate, setCandidate] = useState('');
  const before = runs.find((run) => run.id === baseline);
  const after = runs.find((run) => run.id === candidate);
  if (!runs.length)
    return (
      <Empty title="Your first run starts here">
        Choose a test suite and run it. Its assertion results and captured evidence will appear
        here.
      </Empty>
    );
  return (
    <section className="history-view">
      <div className="history-summary">
        <span>
          <strong>{runs.filter((run) => run.status === 'passed').length}</strong> passed
        </span>
        <span>
          <strong>{runs.filter((run) => run.status === 'failed').length}</strong> failed
        </span>
        <span>
          <strong>{runs.filter((run) => ['running', 'queued'].includes(run.status)).length}</strong>{' '}
          active
        </span>
        <span className="subtle">Most recent {runs.length} runs</span>
      </div>
      {runs.length > 1 && (
        <details className="compare-panel">
          <summary>Compare two runs</summary>
          <div className="compare-inputs">
            <label>
              Baseline
              <select value={baseline} onChange={(e) => setBaseline(e.target.value)}>
                <option value="">Select a run</option>
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.suiteName} / {shortTime(run.startedAt)} / {run.id.slice(0, 6)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Candidate
              <select value={candidate} onChange={(e) => setCandidate(e.target.value)}>
                <option value="">Select a run</option>
                {runs.map((run) => (
                  <option key={run.id} value={run.id}>
                    {run.suiteName} / {shortTime(run.startedAt)} / {run.id.slice(0, 6)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          {before && after && (
            <div className="comparison-result">
              <p>
                {before.id === after.id
                  ? 'You selected the same run twice.'
                  : before.suiteId !== after.suiteId
                    ? 'Different suites selected. These results describe different assertions.'
                    : 'Comparing recorded results. Duration changes do not establish a performance trend.'}
              </p>
              <table>
                <thead>
                  <tr>
                    <th>Recorded result</th>
                    <th>Baseline</th>
                    <th>Candidate</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th>Outcome</th>
                    <td>
                      <Status status={before.status} />
                    </td>
                    <td>
                      <Status status={after.status} />
                    </td>
                  </tr>
                  <tr>
                    <th>Steps completed</th>
                    <td>
                      {before.completedSteps}/{before.totalSteps}
                    </td>
                    <td>
                      {after.completedSteps}/{after.totalSteps}
                    </td>
                  </tr>
                  <tr>
                    <th>Duration</th>
                    <td>{duration(before.durationMs)}</td>
                    <td>{duration(after.durationMs)}</td>
                  </tr>
                  <tr>
                    <th>Scenario</th>
                    <td>{before.scenarioName ?? 'None'}</td>
                    <td>{after.scenarioName ?? 'None'}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}
        </details>
      )}
      <div className="table-scroll">
        <table className="runs-table">
          <thead>
            <tr>
              <th>Suite / run</th>
              <th>Scenario</th>
              <th>Result</th>
              <th>Duration</th>
              <th>Started</th>
              <th>
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr key={run.id}>
                <td>
                  <strong>{run.suiteName}</strong>
                  <span className="code subtle">{run.id.slice(0, 8)}</span>
                </td>
                <td>{run.scenarioName ?? 'No scenario'}</td>
                <td>
                  <Status status={run.status} />
                </td>
                <td className="code">{duration(run.durationMs)}</td>
                <td className="code">{shortTime(run.startedAt)}</td>
                <td>
                  <button
                    className="text-button"
                    aria-label={`Inspect ${run.suiteName} ${run.id.slice(0, 8)}`}
                    onClick={() => onInspect(run.id)}
                  >
                    Inspect
                    <ArrowRightIcon size={16} aria-hidden="true" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
