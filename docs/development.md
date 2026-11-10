# Development

## Requirements and startup

Use Node.js 26 LTS or newer and npm 12.2.2 (the version recorded in `packageManager` and installed by CI). `.nvmrc` selects Node 26 and Node type definitions track that runtime major. No model API key, hosted service, or `.env` file is required for the bundled example.

Install scripts are reviewed in `package.json`: esbuild's binary installer is approved for its checked version; the optional fsevents build is denied because the registry package includes its native binary. Review and update the esbuild approval when upgrading it. Do not enable every dependency script to bypass a failed install. See the [dependency review](dependency-review.md) for current versions, checks, and upstream constraints.

```sh
npm ci
npm run browsers:install
npm run dev
```

Open `http://127.0.0.1:1420`. The dev launcher starts the Vite UI and local engine; Ctrl+C stops its owned processes. The engine serves the bundled storefront, so no second target app is needed. Run Successful checkout, Declined payment recovery, and Export with a test checkpoint to explore real assertions and evidence.

The source workspace defaults to `.testrill/`. `--data /absolute/path/to/state` selects a different engine workspace; `TESTRILL_DATA_DIR` sets the source default. The native application uses the operating system's app-data directory instead. Copy Agent connection from the intended workspace rather than assuming both are the same.

## Useful commands

| Command                   | Purpose                                                                                   |
| ------------------------- | ----------------------------------------------------------------------------------------- |
| `npm run dev`             | Run the UI and engine together                                                            |
| `npm run typecheck`       | Check TypeScript                                                                          |
| `npm run build`           | Build the UI and shared engine                                                            |
| `npm test`                | Run engine, schema, scenario, and integration checks                                      |
| `npm run test:e2e`        | Exercise real browser, workbench, CLI, and MCP flows; requires a prior build and Chromium |
| `npm run docs:check`      | Check local documentation links and collaboration configuration                           |
| `npm run format`          | Format source and documentation                                                           |
| `npm run format:check`    | Verify formatting without changing files                                                  |
| `npm run schema`          | Regenerate the manifest JSON schema                                                       |
| `npm run desktop:prepare` | Build and prepare native runtime resources                                                |
| `npm run desktop:dev`     | Start the Tauri development app                                                           |
| `npm run desktop:build`   | Build a native app for the current platform                                               |

The project does not define a separate lint command. Type checking, formatting, tests, and documentation validation are the current checks.

## Source map

| Location                                      | Responsibility                                            |
| --------------------------------------------- | --------------------------------------------------------- |
| `src/schema.ts`                               | Runtime project and run contracts                         |
| `src/server.ts`                               | Authenticated API and workspace lifecycle                 |
| `src/runner.ts`                               | Execution, snapshots, final outcomes, and evidence        |
| `src/scenario-server.ts`                      | Run-scoped HTTP/SSE fixtures and checkpoints              |
| `src/external-runner.ts`                      | Existing command and Maestro process adapters             |
| `src/environments.ts`                         | Readiness and ownership of target processes               |
| `src/store.ts`                                | SQLite persistence and interrupted-run recovery           |
| `src/entry.ts`, `src/client.ts`, `src/mcp.ts` | CLI and MCP interfaces over the same engine               |
| `ui/`                                         | React workbench, shared controls, tokens, and composition |
| `src-tauri/`                                  | Native shell, runtime process, and save dialog            |
| `examples/`                                   | Sanitized runnable manifests and a mobile starter         |
| `tests/`                                      | Engine/integration and browser workflows                  |

## Native prerequisites

Install Rust and the [Tauri prerequisites for your operating system](https://v2.tauri.app/start/prerequisites/). Then prepare resources before invoking Cargo directly:

```sh
npm run desktop:prepare
cd src-tauri
cargo check --locked
```

The preparation script copies the current Node executable, its license, the built engine/UI, and Playwright runtime modules into generated resources. Use an official Node distribution with its license file intact. Chromium is installed separately and is not bundled. External tools such as Maestro must be installed independently.

The app's launch environment may differ from your terminal, especially when launched from Finder. Manifests can use absolute executable paths when PATH discovery is insufficient. Never commit native build output or generated runtime resources.

## Validation and fixtures

Run `npm test`, `npm run build`, and `npm run test:e2e` for behavior changes. Use the bundled example for public screenshots. Browser tests create temporary workspaces, exercise genuine passing and failing assertions, and update `docs/screenshots/`. Do not treat those images as manually invented demo results.

Changes to manifests should update runtime validation, examples, and the generated schema together. Changes to saved-run behavior should preserve replay semantics or document an explicit compatibility plan. See [architecture](architecture.md), [decisions](decisions/README.md), and [AGENTS.md](../AGENTS.md).
