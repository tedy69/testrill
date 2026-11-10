import { useState } from 'react';
import { PlayIcon, ArrowRightIcon, GlobeIcon, CheckSquareIcon } from '@phosphor-icons/react';
import type { Project, Run, Suite } from '../../src/schema';
import { duration, shortTime } from '../api';
import { Status, Empty } from './Shared';

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
  const latest = runs.find((run) => run.suiteId === suite?.id);
  if (!suite)
    return <Empty title="No suites configured">Add a suite in Project configuration.</Empty>;
  const scenario = scenarios[suite.id] ?? suite.defaultScenario ?? '';
  return (
    <div className="suites-layout">
      <section className="suite-list" aria-label="Test suites">
        <div className="section-label">
          SUITES <span>{project.config.suites.length}</span>
        </div>
        {project.config.suites.map((item) => {
          const last = runs.find((run) => run.suiteId === item.id);
          return (
            <button
              key={item.id}
              className={`suite-item ${suite.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelected(item.id)}
              aria-pressed={suite.id === item.id}
            >
              <span className="suite-icon">
                <CheckSquareIcon size={20} aria-hidden="true" />
              </span>
              <span className="suite-copy">
                <strong>{item.name}</strong>
                <span>
                  {item.runner ? `${item.runner.type} runner` : `${item.steps.length} steps`}{' '}
                  <span aria-hidden="true">·</span>{' '}
                  {last ? <Status status={last.status} /> : 'Not run yet'}
                </span>
              </span>
              <ArrowRightIcon className="suite-arrow" size={16} aria-hidden="true" />
            </button>
          );
        })}
        <div className="suite-footnote">
          Each run starts with a fresh browser context and its own scenario endpoint.
        </div>
      </section>
      <section className="suite-detail" aria-labelledby="suite-title">
        <div className="detail-heading">
          <span className="section-label">TEST DEFINITION</span>
          <span className="code subtle">{suite.id}</span>
        </div>
        <h2 id="suite-title">{suite.name}</h2>
        <p className="description">{suite.description}</p>
        <div className="target-line">
          <GlobeIcon size={18} aria-hidden="true" />
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
            onClick={() => onRun(suite, scenario || undefined)}
          >
            <PlayIcon size={16} weight="fill" aria-hidden="true" />
            Run suite
          </button>
        </div>
        <div className="step-list">
          <h3>Execution steps</h3>
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
                <strong>{step.type}</strong>
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
