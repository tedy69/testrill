# Maintainer release guide

Creating a repository or pushing `main` does not publish a desktop release. There is no automatic release workflow. A maintainer chooses the version and supported platforms after reviewing validation evidence.

## Prepare the source

1. Start from an up-to-date, clean `main` with passing Verify checks.
2. Review the changelog, migration notes, known limits, dependency updates, and any security reports.
3. Keep the version aligned in package.json/package-lock.json, Cargo.toml/Cargo.lock, tauri.conf.json, the CLI help/footer, and engine/MCP version fields. Use a change appropriate to the compatibility impact; preview contracts may still evolve.
4. Run formatting, documentation validation, engine tests, build, browser/agent integration tests, and the relevant native checks. Recheck the generated schema and examples when their contract changed.
5. Open and merge a release-preparation PR through the normal review/check workflow.

Record commands and platforms actually tested. Do not convert an unverified platform into a release claim because a shared code path compiled elsewhere.

## Build and inspect desktop artifacts

Build from the intended commit using the official Node distribution and the platform's Tauri prerequisites. The Node license must be included; browsers and external runners are installed separately. Check launch, engine readiness, suite execution, saved rerun, cancellation, export, agent configuration, and graceful shutdown on each platform being shipped.

Public macOS distribution requires an appropriate signing/notarization process. Local ad hoc signing is not Apple notarization. Keep signing credentials outside Git and use the [Tauri distribution guidance](https://v2.tauri.app/distribute/). Windows and Linux packaging need their own platform-specific validation. Do not upload local workspaces, connection files, private traces, or generated runtime folders as source artifacts.

## Tag and publish

After the release-preparation PR merges, a maintainer creates an annotated `vMAJOR.MINOR.PATCH` tag at the verified commit and publishes release notes that match the changelog. Attach only the inspected artifacts for platforms actually supported, with SHA-256 checksums and installation requirements. Distinguish a source preview from a signed installable release.

If an artifact is broken, document the problem and publish a corrected version. Do not move an already published version tag or silently replace its meaning. Preserve the previous source and user workspace data; the app currently has no automatic database migration rollback or retention system.
