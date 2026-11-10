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

- The temporary Rehearsal name became Testrill. Existing native workspace identifiers and test environment aliases remain compatible; see [upgrade notes](docs/branding-upgrade.md).

### Known limits

- Physical mobile execution, Windows/Linux desktop packaging, Apple notarization, and named vendor-client setup are not all verified.
- Database reset providers, arbitrary desktop interaction, shared team workspaces, screenshot baselines, and automatic test generation remain roadmap work.
