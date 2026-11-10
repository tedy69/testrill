import { useState } from 'react';
import { PlayIcon, ArrowRightIcon, GlobeIcon, CheckSquareIcon } from '@phosphor-icons/react';
import type { Project, Run, Suite } from '../../src/schema';
import { duration, shortTime } from '../api';
import { Status, Empty, SearchField } from './Shared';

export function Suites({
  project,
  runs,
  onRun,
  onInspect,
  busy,
}: {
  project: Project;
  runs: Run[];
  onRun: (suite: Suite, scenario?: string) => void;
  onInspect: (id: string) => void;
  busy: boolean;
}) {
  const [selected, setSelected] = useState(project.config.suites[0]?.id);
  const suite =
    project.config.suites.find((item) => item.id === selected) ?? project.config.suites[0];
  const [scenarios, setScenarios] = useState<Record<string, string>>({});
  const [query, setQuery] = useState('');
  const visible = project.config.suites.filter((item) =>
    `${item.name} ${item.id} ${item.description ?? ''}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const latest = runs.find((run) => run.suiteId === suite?.id);
  if (!suite)
    return <Empty title="No suites configured">Add a suite in Project configuration.</Empty>;
  const scenario = scenarios[suite.id] ?? suite.defaultScenario ?? '';
  return (
    <div className="suites-layout">
      <section className="suite-list" aria-label="Test suites">
        <div className="catalog-heading">
          <h2>Suite library</h2>
          <span className="catalog-count" aria-live="polite">
            {visible.length} of {project.config.suites.length}
          </span>
        </div>
        <SearchField
          label="Search suites"
          value={query}
          onChange={setQuery}
          placeholder="Find a test suite…"
        />
        <div className="catalog-columns" aria-hidden="true">
          <span>Test definition</span>
          <span>Last result</span>
        </div>
        {visible.map((item) => {
          const last = runs.find((run) => run.suiteId === item.id);
          return (
            <button
              key={item.id}
              className={`suite-item ${suite.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelected(item.id)}
              aria-pressed={suite.id === item.id}
            >
              <span className="suite-copy">
                <strong>{item.name}</strong>
                <span>
                  <CheckSquareIcon size={14} aria-hidden="true" />
                  {runnerLabel(item)} <span aria-hidden="true">·</span>{' '}
                  {item.runner ? 'External runner' : `${item.steps.length} steps`}
                </span>
              </span>
              <span className="suite-result">
                {last ? <Status status={last.status} /> : <span className="subtle">Not run</span>}
              </span>
            </button>
          );
        })}
        {!visible.length && (
          <Empty title="No matching suites">Try a different name or test ID.</Empty>
        )}
        <div className="suite-footnote">
          <span className="section-label">REPEATABLE BY DESIGN</span>
          Scenarios belong to one run. Results retain the test definition and recorded evidence.
        </div>
      </section>
      <section className="suite-detail" aria-labelledby="suite-title">
        <div className="detail-heading">
          <span className="suite-kind">
            <CheckSquareIcon size={17} aria-hidden="true" />
            {runnerLabel(suite)}
          </span>
          <span className="code subtle">{suite.id}</span>
        </div>
        <h2 id="suite-title">{suite.name}</h2>
        <p className="description">{suite.description}</p>
        <div className="target-line">
          <GlobeIcon size={18} aria-hidden="true" />
          <span className="target-label">Target</span>
          <span>{project.config.baseUrl}</span>
        </div>
        <div className="run-controls">
          <div>
            <label htmlFor="scenario-select">Scenario</label>
            <select
              id="scenario-select"
              value={scenario}
              onChange={(e) => setScenarios({ ...scenarios, [suite.id]: e.target.value })}
            >
              <option value="">Suite default</option>
              {project.config.scenarios.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>
          <button
            className="primary"
            disabled={busy}
            aria-busy={busy}
            onClick={() => onRun(suite, scenario || undefined)}
          >
            <PlayIcon size={16} weight="fill" aria-hidden="true" />
            Run suite
          </button>
        </div>
        <div className="step-list">
          <div className="step-list-heading">
            <h3>Execution steps</h3>
            <span>{suite.runner ? '1 adapter' : `${suite.steps.length} steps`}</span>
          </div>
          {suite.runner && (
            <div className="definition-step">
              <span className="step-number">01</span>
              <span>
                <strong>{suite.runner.type} adapter</strong>
                <span className="step-value">
                  {suite.runner.type === 'command'
                    ? suite.runner.command.join(' ')
                    : suite.runner.flow}
                </span>
              </span>
            </div>
          )}
          {suite.steps.map((step, index) => (
            <div className="definition-step" key={index}>
              <span className="step-number">{String(index + 1).padStart(2, '0')}</span>
              <span>
                <strong>{stepLabel(step.type)}</strong>
                <span className="step-value">
                  {step.type === 'navigate'
                    ? step.url
                    : step.type === 'fill'
                      ? step.label
                      : step.type === 'click'
                        ? step.name
                        : step.type === 'expectText'
                          ? step.text
                          : step.type === 'expectUrl'
                            ? step.includes
                            : step.type === 'request'
                              ? `${step.method} ${step.url} / ${step.expectStatus}`
                              : step.name}
                </span>
              </span>
            </div>
          ))}
        </div>
        {latest ? (
          <button className="latest-run" onClick={() => onInspect(latest.id)}>
            <span>
              <span className="section-label">LATEST RUN</span>
              <strong>
                {shortTime(latest.startedAt)}{' '}
                <span className="subtle">/ {duration(latest.durationMs)}</span>
              </strong>
            </span>
            <Status status={latest.status} />
            <ArrowRightIcon size={18} aria-hidden="true" />
          </button>
        ) : (
          <div className="quiet-note">
            No evidence yet. Run this suite to capture its first result.
          </div>
        )}
      </section>
    </div>
  );
}
function runnerLabel(suite: Suite) {
  if (suite.runner) return suite.runner.type === 'maestro' ? 'Maestro' : 'Command';
  return suite.steps.every((step) => step.type === 'request') ? 'HTTP contract' : 'Browser';
}
function stepLabel(type: Suite['steps'][number]['type']) {
  const labels: Record<string, string> = {
    navigate: 'Open page',
    fill: 'Fill field',
    click: 'Click element',
    expectText: 'Assert text',
    expectUrl: 'Assert URL',
    request: 'HTTP request',
    screenshot: 'Capture screenshot',
    checkpoint: 'Release checkpoint',
  };
  return labels[type] ?? type;
}
