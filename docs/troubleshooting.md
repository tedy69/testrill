# Troubleshooting

## Browser suites are blocked

Install Chromium with `npm run browsers:install` in the checkout used for development. A native bundle contains the Playwright runtime, not the Chromium download. A missing runner/browser is a blocked result rather than evidence that an assertion failed. Inspect the run error before changing the target app.

## The engine does not connect

Run `npm run dev:engine` in a terminal to inspect startup output. Check that Node is at least 22.13 and that the intended workspace is writable. The dev UI expects its engine at port 4317; `npm run dev` starts both components. Another engine may already own the workspace or port.

Do not delete an active workspace lock, connection file, SQLite file, WAL, or evidence directory to force a second process to start. Stop the process that owns the workspace, or use a separate `--data` directory. The native app normally stops its owned engine when it quits.

## CLI and desktop show different projects

They may be using different workspaces. Source commands default to `.testrill/` in the current directory; the native app uses the OS application-data directory. Use Agent connection to find the intended workspace and pass its absolute path with `--data`. See [upgrade compatibility](branding-upgrade.md) for the previous naming convention.

## A command works in a terminal but not in the app

A graphical app can inherit a different PATH. Use an absolute executable path in the command array. Commands are not shell expressions: `['npm', 'run', 'test']` is valid; a single entry containing `npm run test` is not. On Windows, use the executable the OS actually provides, such as `npm.cmd`. Check the runner-output artifact for the exact error.

## A run is waiting indefinitely

Inspect the event timeline for a named checkpoint or an unmet assertion. Release the checkpoint from the workbench, CLI, MCP, or an authenticated test-control request. The selected scenario may intentionally disconnect or omit a response. Cancel the run if the waiting state is no longer useful. An overall timeout still bounds execution.

## An imported project ID already exists

Edit its workspace configuration instead of importing the same ID again. If it is a different project, give its manifest a distinct stable ID. Saving a workspace edit does not update the original file unless an explicit source write is requested.

## An MCP client cannot connect

Build the source engine first, use absolute paths, and use the same `--data` workspace as the app. Copy the current configuration again after moving the app. For stdio, run the entry point directly rather than an npm wrapper that prints banners. HTTP requires the bearer token and a client-compatible transport setup. Hosted clients cannot directly reach your machine's loopback address; Testrill does not create a tunnel or OAuth bridge.

## A screenshot looks correct but the run failed

Read the assertion ledger. A screenshot records appearance; the configured assertion or command exit determines the result. Rerun the saved definition after fixing the target so the suite/scenario configuration remains comparable. The target's database and external services are not automatically reset.

For unresolved problems, use the [support guide](../SUPPORT.md) and include a sanitized reproduction.
