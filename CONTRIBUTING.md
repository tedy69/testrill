# Contributing

Use Node 22.13 or newer. Install with `npm ci`, then install Chromium with `npm run browsers:install`.

Before submitting a change:

```sh
npm run format:check
npm test
npm run build
npm run test:e2e
```

For native changes, also run `cargo check` in `src-tauri/`. Keep package-lock.json and Cargo.lock committed. Changes to the manifest contract should include validation and lifecycle tests. Preserve the distinction between passing assertions and captured evidence. A new control needs working loading, empty, error, disabled, and keyboard states.

Do not commit `.rehearsal/`, credentials, raw test data from a real application, installed dependencies, generated runtime resources, or native build outputs. Use the bundled example for screenshots.

Prefer changes that complete a user workflow. Discuss major schema or adapter changes before implementation so stored manifests and runs remain compatible. Include reproduction steps, relevant evidence, and commands actually run in pull requests.
