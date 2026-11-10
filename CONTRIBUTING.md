# Contributing

Testrill accepts bug fixes, documentation, test coverage, accessibility improvements, and runner integrations. Check [existing issues](https://github.com/tedy69/testrill/issues) and the [roadmap](docs/roadmap.md) first. For a new adapter, schema change, or major workflow, open a feature request or Discussion before implementing it so persistence and evidence semantics stay compatible.

## Set up a contribution

Fork the repository, then create a short-lived branch from the current main branch:

```sh
git clone https://github.com/YOUR_USERNAME/testrill.git
cd testrill
git remote add upstream https://github.com/tedy69/testrill.git
git switch -c feature/short-description
npm ci
npm run browsers:install
npm run dev
```

Use Node 22.13 or newer; `.nvmrc` selects Node 22. See the [development guide](docs/development.md) for the source map and native prerequisites. A model API key is not needed to contribute or run the bundled tests.

## Validate the change

Before submitting a change:

```sh
npm run format:check
npm run docs:check
npm test
npm run build
npm run test:e2e
```

For native changes, run `npm run desktop:prepare`, then `cargo check --locked` in `src-tauri/`, and exercise the packaged app on the affected platform. Documentation-only changes need `docs:check` and formatting; say clearly which other checks were not run. Do not claim device or platform coverage from a compile check.

Keep package-lock.json and Cargo.lock committed. Manifest changes need validation and lifecycle coverage and an updated generated schema (`npm run schema`). Preserve the distinction between passing assertions and captured evidence. A new control needs working loading, empty, error, disabled, and keyboard states. Follow [DESIGN.md](DESIGN.md) for workbench changes.

Do not commit `.testrill/`, legacy `.rehearsal/` workspaces, credentials, raw test data from a real application, installed dependencies, generated runtime resources, or native build outputs. Use the bundled example for screenshots.

## Open a pull request

Keep one problem or workflow per PR. Use a short commit subject such as `fix: preserve cancelled run evidence` or `docs: explain native runner paths`. Separate unrelated formatting and refactors. Push your branch to your fork and open a PR against `tedy69/testrill:main` using the supplied template.

Describe the problem and resulting behavior, link the relevant issue when there is one, and list checks actually run. UI changes should include real bundled-example screenshots at desktop and narrow widths. Runner changes should include assertions and artifact behavior. Explain compatibility changes and update the changelog when behavior changes. Do not include private target applications, connection tokens, raw traces from other people's systems, or generated runtime resources.

CI must pass and review conversations must be resolved before merge. A maintainer reviews contributions; see [governance](GOVERNANCE.md) for ownership and merge policy. Small focused PRs are easier to review. There is no guaranteed review turnaround.

Contributors are responsible for the changes they submit, including changes prepared with a coding agent. Inspect the diff, run the relevant checks, and report limitations honestly. Contributions use the repository's MIT license; keep notices and licenses for third-party assets.

For usage help, see [SUPPORT.md](SUPPORT.md). Report vulnerabilities through [SECURITY.md](SECURITY.md), rather than a public issue.
