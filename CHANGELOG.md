# Changelog

User-facing changes are recorded here. The initial public source is an early preview with package version `0.1.0`; no stable plugin API or binary release is implied.

## Unreleased

### Added

- A local Tauri workbench, CLI, and stdio/authenticated HTTP MCP interfaces using one test execution engine.
- Browser steps, HTTP assertions, existing-command suites, and a Maestro process adapter.
- Run-scoped HTTP/SSE scenarios, named checkpoints, event-ID resumption, and controlled failures.
- Recorded assertion events, screenshots, traces, network metadata, command output, saved-definition reruns, comparison, and evidence exports.
- Project/scenario editing, searchable suites and run history, keyboard-accessible evidence tabs, and responsive navigation.
- Contributor and agent guides, issue forms, ownership/review policy, security reporting instructions, documentation validation, and CI.

### Changed

- Backported the upstream GLib string-iterator fix to the Linux native dependency tree. Vendored source verification and optimized regression tests now run in CI alongside a Linux native compile check; see the [backport review](docs/security/glib-backport.md).

- Updated direct npm dependencies to their latest stable releases, including Vite 8, React's Vite plugin 6, TypeScript 7, and esbuild 0.28. Development, CI, and bundled-engine builds now require Node 26 LTS or newer and use npm 12.2.2 with reviewed install scripts.
- Raised Rust dependency minimums to the current stable releases. Dependabot now checks daily and groups related React, Playwright, Tauri JavaScript, and Vite/toolchain updates.

- The temporary Rehearsal name became Testrill. Existing native workspace identifiers and test environment aliases remain compatible; see [upgrade notes](docs/branding-upgrade.md).

### Known limits

- The upstream Linux native stack still includes unmaintained `proc-macro-error`; GLib uses a reviewed local security backport until a compatible upstream dependency update is available. See the [security policy](SECURITY.md).

- Physical mobile execution, Windows/Linux desktop packaging, Apple notarization, and named vendor-client setup are not all verified.
- Database reset providers, arbitrary desktop interaction, shared team workspaces, screenshot baselines, and automatic test generation remain roadmap work.
