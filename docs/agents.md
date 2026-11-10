# Agent integration

The desktop workbench's Agent connection page generates a stdio configuration using the currently running engine's executable, entry point, and data directory. This works for a packaged app as well as a source checkout. Keep the app installed at that path or regenerate the configuration after moving it.

For a source checkout, build once and configure an MCP client with `node /absolute/path/testrill/dist-engine/main.cjs mcp --data /absolute/path/workspace`. Start the engine first or let the CLI start it. Avoid `npm run` wrappers for stdio configuration because npm prints script banners to stdout.

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
