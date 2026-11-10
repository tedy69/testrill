import { z } from 'zod';

const name = z.string().trim().min(1).max(160);
const key = z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/);
const relative = z.string().max(2000);
export const streamActionSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('event'),
    data: z.string().max(100_000),
    event: key.optional(),
    id: z
      .string()
      .max(200)
      .regex(/^[^\r\n]*$/)
      .optional(),
  }),
  z.object({ type: z.literal('delay'), ms: z.number().int().min(0).max(60_000) }),
  z.object({ type: z.literal('checkpoint'), name: key }),
  z.object({ type: z.literal('disconnect') }),
]);
export const routeSchema = z.object({
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
  path: z.string().startsWith('/').max(500),
  status: z.number().int().min(200).max(599).default(200),
  delayMs: z.number().int().min(0).max(60_000).default(0),
  body: z.unknown().optional(),
  stream: z.array(streamActionSchema).max(500).optional(),
});
export const scenarioSchema = z
  .object({
    id: key,
    name,
    description: z.string().max(2000).default(''),
    routes: z.array(routeSchema).min(1).max(100),
  })
  .superRefine((scenario, ctx) => {
    const seen = new Set<string>();
    scenario.routes.forEach((route, index) => {
      const routeKey = `${route.method} ${route.path}`;
      if (seen.has(routeKey))
        ctx.addIssue({
          code: 'custom',
          path: ['routes', index, 'path'],
          message: 'Duplicate method and path',
        });
      seen.add(routeKey);
    });
  });
const timeoutMs = z.number().int().min(100).max(60_000).default(10_000);
export const stepSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('navigate'), url: relative }),
  z.object({
    type: z.literal('click'),
    role: z.enum(['button', 'link', 'checkbox', 'tab']).default('button'),
    name,
    timeoutMs,
  }),
  z.object({ type: z.literal('fill'), label: name, value: z.string().max(20_000), timeoutMs }),
  z.object({ type: z.literal('expectText'), text: name, timeoutMs }),
  z.object({ type: z.literal('expectUrl'), includes: name, timeoutMs }),
  z.object({ type: z.literal('screenshot'), name: key }),
  z.object({ type: z.literal('checkpoint'), name: key }),
  z.object({
    type: z.literal('request'),
    url: relative,
    method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).default('GET'),
    body: z.unknown().optional(),
    expectStatus: z.number().int().min(100).max(599),
    expectBodyIncludes: z.string().max(2000).optional(),
    timeoutMs,
  }),
]);
export const suiteSchema = z
  .object({
    id: key,
    name,
    description: z.string().max(2000).default(''),
    defaultScenario: key.optional(),
    steps: z.array(stepSchema).max(200).default([]),
    runner: z
      .discriminatedUnion('type', [
        z.object({
          type: z.literal('command'),
          command: z.array(z.string().min(1).max(2000)).min(1).max(30),
          timeoutMs: z.number().int().min(100).max(300_000).default(120_000),
        }),
        z.object({
          type: z.literal('maestro'),
          flow: z.string().min(1).max(2000),
          device: z.string().max(200).optional(),
          timeoutMs: z.number().int().min(100).max(300_000).default(120_000),
        }),
      ])
      .optional(),
  })
  .superRefine((suite, ctx) => {
    if (!suite.runner && !suite.steps.length)
      ctx.addIssue({ code: 'custom', path: ['steps'], message: 'Provide steps or a runner' });
    if (suite.runner && suite.steps.length)
      ctx.addIssue({
        code: 'custom',
        path: ['runner'],
        message: 'Use a runner or inline steps, not both',
      });
  });
export const projectSchema = z
  .object({
    version: z.literal(1),
    id: key,
    name,
    description: z.string().max(2000).default(''),
    baseUrl: z
      .string()
      .url()
      .refine((value) => /^https?:/.test(value), 'Use an HTTP or HTTPS URL'),
    environment: z
      .object({
        command: z.array(z.string().min(1).max(2000)).min(1).max(30),
        readyUrl: z.string().url().optional(),
      })
      .optional(),
    suites: z.array(suiteSchema).min(1).max(100),
    scenarios: z.array(scenarioSchema).max(100).default([]),
  })
  .superRefine((project, ctx) => {
    for (const field of ['suites', 'scenarios'] as const) {
      const ids = project[field].map((item) => item.id);
      if (new Set(ids).size !== ids.length)
        ctx.addIssue({ code: 'custom', path: [field], message: `Duplicate ${field} IDs` });
    }
    for (const suite of project.suites) {
      if (
        suite.defaultScenario &&
        !project.scenarios.some((item) => item.id === suite.defaultScenario)
      ) {
        ctx.addIssue({
          code: 'custom',
          path: ['suites'],
          message: `Unknown default scenario: ${suite.defaultScenario}`,
        });
      }
    }
  });

export type ProjectConfig = z.infer<typeof projectSchema>;
export type Scenario = z.infer<typeof scenarioSchema>;
export type Suite = z.infer<typeof suiteSchema>;
export type Step = z.infer<typeof stepSchema>;
export type Project = {
  config: ProjectConfig;
  root: string;
  sourcePath?: string;
  updatedAt: string;
};
export type RunStatus =
  'queued' | 'running' | 'passed' | 'failed' | 'blocked' | 'cancelled' | 'interrupted';
export type RunEvent = {
  id: number;
  at: string;
  kind: 'step' | 'assertion' | 'network' | 'console' | 'scenario' | 'system';
  message: string;
  level: 'info' | 'success' | 'error';
  detail?: string;
};
export type Artifact = {
  id: string;
  name: string;
  type: 'image' | 'trace' | 'json';
  file: string;
  size: number;
};
export type Run = {
  id: string;
  projectId: string;
  projectName: string;
  suiteId: string;
  suiteName: string;
  scenarioId?: string;
  scenarioName?: string;
  status: RunStatus;
  startedAt: string;
  finishedAt?: string;
  durationMs?: number;
  error?: string;
  completedSteps: number;
  totalSteps: number;
  events: RunEvent[];
  artifacts: Artifact[];
  configSnapshot: { suite: Suite; scenario?: Scenario; baseUrl: string };
};
export type Environment = {
  status: 'stopped' | 'starting' | 'ready' | 'error';
  pid?: number;
  logs: string[];
  error?: string;
};
export const finished = (status: RunStatus) => !['queued', 'running'].includes(status);
