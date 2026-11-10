# Security policy

## Supported scope

Testrill is an early preview. Security fixes target the latest `main` branch; older snapshots and downstream modifications are not maintained separately. Reports and fixes are handled on a best-effort basis without a response-time guarantee.

## Report a vulnerability

Use [GitHub private vulnerability reporting](https://github.com/tedy69/testrill/security/advisories/new). Include the affected commit/version and platform, a minimal reproduction using synthetic data, the expected boundary, and the observed impact. Do not put an unpatched vulnerability, credentials, personal data, or real application traces in a public issue.

If you need an initial contact before sharing details, open a public issue that only requests a private security contact. Do not describe the exploit there. Maintainers will coordinate a fix and public advisory when appropriate.

## Trust boundaries

- The engine is a local single-user tool using loopback and a bearer token. It is not a hosted multi-tenant service. Do not expose the raw engine publicly.
- Imported manifests are trusted configuration. Environment and test commands execute with the current user's permissions; the command adapter is not a sandbox.
- Browser execution can contact the application's dependencies. Declared inline URL restrictions do not make the whole browser a network sandbox.
- Saved step values, screenshots, browser traces, runner output, and evidence bundles can contain application data. Review them before sharing; only selected network URL fields are automatically redacted.
- Keep workspace state and `connection.json` private. Prefer synthetic fixtures when testing a report, and use a separate workspace.

See [architecture](docs/architecture.md) for execution limits and persistence boundaries. Ordinary setup failures and feature requests belong in the [issue forms](https://github.com/tedy69/testrill/issues/new/choose), not in a vulnerability report.

## GLib iterator backport

The Linux native dependency tree requires GLib's 0.18 line, which is affected by [GHSA-wrw7-89jp-8q8g](https://github.com/advisories/GHSA-wrw7-89jp-8q8g). Testrill now applies the upstream iterator fix to a vendored copy of `glib 0.18.5` through Cargo's `[patch.crates-io]`. The local copy retains its original version and license; it is not an upstream 0.20 release.

The unpatched source crashes in the optimized regression test; the backport passes all six cases covering the affected iterator methods. CI verifies the vendored source hashes and patch resolution, runs the optimized regression on Linux, and checks the Linux native application. See the [backport review](docs/security/glib-backport.md) for provenance, verification, and removal conditions. Linux GUI behavior and binary packaging remain unverified.

No advisory is ignored or manually dismissed. Registry-based scanners may stop reporting GLib because Cargo now selects a path dependency; that alone does not prove a fix. Source review and the optimized regression provide that evidence. The latest RustSec audit still reports `proc-macro-error 1.0.4` as unmaintained (RUSTSEC-2024-0370); this separate upstream finding remains outstanding. See the [dependency review](docs/dependency-review.md).
