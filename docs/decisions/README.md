# Architecture decisions

Record significant choices here so contributors do not have to reconstruct the reasoning from code or repeat the same design discussion.

| Record                              | Status   | Decision                                                                                             |
| ----------------------------------- | -------- | ---------------------------------------------------------------------------------------------------- |
| [0001](0001-shared-local-engine.md) | Accepted | One local execution engine behind desktop, CLI, and MCP                                              |
| [0002](0002-evidence-and-replay.md) | Accepted | Final outcomes follow evidence finalization; replay preserves configuration, not target-system state |

Use the next four-digit sequence and a descriptive filename. Include Status, Context, Decision, Alternatives, and Consequences. For a changed decision, add a new record that supersedes the previous one rather than deleting its history. A proposal's status should not say Accepted before a maintainer has agreed to it.
