# Dependency review

Reviewed on 10 November 2026 against npm's `latest` tags, crates.io stable releases, and official Node.js release metadata. This is a dated snapshot; Dependabot checks npm, Cargo, and GitHub Actions daily. Stable releases are preferred over prereleases.

## Baseline

- Node.js 26.13.0 LTS, with `.nvmrc` selecting the maintained 26 line; npm 12.2.2.
- React and React DOM 19.3.1; Vite 8.3.7 and its React plugin 6.3.0; TypeScript 7.0.2; esbuild 0.28.2; Node types 26.6.6.
- Playwright and playwright-core 1.65.0; MCP SDK 1.32.2; Zod 4.6.7.
- Tauri JavaScript API and CLI 2.12.4; dialog plugin 2.8.4. Rust: tauri 2.12.5, tauri-build 2.7.4, tauri-plugin-dialog 2.8.4, serde_json 1.0.154.

All 25 direct npm packages resolve to their latest stable release. All four direct Rust dependencies are current. Lockfiles record the complete resolved graph. `cargo update` found no compatible lockfile changes. Transitive packages can remain on older release lines required by their parent; forcing a different major does not establish compatibility.

## Checks and reproduction

```sh
node --version
npm --version
npm ci
npm outdated
npm audit
npm test
npm run build
npm run test:e2e
npm run docs:check
npm run format:check
npm run desktop:prepare
cd src-tauri
cargo check --locked
cargo audit
```

The upgrade passed a clean npm install, with no outdated direct npm packages and zero npm audit vulnerabilities. All 10 engine/integration tests and both end-to-end tests passed, covering browser examples, failure evidence, saved reruns, responsive/accessibility checks, CLI, and MCP. Documentation, formatting, and workflow validation passed. The macOS arm64 native app built and passed `cargo check --locked`; the installed app uses Node 26.13.0 and completed the Health contract with one successful assertion and one artifact, preserving its previous six runs. Windows/Linux packaging remains unverified.

## Native security backport and remaining finding

The initial registry-only graph reported GLib iterator unsoundness and unmaintained `proc-macro-error`. GLib is now patched locally using the upstream fix. See the [backport review](security/glib-backport.md) for source provenance, the reproduced crash, optimized regression tests, and CI coverage.

`cargo-audit 0.22.2`, using RustSec database commit `28d73fc95e5972af3403225a217def57dcaba3c4` (10 November 2026), reports zero entries in its vulnerability list and one informational finding after the backport:

| Package                | Finding                                                                                  | Constraint                                                                    |
| ---------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| proc-macro-error 1.0.4 | [RUSTSEC-2024-0370](https://rustsec.org/advisories/RUSTSEC-2024-0370.html), unmaintained | Present through upstream native dependencies. Requires an upstream migration. |

A successful audit exit code does not clear the maintenance finding. Registry scanners do not establish the safety of a local path dependency, so CI independently verifies the vendored GLib hashes, its resolution, and optimized behavior. No advisory is ignored or manually dismissed. The [Tauri GTK4 migration proposal](https://github.com/tauri-apps/tauri/pull/15680) is closed without merging; it is not a released fix. See [SECURITY.md](../SECURITY.md) for distribution limits.

## Dependabot and review

Related React, Playwright, Tauri JavaScript, and Vite/toolchain packages are grouped so their versions are tested together. Cargo and GitHub Actions are checked daily too. All updates use pull requests and the required engine/UI, documentation, and native checks, including a full npm audit; there is no automatic merge or blanket script approval. An esbuild version change also needs a reviewed `allowScripts` pin update. The pinned checkout, setup-node, and upload-artifact actions also match their latest stable releases at review time.

Repeat registry and advisory checks during each upgrade. Update this record when a baseline or unresolved finding changes; do not describe the entire transitive graph as current merely because direct dependencies are current.
