# Verification record

Local verification on 10 November 2026, macOS on Apple silicon. This record describes checks actually performed; it is not a claim about every operating system or application.

## Engine and integration

- `npm test`: ten tests passed. Covers manifest invariants and published examples, SQLite persistence, run-scoped SSE checkpoints and event-ID resumption, shutdown of waiting streams, real HTTP assertions, failed assertions, network metadata, configured command execution/cancellation, missing-runner classification, API authentication/origin rejection, workspace ownership, evidence export, and authenticated HTTP MCP. The environment lifecycle test confirmed that existing external services are preserved and only owned processes are stopped.
- `npm run build`: TypeScript, Vite production build, and bundled Node engine passed.
- `npm run test:e2e`: two tests passed. The built CLI ran a real browser suite from outside the repository. An MCP stdio client listed tools, inspected the result, and received a recorded screenshot as image content.
- Browser tests executed successful checkout, declined payment handling, and a checkpoint-controlled export. A mismatched scenario deliberately failed; its failure screenshot and trace were retained. Saved replay preserved the original suite/scenario snapshot and reproduced the failure.
- `npm audit --omit=dev`: zero reported vulnerabilities at the time of verification.

## Workbench interactions

The browser integration test exercised these actions and verified their results:

| Action                     | Observed result                                                |
| -------------------------- | -------------------------------------------------------------- |
| Run suite                  | Opens a live run, then a final result with saved artifacts     |
| Artifacts tab              | Lists recorded screenshot and trace artifacts                  |
| Saved definition tab       | Shows the suite/scenario snapshot used by the run              |
| Event filter               | Displays matching assertion events and restores all events     |
| Invalid scenario save      | Shows a validation error                                       |
| Valid scenario save        | Persists the scenario and confirms success                     |
| Add scenario               | Creates and saves a new validated scenario                     |
| Save project configuration | Persists configuration and confirms success                    |
| Copy agent configuration   | Copies the concrete configuration and confirms success         |
| Compare runs               | Displays recorded outcome, step count, duration, and scenario  |
| Release checkpoint         | Completes a waiting stream and the dependent browser assertion |
| Rerun saved                | Starts a new run using the saved definition                    |
| Cancel run                 | Produces a cancelled final outcome                             |
| Import dialog Escape       | Closes the modal                                               |
| Mobile navigation          | Opens and closes the navigation panel                          |

The run inspector passed an axe scan for WCAG 2 A/AA and WCAG 2.1 AA rules with no reported violations in that tested state. The agent connection view had no document overflow at 320, 768, 1024, and 1440 pixels. No uncaught page errors were recorded during the integration flow. These automated checks do not replace a full screen-reader or manual accessibility audit. Other screens and zoom combinations may need further review.

Screenshots in `docs/screenshots/` come from actual executions against the bundled example, not invented run data.

## Packaged native application

- Built a macOS `.app` with the bundled Node runtime and engine.
- Launched the packaged app and observed a connected local engine.
- Ran Successful checkout: five steps passed; the run retained two screenshots, a Playwright trace, and network metadata.
- Exported that run through the native Save dialog. The ZIP was opened and validated, and its run manifest recorded a passed outcome with four artifacts.
- Imported the HTTP example through the native file chooser and ran its contract successfully.
- Observed the generated MCP configuration pointing to the packaged executable and the native workspace.
- After the lifecycle correction, restarted the native app, ran another API contract, inspected its recorded HTTP request metadata, and quit. The engine connection file and workspace ownership lock were both removed.

The initial release build hit the [upstream Mach-O stripping issue](https://github.com/rust-lang/rust/issues/157750). Release stripping is disabled so affected proc-macro libraries remain loadable. The final native bundle built successfully.

## Not verified

- Physical Android/iOS or simulator execution through Maestro. The adapter is implemented, but this session did not run a mobile device flow.
- Windows/Linux packaging or runtime behavior. The CI configuration is provided; no remote GitHub Actions run is claimed.
- Named vendor-client setup in Claude, Codex, or ChatGPT. Protocol integration was tested with the official MCP SDK, including stdio and HTTP.
- Arbitrary desktop UI automation, database snapshot/reset, team collaboration, screenshot-diff baselines, or automatic test generation; these remain roadmap work.
- macOS signing/notarization for distribution to other machines.

Run evidence contains application data. The public screenshots use only the bundled example. Live traces and images are not automatically sanitized.
