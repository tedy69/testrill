# ADR-0001: One shared local execution engine

## Status

Accepted. Records the implemented foundation.

## Context

People need to run tests from a desktop workbench, while coding agents need CLI and MCP entry points. Separate execution implementations would allow different assertions, lifecycle handling, or evidence semantics for the same suite.

## Decision

Use one Node engine, authenticated on loopback, with SQLite metadata and artifact files in a local workspace. The React/Tauri app, CLI, and MCP adapter all use the engine API. Tauri packages the Node executable and manages its lifecycle rather than requiring a global runtime on the destination machine.

## Alternatives

- Separate native/CLI/MCP runners would duplicate test semantics and require parity maintenance.
- A hosted execution service would need remote project access, authentication/authorization, and a different privacy/operations model before the local workflow is established.

## Consequences

One implementation determines outcomes and evidence. A workspace needs a single owning engine, connection metadata must remain private, and clients must target the correct workspace. Bundling Node adds runtime size and license requirements. Loopback authentication does not make trusted project commands a sandbox, and hosted clients still need a separately supported connection strategy.
