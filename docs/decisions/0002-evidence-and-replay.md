# ADR-0002: Finalize evidence before reporting an outcome

## Status

Accepted. Records the implemented run lifecycle.

## Context

An agent or user may inspect or export a run immediately after seeing a terminal status. If the outcome is saved before artifacts finish, a passing run can appear to have missing evidence. Reruns also need a clear definition of what is preserved.

## Decision

Persist the final run outcome only after artifact finalization. Save the suite, selected scenario, and target URL with the run and use that configuration for saved reruns. Preserve distinct passed, failed, blocked, cancelled, and interrupted outcomes. Screenshots remain evidence of appearance rather than independent passing assertions.

## Alternatives

- Saving a final status before artifacts complete would make consumers wait on an additional undocumented condition.
- Reusing the current project definition for a saved rerun could silently change the assertions being compared.
- Capturing the whole target environment would provide stronger replay but requires database, process, and dependency ownership contracts that are not yet implemented.

## Consequences

A terminal run can be inspected/exported without guessing whether its artifacts are still saving. Replay preserves the test definition but does not snapshot the application's binary, database, or external services. Outcome/duration comparisons should not be presented as deterministic full-system replay or a performance trend.
