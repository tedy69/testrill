import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { setTimeout as delay } from 'node:timers/promises';
import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import { startEngine } from '../../src/server.js';
import { ApiClient } from '../../src/client.js';
import { finished, type Run, type Project } from '../../src/schema.js';

test(
  'browser examples, failure evidence, saved rerun, accessible UI, and responsive layouts',
  { timeout: 180_000 },
  async () => {
    const directory = mkdtempSync(join(tmpdir(), 'testrill-e2e-'));
    const engine = await startEngine({ directory, uiDirectory: resolve('dist') });
    const client = new ApiClient(engine.connection);
    const browser = await chromium.launch();
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    const wait = async (id: string) => {
      for (let i = 0; i < 600; i++) {
        const run = await client.request<Run>('GET', `/api/runs/${id}`);
        if (finished(run.status)) return run;
        await delay(50);
      }
      throw new Error('Run did not finish');
    };
    try {
      for (const suiteId of ['checkout', 'declined', 'export']) {
        const started = await client.request<Run>('POST', '/api/runs', {
          projectId: 'example-storefront',
          suiteId,
        });
        const run = await wait(started.id);
        assert.equal(run.status, 'passed', `${suiteId}: ${run.error}`);
        assert.ok(run.artifacts.some((item) => item.type === 'image'));
        assert.ok(run.artifacts.some((item) => item.type === 'trace'));
      }
      const bad = await client.request<Run>('POST', '/api/runs', {
        projectId: 'example-storefront',
        suiteId: 'checkout',
        scenarioId: 'payment-declined',
      });
      const failed = await wait(bad.id);
      assert.equal(failed.status, 'failed');
      assert.ok(failed.artifacts.some((item) => item.name === 'failure'));
      const replay = await client.request<Run>('POST', `/api/runs/${bad.id}/rerun`);
      const replayed = await wait(replay.id);
      assert.equal(replayed.status, 'failed');
      assert.deepEqual(replayed.configSnapshot, failed.configSnapshot);

      await page.goto(`${engine.connection.url}/#token=${engine.connection.token}`);
      await page.getByRole('heading', { name: 'Test suites', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Run suite', exact: true }).click();
      await page.getByRole('heading', { name: 'Successful checkout', exact: true }).waitFor();
      await page
        .getByRole('button', { name: 'Export evidence', exact: true })
        .waitFor({ timeout: 30_000 });
      await page.getByRole('tab', { name: /Artifacts/ }).click();
      assert.ok(await page.getByRole('button', { name: /Download order-confirmation/ }).count());
      await page.getByRole('tab', { name: 'Saved definition' }).click();
      assert.match(await page.locator('.saved-definition pre').innerText(), /payment-success/);
      await page.getByRole('tab', { name: 'Event timeline' }).click();
      await page.getByLabel('Filter events').selectOption('assertion');
      assert.ok(await page.locator('.event').count());
      await page.getByLabel('Filter events').selectOption('all');
      const scan = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
        .analyze();
      assert.deepEqual(
        scan.violations.map((v) => ({
          id: v.id,
          impact: v.impact,
          nodes: v.nodes.map((n) => n.target),
        })),
        [],
      );
      mkdirSync('docs/screenshots', { recursive: true });
      await page.screenshot({ path: 'docs/screenshots/evidence.png', fullPage: true });
      await page.getByRole('button', { name: 'Test suites', exact: false }).first().click();
      await page.screenshot({ path: 'docs/screenshots/workbench.png', fullPage: true });
      await page.getByRole('button', { name: 'Scenarios', exact: true }).click();
      await page.getByLabel('Scenario JSON').fill('{broken');
      await page.getByRole('button', { name: 'Save scenario' }).click();
      await page.getByRole('alert').waitFor();
      await page.getByRole('button', { name: 'Payment accepted', exact: false }).click();
      await page.getByRole('button', { name: 'Save scenario' }).click();
      await page.getByRole('status').filter({ hasText: 'Scenario saved' }).waitFor();
      await page.getByRole('button', { name: 'Agent connection' }).click();
      await page.getByRole('heading', { name: 'Your agent, the same workbench.' }).waitFor();
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      await page.getByRole('button', { name: 'Copy configuration' }).click();
      await page.getByRole('button', { name: 'Copied', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Project configuration', exact: true }).click();
      await page.getByRole('button', { name: 'Save configuration', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'Project configuration saved' }).waitFor();
      await page.getByRole('button', { name: 'Scenarios', exact: true }).click();
      await page.getByRole('button', { name: 'Add scenario', exact: true }).click();
      await page.getByRole('button', { name: 'Save scenario', exact: true }).click();
      await page.getByRole('status').filter({ hasText: 'Scenario saved' }).waitFor();
      await page.getByRole('button', { name: 'Run history', exact: true }).click();
      await page.getByText('Compare two runs', { exact: true }).click();
      const options = page.locator('.compare-inputs select');
      await options.nth(0).selectOption({ index: 1 });
      await options.nth(1).selectOption({ index: 2 });
      assert.ok(await page.locator('.comparison-result table').count());

      const owner = await client.request<Project>('GET', '/api/projects/example-storefront');
      owner.config.suites.push({
        id: 'manual-checkpoint',
        name: 'Manual checkpoint release',
        description: 'UI lifecycle verification',
        defaultScenario: 'export-checkpoint',
        steps: [
          { type: 'navigate', url: '?api={{mockUrl}}' },
          { type: 'click', role: 'button', name: 'Start export', timeoutMs: 10000 },
          { type: 'expectText', text: 'Export ready', timeoutMs: 20000 },
        ],
      });
      await client.request('PUT', '/api/projects/example-storefront', { config: owner.config });
      await page.reload();
      await page.getByRole('button', { name: /Manual checkpoint release/ }).click();
      await page.getByRole('button', { name: 'Run suite', exact: true }).click();
      await page.getByRole('button', { name: 'Release checkpoint', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Release checkpoint', exact: true }).click();
      await page.getByRole('button', { name: 'Export evidence', exact: true }).waitFor();
      assert.match(await page.locator('.run-heading').innerText(), /passed/i);
      await page.getByRole('button', { name: 'Rerun saved', exact: true }).click();
      await page.getByRole('button', { name: 'Cancel run', exact: true }).waitFor();
      await page.getByRole('button', { name: 'Cancel run', exact: true }).click();
      await page.getByRole('button', { name: 'Export evidence', exact: true }).waitFor();
      assert.match(await page.locator('.run-heading').innerText(), /cancelled/i);
      await page.getByRole('button', { name: 'Agent connection', exact: true }).click();
      await page.getByRole('button', { name: 'Import project', exact: true }).click();
      await page.getByRole('dialog').waitFor();
      await page.keyboard.press('Escape');
      assert.equal(await page.getByRole('dialog').count(), 0);
      for (const width of [320, 768, 1024, 1440]) {
        await page.setViewportSize({ width, height: 1000 });
        const dimensions = await page.evaluate(() => ({
          scroll: document.documentElement.scrollWidth,
          viewport: innerWidth,
        }));
        assert.ok(
          dimensions.scroll <= dimensions.viewport,
          `Overflow at ${width}: ${dimensions.scroll}`,
        );
      }
      await page.setViewportSize({ width: 320, height: 900 });
      await page.getByRole('button', { name: 'Open navigation' }).click();
      await page.getByRole('button', { name: 'Close navigation' }).click();
      assert.deepEqual(errors, []);
    } finally {
      await browser.close();
      await engine.close();
      rmSync(directory, { recursive: true, force: true });
    }
  },
);
