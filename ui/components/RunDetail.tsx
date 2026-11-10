import { useEffect, useState } from 'react';
import * as Tabs from '@radix-ui/react-tabs';
import {
  ArrowLeftIcon,
  ArrowCounterClockwiseIcon,
  DownloadSimpleIcon,
  StopIcon,
  FileImageIcon,
  FileCodeIcon,
  ArrowSquareOutIcon,
} from '@phosphor-icons/react';
import type { Artifact, Run, RunEvent } from '../../src/schema';
import { api, download, duration, raw, shortTime, finished } from '../api';
import { Empty, ErrorNotice, Loading, Status } from './Shared';

export function RunDetail({
  run,
  onBack,
  onRun,
  onError,
}: {
  run: Run;
  onBack: () => void;
  onRun: (run: Run) => void;
  onError: (message: string) => void;
}) {
  const [filter, setFilter] = useState('all');
  const [tab, setTab] = useState('timeline');
  const [selected, setSelected] = useState<string>();
  const [working, setWorking] = useState(false);
  const act = async (action: () => Promise<void>) => {
    setWorking(true);
    try {
      await action();
    } catch (error) {
      onError(String(error));
    } finally {
      setWorking(false);
    }
  };
  const artifact =
    run.artifacts.find((item) => item.id === selected) ??
    run.artifacts.find((item) => item.type === 'image') ??
    run.artifacts[0];
  const events = run.events.filter((event) => filter === 'all' || event.kind === filter);
  const waiting = [
    ...new Set(
      run.events
        .filter((event) => event.message.startsWith('Waiting for checkpoint: '))
        .map((event) => event.message.slice(24)),
    ),
  ].filter((name) => !run.events.some((event) => event.message === `Checkpoint released: ${name}`));
  return (
    <Tabs.Root value={tab} onValueChange={setTab} asChild>
      <section className="run-detail">
        <button className="text-button back" onClick={onBack}>
          <ArrowLeftIcon size={16} aria-hidden="true" />
          All runs
        </button>
        <div className="run-heading">
          <div>
            <div className="section-label">
              RUN <span className="code">{run.id.slice(0, 8)}</span>
            </div>
            <h2>{run.suiteName}</h2>
            <p className="description">
              {run.scenarioName ?? 'No mock scenario'} <span aria-hidden="true">·</span>{' '}
              {shortTime(run.startedAt)} <span aria-hidden="true">·</span>{' '}
              {duration(run.durationMs)}
            </p>
          </div>
          <Status status={run.status} />
        </div>
        <dl className="run-statistics" aria-label="Recorded run summary">
          <div>
            <dt>Steps completed</dt>
            <dd>
              {run.completedSteps}
              <span> / {run.totalSteps}</span>
            </dd>
          </div>
          <div>
            <dt>Elapsed time</dt>
            <dd>{duration(run.durationMs)}</dd>
          </div>
          <div>
            <dt>Evidence files</dt>
            <dd>
              {run.artifacts.length}
              <span> captured</span>
            </dd>
          </div>
        </dl>
        <progress
          className="run-progress"
          value={run.completedSteps}
          max={Math.max(run.totalSteps, 1)}
          aria-label="Completed steps"
        />
        <div className="run-actions">
          <span>
            {run.completedSteps} of {run.totalSteps} steps completed
          </span>
          <div>
            {finished(run.status) ? (
              <>
                <button
                  className="primary"
                  disabled={working}
                  onClick={() =>
                    void act(async () =>
                      onRun(await api<Run>(`/runs/${run.id}/rerun`, { method: 'POST' })),
                    )
                  }
                >
                  <ArrowCounterClockwiseIcon size={16} aria-hidden="true" />
                  Rerun saved
                </button>
                <button
                  disabled={working}
                  onClick={() =>
                    void act(() =>
                      download(`/runs/${run.id}/export`, `testrill-${run.id.slice(0, 8)}.zip`),
                    )
                  }
                >
                  <DownloadSimpleIcon size={16} aria-hidden="true" />
                  Export evidence
                </button>
              </>
            ) : (
              <button
                disabled={working}
                onClick={() =>
                  void act(async () => {
                    await api(`/runs/${run.id}/cancel`, { method: 'POST' });
                  })
                }
              >
                <StopIcon size={16} aria-hidden="true" />
                Cancel run
              </button>
            )}
          </div>
        </div>
        {run.error && <ErrorNotice message={run.error} />}
        {!finished(run.status) &&
          waiting.map((name) => (
            <div className="checkpoint-notice" key={name}>
              <span>
                Stream waiting at <code>{name}</code>
              </span>
              <button
                disabled={working}
                onClick={() =>
                  void act(async () => {
                    await api(`/runs/${run.id}/checkpoint`, { method: 'POST', body: { name } });
                  })
                }
              >
                Release checkpoint
              </button>
            </div>
          ))}
        <Tabs.List className="detail-tabs" aria-label="Run details">
          {['timeline', 'artifacts', 'definition'].map((value) => (
            <Tabs.Trigger key={value} value={value}>
              {value === 'definition'
                ? 'Saved definition'
                : value === 'artifacts'
                  ? `Artifacts (${run.artifacts.length})`
                  : 'Event timeline'}
            </Tabs.Trigger>
          ))}
        </Tabs.List>
        <Tabs.Content value="timeline" asChild>
          <div className="evidence-layout">
            <div className="timeline-panel">
              <div className="timeline-toolbar">
                <h3>Execution ledger</h3>
                <label className="filter-label">
                  Show
                  <select
                    aria-label="Filter events"
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    {['all', 'step', 'assertion', 'scenario', 'network', 'console', 'system'].map(
                      (kind) => (
                        <option value={kind} key={kind}>
                          {kind === 'all' ? 'All events' : kind}
                        </option>
                      ),
                    )}
                  </select>
                </label>
              </div>
              {events.length ? (
                <ol className="timeline">
                  {events.map((event) => (
                    <EventRow key={event.id} event={event} start={run.startedAt} />
                  ))}
                </ol>
              ) : (
                <Empty title="No matching events">
                  Choose another event type or wait for the run to start.
                </Empty>
              )}
            </div>
            <div className="preview-panel">
              <div className="preview-header">
                <h3>Evidence preview</h3>
                {artifact && (
                  <select
                    aria-label="Preview artifact"
                    value={artifact.id}
                    onChange={(e) => setSelected(e.target.value)}
                  >
                    {run.artifacts.map((item) => (
                      <option value={item.id} key={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              {artifact ? (
                <ArtifactPreview runId={run.id} artifact={artifact} />
              ) : (
                <Empty
                  title={finished(run.status) ? 'No visual artifact' : 'Evidence is being captured'}
                >
                  {finished(run.status)
                    ? 'This run did not produce a screenshot. Review the ledger for assertion and execution details.'
                    : 'Screenshots and traces appear here when they are saved.'}
                </Empty>
              )}
              <div className="quiet-note">
                A screenshot records appearance. Check the assertions in the ledger for test
                results.
              </div>
            </div>
          </div>
        </Tabs.Content>
        <Tabs.Content value="artifacts" asChild>
          <div className="artifact-view">
            <p className="description">
              Exports include raw traces and screenshots. Review application data before sharing.
            </p>
            {run.artifacts.length ? (
              run.artifacts.map((item) => (
                <div className="artifact-row" key={item.id}>
                  {item.type === 'image' ? (
                    <FileImageIcon size={24} aria-hidden="true" />
                  ) : (
                    <FileCodeIcon size={24} aria-hidden="true" />
                  )}
                  <div>
                    <strong>{item.name}</strong>
                    <span className="subtle code">
                      {item.file} / {(item.size / 1024).toFixed(1)} KB
                    </span>
                  </div>
                  <button
                    disabled={working}
                    aria-label={`Download ${item.name}`}
                    onClick={() =>
                      void act(() => download(`/runs/${run.id}/artifacts/${item.id}`, item.file))
                    }
                  >
                    <DownloadSimpleIcon size={17} aria-hidden="true" />
                    Download
                  </button>
                </div>
              ))
            ) : (
              <Empty title="No artifacts yet">
                Completed runs retain network metadata and any captured browser evidence.
              </Empty>
            )}
          </div>
        </Tabs.Content>
        <Tabs.Content value="definition" asChild>
          <div className="saved-definition">
            <p className="description">
              This immutable snapshot is used by “Rerun saved,” even if the project configuration
              changes.
            </p>
            <pre>{JSON.stringify(run.configSnapshot, null, 2)}</pre>
          </div>
        </Tabs.Content>
      </section>
    </Tabs.Root>
  );
}
function EventRow({ event, start }: { event: RunEvent; start: string }) {
  return (
    <li className={`event event-${event.level}`}>
      <time className="code">
        +{((Date.parse(event.at) - Date.parse(start)) / 1000).toFixed(2)}s
      </time>
      <span className="event-marker" aria-hidden="true" />
      <div>
        <span className="event-kind">{event.kind}</span>
        <p>{event.message}</p>
        {event.detail && (
          <details>
            <summary>Payload or details</summary>
            <pre>{event.detail}</pre>
          </details>
        )}
      </div>
    </li>
  );
}
function ArtifactPreview({ runId, artifact }: { runId: string; artifact: Artifact }) {
  const [content, setContent] = useState('');
  const [error, setError] = useState('');
  useEffect(() => {
    let disposed = false;
    let objectUrl = '';
    setContent('');
    setError('');
    if (artifact.type === 'trace') return;
    void raw(`/runs/${runId}/artifacts/${artifact.id}`)
      .then(async (response) => {
        const result =
          artifact.type === 'image'
            ? URL.createObjectURL(await response.blob())
            : await response.text();
        if (artifact.type === 'image') objectUrl = result;
        if (!disposed) setContent(result);
        else if (objectUrl) URL.revokeObjectURL(objectUrl);
      })
      .catch((error) => {
        if (!disposed) setError(String(error));
      });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [runId, artifact.id, artifact.type]);
  if (error) return <ErrorNotice message={error} />;
  if (artifact.type === 'trace')
    return (
      <div className="trace-note">
        <ArrowSquareOutIcon size={28} aria-hidden="true" />
        <h3>Inspect the full browser trace</h3>
        <p>Download this artifact, then open it with Playwright Trace Viewer.</p>
        <code>npx playwright show-trace trace.zip</code>
      </div>
    );
  if (!content) return <Loading label="Loading artifact" />;
  return artifact.type === 'image' ? (
    <img
      className="artifact-image"
      src={content}
      alt={`${artifact.name} screenshot captured during this test run`}
      width="1280"
      height="800"
    />
  ) : (
    <pre className="json-preview">{content}</pre>
  );
}
