# Agent integration

The desktop workbench's Agent connection page generates a stdio configuration using the currently running engine's executable, entry point, and data directory. This works for a packaged app as well as a source checkout. Keep the app installed at that path or regenerate the configuration after moving it.

For a source checkout, build once and configure an MCP client with `node /absolute/path/testrill/dist-engine/main.cjs mcp --data /absolute/path/workspace`. Start the engine first or let the CLI start it. Avoid `npm run` wrappers for stdio configuration because npm prints script banners to stdout.

```json
{
  "mcpServers": {
    "testrill": {
      "command": "node",
      "args": [
        "/absolute/path/testrill/dist-engine/main.cjs",
        "mcp",
        "--data",
        "/absolute/path/workspace"
      ]
    }
  }
}
```

Replace both placeholder paths with real absolute paths. If the client cannot find Node through PATH, set `command` to its absolute executable path. For the installed desktop app, copy its generated configuration instead: it uses the bundled runtime and the existing native workspace.

## Tool reference

| Tool                  | Arguments                                           | Effect                                                                   |
| --------------------- | --------------------------------------------------- | ------------------------------------------------------------------------ |
| `list_projects`       | None                                                | List workspace projects                                                  |
| `import_project`      | `path`                                              | Register a trusted local manifest                                        |
| `inspect_project`     | `projectId`                                         | Read project configuration and environment state                         |
| `update_project`      | `projectId`, `config`                               | Validate/save the workspace copy; does not overwrite the source manifest |
| `prepare_environment` | `projectId`                                         | Start/check the already-declared environment                             |
| `stop_environment`    | `projectId`                                         | Stop only an owned process                                               |
| `run_suite`           | `projectId`, `suiteId`, optional `scenarioId`       | Start asynchronously and return a run ID                                 |
| `list_runs`           | Optional `projectId`                                | List recent recorded results                                             |
| `inspect_run`         | `runId`, optional `eventLimit` (1–500, default 100) | Read result, snapshot, artifacts, and recent events                      |
| `release_checkpoint`  | `runId`, `name`                                     | Release a checkpoint for that run                                        |
| `cancel_run`          | `runId`                                             | Request cancellation                                                     |
| `rerun_saved`         | `runId`                                             | Start from the stored suite/scenario/target definition                   |
| `get_artifact`        | `runId`, `artifactId`                               | Read image or JSON evidence                                              |
| `export_run`          | `runId`                                             | Save an evidence ZIP on the engine machine                               |

For example, call `run_suite` with `{ "projectId": "example-storefront", "suiteId": "checkout" }`, retain the returned ID, and poll `inspect_run` until it is terminal. The bundled example avoids needing access to a separate application for this first integration check. Use [project manifests](manifests.md) to register the application you actually want to test.

## Expected verification loop

1. `list_projects` and `inspect_project`: discover configured suites and scenarios.
2. `prepare_environment`: optionally start the already-declared trusted command.
3. `run_suite`: start an asynchronous execution and retain its run ID.
4. `inspect_run`: poll while queued/running. Release named checkpoints when required by the test.
5. On failure, inspect the error, assertion events, console/network context, and `get_artifact` screenshot.
6. After changing the application, use `rerun_saved` for the same suite/scenario definition.
7. Report the final outcome, run ID, assertions actually checked, and artifact names.

An exploratory agent can edit a project's manifest and import it, or use `update_project` for an already registered project. Updating a workspace configuration does not overwrite its source manifest. There is no automatic natural-language test generator in this release.

## HTTP clients

The engine supports stateless MCP Streamable HTTP at `/mcp`. Requests require `Authorization: Bearer <token>`. The token is in the workspace's private `connection.json`; never put it in a public repository or issue report. The server listens on loopback and restricts browser origins.

Hosted clients cannot reach localhost directly. Connecting ChatGPT or another hosted service requires a client-supported transport/authentication configuration and a separately configured reachable bridge. Testrill does not create a tunnel, implement OAuth, or claim compatibility with every hosted connector. Test the chosen connection before adopting it.

Local stdio and authenticated HTTP are tested with the official MCP SDK. Named vendor applications have not all been tested interactively. A client supporting the protocol still has its own installation and permission requirements.

## Result interpretation

Do not report a passing test from `run_suite` alone. Poll to a terminal status. `passed` records the configured assertions or external runner's exit code, not the agent's assessment of a screenshot. Network failures may be intentional scenario behavior. Retain the distinction between failed, blocked, cancelled, and interrupted runs.

`get_artifact` returns images as MCP image content and JSON as text. `export_run` saves a ZIP on the engine machine, intended for local agents. A remote agent cannot assume it can open that local path.

JSON artifact text is limited to 80,000 characters in the tool response. Use an export when the complete artifact is needed. `inspect_run` returns recent events up to its configured limit and includes the total event count.

## Contributing with an agent

When an agent is changing Testrill itself, follow [AGENTS.md](../AGENTS.md) and [CONTRIBUTING.md](../CONTRIBUTING.md). The [repository testing skill](../.agents/skills/testrill/SKILL.md) describes how to use Testrill against a consuming project. Do not confuse contributing to this engine with using the engine to test another app.
