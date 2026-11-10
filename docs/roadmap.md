# Roadmap

## Implemented foundation

Desktop workbench, shared loopback engine, CLI, stdio/HTTP MCP, validated manifests, inline browser/API suites, existing-command and Maestro adapters, run-scoped HTTP/SSE scenarios, checkpoints, evidence capture/export, SQLite history, result comparison, and saved configuration replay.

## Next: repeatable application state

- Explicit fixture providers with ownership and reset contracts.
- Seed, snapshot, and restore isolated test databases.
- Content hashes for scenario/test definitions and application build identifiers.
- Streaming edge-case fixtures and WebSocket scenario execution.
- Evidence integrity checks and configurable retention.

## Next: deeper targets

- Device discovery and a mobile evidence inspector around existing runner adapters.
- Platform-specific desktop automation adapters with capability discovery.
- Structured assertion normalization for external runners.
- Versioned runner/fixture plugin interfaces and a capability compatibility matrix.

## Next: collaboration and CI

- Import evidence bundles into a separate workbench.
- Screenshot comparison with reviewed baselines.
- Team workspaces with proper authentication, access control, and secret handling.
- An authenticated remote agent gateway, with client-specific compatibility tests.

These are planned capabilities, not controls displayed as working features in the application.
