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
