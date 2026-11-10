---
name: rehearsal
description: Use Rehearsal's CLI or MCP server to run a registered project's tests and inspect recorded evidence.
---

# Rehearsal testing

Use the connected Rehearsal MCP server when available. Otherwise, run the built CLI with an absolute path to `dist-engine/main.cjs` and the intended `--data` workspace. Never assume the desktop app and the current directory use the same workspace; inspect Agent connection first.

1. Discover projects and inspect their suites/scenarios.
2. Prepare the configured environment if needed. Do not replace its command without the user's instruction.
3. Start a suite and retain its run ID.
4. Poll until the status is final. Use the configured checkpoint names if a stream is waiting.
5. Inspect failures and recorded artifacts before changing the target app.
6. After a fix, rerun the saved definition to preserve the suite and scenario.
7. Report the run ID, final status, configured assertions that were exercised, artifact names, and anything blocked or unverified.

A screenshot is evidence of appearance, not a passing assertion. A command adapter's success means its configured command exited with code 0. Application database state is not automatically reset. Evidence exports may contain application data; do not upload or publish them without the user's authorization.
