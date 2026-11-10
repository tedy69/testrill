# Working on Testrill

Read README.md, DESIGN.md, and docs/architecture.md before changing the workbench or execution contract.

Run `npm test`, `npm run build`, and `npm run test:e2e` for engine/workbench changes. Use `npm run format:check` before committing. For native changes, run `cargo check` in src-tauri and exercise the packaged app on the affected platform.

Preserve one execution engine for UI, CLI, and MCP. Do not duplicate assertion semantics in an agent adapter. Do not report a final status until artifacts have been finalized. A captured image is not proof that assertions passed. Keep blocked/cancelled/interrupted distinct from failed assertions.

Use the bundled example for public screenshots. Never commit workspace state, connection credentials, real application traces, installed dependencies, or generated native runtime resources.

Keep roadmap capabilities out of navigation and agent capability claims until implemented. Consult .agents/skills/testrill/SKILL.md when using this app to test a consuming project. Read brand/brand.md before changing product identity. Legacy identifiers listed in docs/branding-upgrade.md preserve workspace and test compatibility.
