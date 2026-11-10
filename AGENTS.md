# Working on Testrill

Read README.md, CONTRIBUTING.md, DESIGN.md, and docs/architecture.md before changing the workbench or execution contract. docs/README.md indexes the rest of the documentation; docs/decisions/ records major architectural choices.

Run `npm test`, `npm run build`, and `npm run test:e2e` for engine/workbench changes. Run `npm run docs:check` and `npm run format:check` before committing. Documentation-only changes need documentation/format checks; report other checks as not run. For native changes, prepare resources, run `cargo check --locked` in src-tauri, and exercise the packaged app on the affected platform.

Preserve one execution engine for UI, CLI, and MCP. Do not duplicate assertion semantics in an agent adapter. Do not report a final status until artifacts have been finalized. A captured image is not proof that assertions passed. Keep blocked/cancelled/interrupted distinct from failed assertions.

Use the bundled example for public screenshots. Never commit workspace state, connection credentials, real application traces, installed dependencies, or generated native runtime resources.

Keep roadmap capabilities out of navigation and agent capability claims until implemented. Consult .agents/skills/testrill/SKILL.md when using this app to test a consuming project. Read brand/brand.md before changing product identity. Legacy identifiers listed in docs/branding-upgrade.md preserve workspace and test compatibility.

Use focused branches and the pull request template for remote contributions. Do not merge, publish a release, enable auto-merge, or change repository settings merely because code has been prepared; follow the user's actual task authorization. Never fabricate passing tests, platform/device support, or review approval. Update the changelog and relevant decision records when observable contracts change.
