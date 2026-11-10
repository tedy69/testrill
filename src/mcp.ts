import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';
import { ApiClient, saveExport } from './client.js';
import type { Run } from './schema.js';
import { projectSchema } from './schema.js';

export function createMcpServer(client: ApiClient) {
  const server = new McpServer({ name: 'testrill', version: '0.1.0' });
  const id = z.string().min(1).max(100);
  const register = <T extends z.ZodRawShape>(
    name: string,
    description: string,
    shape: T,
    readOnly: boolean,
    action: (input: z.infer<z.ZodObject<T>>) => Promise<unknown>,
  ) => {
    const inputSchema: z.ZodObject<z.ZodRawShape> = z.object(shape);
    server.registerTool(
      name,
      {
        description,
        inputSchema,
        annotations: { readOnlyHint: readOnly, destructiveHint: false, openWorldHint: false },
      },
      async (input: unknown): Promise<CallToolResult> => {
        try {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify(await action(z.object(shape).parse(input)), null, 2),
              },
            ],
          };
        } catch (error) {
          return {
            isError: true,
            content: [
              {
                type: 'text' as const,
                text: error instanceof Error ? error.message : String(error),
              },
            ],
          };
        }
      },
    );
  };
  register(
    'list_projects',
    'List registered projects and their available suites and scenarios.',
    {},
    true,
    () => client.request('GET', '/api/projects'),
  );
  register(
    'import_project',
    'Import a trusted local testrill.json manifest. Registers configuration; does not execute environment commands.',
    { path: z.string().min(1).max(2000) },
    false,
    (input) => client.request('POST', '/api/projects/import', input),
  );
  register(
    'inspect_project',
    'Read a project definition and its environment state.',
    { projectId: id },
    true,
    (input) => client.request('GET', `/api/projects/${encodeURIComponent(input.projectId)}`),
  );
  register(
    'update_project',
    'Save a validated suite/scenario configuration in this workspace. Does not execute commands or overwrite the source manifest.',
    { projectId: id, config: projectSchema },
    false,
    (input) =>
      client.request('PUT', `/api/projects/${encodeURIComponent(input.projectId)}`, {
        config: input.config,
      }),
  );
  register(
    'prepare_environment',
    'Start the environment command already declared in the trusted project manifest and check readiness.',
    { projectId: id },
    false,
    (input) =>
      client.request(
        'POST',
        `/api/projects/${encodeURIComponent(input.projectId)}/environment/start`,
      ),
  );
  register(
    'stop_environment',
    'Stop only the environment process owned by Testrill.',
    { projectId: id },
    false,
    (input) =>
      client.request(
        'POST',
        `/api/projects/${encodeURIComponent(input.projectId)}/environment/stop`,
      ),
  );
  register(
    'run_suite',
    'Start a suite asynchronously. Poll inspect_run for final assertion results. A started run is not proof that a test passed.',
    { projectId: id, suiteId: id, scenarioId: id.optional() },
    false,
    (input) => client.request('POST', '/api/runs', input),
  );
  register(
    'list_runs',
    'List recent runs, with status and artifact metadata.',
    { projectId: id.optional() },
    true,
    (input) =>
      client.request(
        'GET',
        `/api/runs${input.projectId ? `?project=${encodeURIComponent(input.projectId)}` : ''}`,
      ),
  );
  register(
    'inspect_run',
    'Read run status, assertion evidence, failures, and recent events. Only passed means all configured assertions passed.',
    { runId: id, eventLimit: z.number().int().min(1).max(500).default(100) },
    true,
    async (input) => {
      const run = await client.request<Run>('GET', `/api/runs/${encodeURIComponent(input.runId)}`);
      return {
        ...run,
        events: run.events.slice(-input.eventLimit),
        totalEvents: run.events.length,
      };
    },
  );
  register(
    'release_checkpoint',
    'Release a named checkpoint in this run only.',
    { runId: id, name: z.string().regex(/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,79}$/) },
    false,
    (input) =>
      client.request('POST', `/api/runs/${encodeURIComponent(input.runId)}/checkpoint`, {
        name: input.name,
      }),
  );
  register(
    'cancel_run',
    'Cancel a running suite and close its browser and scenario server.',
    { runId: id },
    false,
    (input) => client.request('POST', `/api/runs/${encodeURIComponent(input.runId)}/cancel`),
  );
  register(
    'rerun_saved',
    'Run the exact suite and scenario snapshot of an earlier run in a fresh browser and mock environment.',
    { runId: id },
    false,
    (input) => client.request('POST', `/api/runs/${encodeURIComponent(input.runId)}/rerun`),
  );
  register(
    'export_run',
    'Save the evidence ZIP to a local path. Includes raw Playwright traces and screenshots; review before sharing. Intended for local agents.',
    { runId: id },
    false,
    (input) => saveExport(client, input.runId),
  );
  server.registerTool(
    'get_artifact',
    {
      description:
        'Read a recorded screenshot as image content or a JSON artifact as text. Use export_run for trace archives.',
      inputSchema: { runId: id, artifactId: id },
      annotations: { readOnlyHint: true },
    },
    async (input) => {
      try {
        const response = await client.fetch(
          'GET',
          `/api/runs/${encodeURIComponent(input.runId)}/artifacts/${encodeURIComponent(input.artifactId)}`,
        );
        if (response.headers.get('content-type')?.startsWith('image/'))
          return {
            content: [
              {
                type: 'image' as const,
                mimeType: 'image/png',
                data: Buffer.from(await response.arrayBuffer()).toString('base64'),
              },
            ],
          };
        if (response.headers.get('content-type')?.includes('json'))
          return {
            content: [{ type: 'text' as const, text: (await response.text()).slice(0, 80_000) }],
          };
        return {
          content: [
            {
              type: 'text' as const,
              text: 'This is a binary trace archive. Use export_run to save it locally.',
            },
          ],
        };
      } catch (error) {
        return { isError: true, content: [{ type: 'text' as const, text: String(error) }] };
      }
    },
  );
  return server;
}
