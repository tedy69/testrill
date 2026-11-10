import { randomUUID } from 'node:crypto';
import { mkdirSync, statSync, writeFileSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { createRequire } from 'node:module';
import type { Browser, Page } from 'playwright-core';
import type {
  Artifact,
  Project,
  Run,
  RunEvent,
  RunStatus,
  Scenario,
  Step,
  Suite,
} from './schema.js';
import { Store } from './store.js';
import { startScenario } from './scenario-server.js';
import { executeExternal, collectExternalArtifacts } from './external-runner.js';

export function cleanUrl(value: string) {
  try {
    const url = new URL(value);
    for (const key of url.searchParams.keys())
      if (/token|password|secret|key|auth|code/i.test(key)) url.searchParams.set(key, '[redacted]');
    url.username = '';
    url.password = '';
    return url.toString();
  } catch {
    return value;
  }
}
export class Runner {
  private active = new Map<
    string,
    { abort: AbortController; release?: (name: string) => void; done?: Promise<void> }
  >();
  constructor(private store: Store) {}
  start(project: Project, suite: Suite, scenario?: Scenario): Run {
    if (this.active.size >= 3)
      throw new Error('Three runs are active. Wait for a run to finish or cancel one.');
    const run: Run = {
      id: randomUUID(),
      projectId: project.config.id,
      projectName: project.config.name,
      suiteId: suite.id,
      suiteName: suite.name,
      scenarioId: scenario?.id,
      scenarioName: scenario?.name,
      status: 'queued',
      startedAt: new Date().toISOString(),
      completedSteps: 0,
      totalSteps: suite.runner ? 1 : suite.steps.length,
      events: [],
      artifacts: [],
      configSnapshot: { suite, scenario, baseUrl: project.config.baseUrl },
    };
    this.store.saveRun(run);
    const active = {
      abort: new AbortController(),
      done: undefined as Promise<void> | undefined,
      release: undefined as ((name: string) => void) | undefined,
    };
    this.active.set(run.id, active);
    active.done = this.execute(run, active, project.root);
    return structuredClone(run);
  }
  cancel(id: string) {
    const active = this.active.get(id);
    if (!active) throw new Error('This run is not active');
    active.abort.abort();
  }
  release(id: string, name: string) {
    const active = this.active.get(id);
    if (!active?.release) throw new Error('This run has no active scenario');
    active.release(name);
  }
  async close() {
    for (const active of this.active.values()) active.abort.abort();
    await Promise.all([...this.active.values()].map((item) => item.done));
  }
  private async execute(
    run: Run,
    active: { abort: AbortController; release?: (name: string) => void },
    root: string,
  ) {
    let browser: Browser | undefined;
    let mock: Awaited<ReturnType<typeof startScenario>> | undefined;
    let page: Page | undefined;
    let traceStarted = false;
    let outcome: RunStatus = 'passed';
    const directory = join(this.store.directory, 'artifacts', run.id);
    mkdirSync(directory, { recursive: true, mode: 0o700 });
    const network: unknown[] = [];
    const event = (
      kind: RunEvent['kind'],
      message: string,
      level: RunEvent['level'] = 'info',
      detail?: string,
    ) => {
      if (run.events.length >= 2000) return;
      run.events.push({
        id: run.events.length + 1,
        at: new Date().toISOString(),
        kind,
        message: message.slice(0, 2000),
        level,
        detail: detail?.slice(0, 8000),
      });
      this.store.saveRun(run);
    };
    const artifact = (name: string, type: Artifact['type'], file: string) => {
      run.artifacts.push({
        id: randomUUID(),
        name,
        type,
        file,
        size: statSync(join(directory, file)).size,
      });
    };
    const screenshot = async (name: string) => {
      if (!page || page.isClosed()) return;
      const file = `${run.artifacts.length}-${name}.png`;
      await page.screenshot({ path: join(directory, file), fullPage: true, timeout: 5000 });
      artifact(name, 'image', file);
    };
    const abortBrowser = () => {
      void browser?.close().catch(() => {});
    };
    active.abort.signal.addEventListener('abort', abortBrowser, { once: true });
    const budget = setTimeout(
      () => active.abort.abort(new Error('Run exceeded the five-minute limit')),
      300_000,
    );
    try {
      run.status = 'running';
      event('system', 'Run started from a saved configuration');
      if (run.configSnapshot.scenario) {
        mock = await startScenario(run.configSnapshot.scenario, (message, detail) =>
          event('scenario', message, 'info', detail),
        );
        active.release = mock.release;
        event('system', `Scenario listening at ${mock.url}`);
      }
      if (run.configSnapshot.suite.runner) {
        const files = await executeExternal(
          run.configSnapshot.suite,
          root,
          directory,
          active.abort.signal,
          {
            baseUrl: run.configSnapshot.baseUrl,
            mockUrl: mock?.url ?? '',
            controlToken: mock?.controlToken ?? '',
          },
          (message) => event('console', message),
        );
        for (const file of files) artifact(file.name, file.type, file.file);
        run.completedSteps = 1;
        event('assertion', 'Configured test runner exited successfully', 'success');
        return;
      }
      const browserSteps = run.configSnapshot.suite.steps.some(
        (step) => !['request', 'checkpoint'].includes(step.type),
      );
      if (browserSteps) {
        const require = createRequire(
          join(
            process.env.REHEARSAL_RUNTIME_DIR ||
              dirname(resolve(process.argv[1] ?? 'package.json')),
            'package.json',
          ),
        );
        const { chromium } = require('playwright-core') as typeof import('playwright-core');
        browser = await chromium.launch({ headless: true });
        active.abort.signal.throwIfAborted();
        const context = await browser.newContext({
          viewport: { width: 1280, height: 800 },
          reducedMotion: 'reduce',
        });
        await context.tracing.start({ screenshots: true, snapshots: true, sources: false });
        traceStarted = true;
        page = await context.newPage();
        page.on('console', (message) => {
          if (['error', 'warning'].includes(message.type()))
            event('console', message.text(), message.type() === 'error' ? 'error' : 'info');
        });
        page.on('pageerror', (error) => event('console', error.message, 'error'));
        page.on('requestfailed', (request) =>
          event(
            'network',
            `${request.method()} ${cleanUrl(request.url())}`,
            'error',
            request.failure()?.errorText,
          ),
        );
        page.on('response', (response) => {
          if (network.length >= 500) return;
          const entry = {
            method: response.request().method(),
            url: cleanUrl(response.url()),
            status: response.status(),
            at: new Date().toISOString(),
          };
          network.push(entry);
          if (response.status() >= 400)
            event('network', `${entry.status} ${entry.method} ${entry.url}`, 'info');
        });
      }
      const variables = { baseUrl: run.configSnapshot.baseUrl, mockUrl: mock?.url ?? '' };
      for (const [index, step] of run.configSnapshot.suite.steps.entries()) {
        active.abort.signal.throwIfAborted();
        event('step', `${index + 1}. ${stepLabel(step)}`);
        await executeStep(
          step,
          page,
          variables,
          active.abort.signal,
          mock?.release,
          screenshot,
          event,
          (request) => network.push(request),
        );
        run.completedSteps = index + 1;
        event(
          step.type.startsWith('expect') || step.type === 'request' ? 'assertion' : 'step',
          `Step ${index + 1} completed`,
          'success',
        );
      }
      await screenshot('completed');
      event('system', 'All configured assertions passed', 'success');
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);
      const browserMissing = /Executable doesn't exist|browserType.launch|Cannot find module/.test(
        reason,
      );
      outcome = active.abort.signal.aborted
        ? 'cancelled'
        : browserMissing || reason.startsWith('Runner unavailable:')
          ? 'blocked'
          : 'failed';
      run.error = browserMissing
        ? 'Chromium is not installed. Run npm run browsers:install, then rerun.'
        : active.abort.signal.aborted
          ? String(active.abort.signal.reason?.message ?? 'Cancelled by user')
          : reason;
      event('system', run.error, 'error');
      await screenshot('failure').catch(() => {});
    } finally {
      clearTimeout(budget);
      active.abort.signal.removeEventListener('abort', abortBrowser);
      if (browser && traceStarted) {
        try {
          await browser.contexts()[0]?.tracing.stop({ path: join(directory, 'trace.zip') });
          artifact('Playwright trace', 'trace', 'trace.zip');
        } catch {
          event('system', 'Trace unavailable because the browser closed before finalization');
        }
      }
      await browser?.close().catch(() => {});
      await mock?.close();
      if (
        existsSync(join(directory, 'runner-output.json')) &&
        !run.artifacts.some((item) => item.file === 'runner-output.json')
      )
        artifact('Runner output', 'json', 'runner-output.json');
      if (run.configSnapshot.suite.runner)
        for (const file of collectExternalArtifacts(directory)) {
          if (!run.artifacts.some((item) => item.file === file.file))
            artifact(file.name, file.type, file.file);
        }
      writeFileSync(join(directory, 'network.json'), JSON.stringify(network, null, 2));
      artifact('Network requests', 'json', 'network.json');
      run.status = outcome;
      run.finishedAt = new Date().toISOString();
      run.durationMs = Date.parse(run.finishedAt) - Date.parse(run.startedAt);
      this.store.saveRun(run);
      this.active.delete(run.id);
    }
  }
}

function interpolate(value: string, variables: Record<string, string>) {
  return value.replace(/\{\{(baseUrl|mockUrl)\}\}/g, (_, key: string) => {
    if (!variables[key])
      throw new Error(`Variable {{${key}}} is unavailable. Select a scenario for mockUrl.`);
    return variables[key];
  });
}
function target(value: string, variables: Record<string, string>) {
  const url = new URL(interpolate(value, variables), variables.baseUrl);
  const origins = [variables.baseUrl, variables.mockUrl]
    .filter(Boolean)
    .map((item) => new URL(item).origin);
  if (!['http:', 'https:'].includes(url.protocol) || !origins.includes(url.origin))
    throw new Error('Step URL must use the project or scenario origin');
  return url.toString();
}
export function stepLabel(step: Step) {
  switch (step.type) {
    case 'navigate':
      return `Open ${step.url}`;
    case 'fill':
      return `Fill ${step.label}`;
    case 'click':
      return `Click ${step.name}`;
    case 'expectText':
      return `Expect text: ${step.text}`;
    case 'expectUrl':
      return `Expect URL containing ${step.includes}`;
    case 'request':
      return `${step.method} ${step.url}, expect ${step.expectStatus}`;
    case 'screenshot':
      return `Capture ${step.name}`;
    case 'checkpoint':
      return `Release ${step.name}`;
  }
}
async function executeStep(
  step: Step,
  page: Page | undefined,
  variables: Record<string, string>,
  signal: AbortSignal,
  release: ((name: string) => void) | undefined,
  screenshot: (name: string) => Promise<void>,
  event: (
    kind: RunEvent['kind'],
    message: string,
    level?: RunEvent['level'],
    detail?: string,
  ) => void,
  recordRequest: (request: { method: string; url: string; status: number; at: string }) => void,
) {
  if (step.type === 'checkpoint') {
    if (!release) throw new Error('No scenario is active');
    release(step.name);
    return;
  }
  if (step.type === 'request') {
    const url = target(step.url, variables);
    const response = await fetch(url, {
      method: step.method,
      body: step.body === undefined ? undefined : JSON.stringify(step.body),
      headers: { 'Content-Type': 'application/json' },
      signal: AbortSignal.any([signal, AbortSignal.timeout(step.timeoutMs)]),
      redirect: 'error',
    });
    const body = await readBounded(response, 2_000_000);
    recordRequest({
      method: step.method,
      url: cleanUrl(url),
      status: response.status,
      at: new Date().toISOString(),
    });
    event('network', `${step.method} ${cleanUrl(url)} returned ${response.status}`);
    if (response.status !== step.expectStatus)
      throw new Error(`Expected status ${step.expectStatus}, received ${response.status}`);
    if (step.expectBodyIncludes && !body.includes(step.expectBodyIncludes))
      throw new Error(`Response did not contain: ${step.expectBodyIncludes}`);
    return;
  }
  if (!page) throw new Error('Browser is not available');
  switch (step.type) {
    case 'navigate':
      await page.goto(target(step.url, variables), {
        timeout: 30_000,
        waitUntil: 'domcontentloaded',
      });
      break;
    case 'fill':
      await page
        .getByLabel(step.label, { exact: true })
        .fill(interpolate(step.value, variables), { timeout: step.timeoutMs });
      break;
    case 'click':
      await page
        .getByRole(step.role, { name: step.name, exact: true })
        .click({ timeout: step.timeoutMs });
      break;
    case 'expectText':
      await page
        .getByText(step.text, { exact: false })
        .first()
        .waitFor({ state: 'visible', timeout: step.timeoutMs });
      break;
    case 'expectUrl':
      await page.waitForURL((url) => url.href.includes(step.includes), { timeout: step.timeoutMs });
      break;
    case 'screenshot':
      await screenshot(step.name);
      break;
  }
}
async function readBounded(response: Response, maximum: number) {
  if (!response.body) return '';
  const reader = response.body.getReader();
  const parts: Uint8Array[] = [];
  let size = 0;
  try {
    for (;;) {
      const part = await reader.read();
      if (part.done) break;
      size += part.value.length;
      if (size > maximum) throw new Error('Response exceeds the 2 MB assertion limit');
      parts.push(part.value);
    }
  } finally {
    await reader.cancel().catch(() => {});
  }
  return Buffer.concat(parts).toString('utf8');
}
