# Documentation

Testrill is an early-preview local testing workbench. Start with the root [README](../README.md) to run the bundled example.

| Task                                              | Guide                                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| Set up a checkout and understand the source       | [Development](development.md)                                                                                                          |
| Register suites, scenarios, or an external runner | [Project manifests](manifests.md) and [JSON schema](../schemas/project.schema.json)                                                    |
| Connect a coding agent                            | [Agent integration](agents.md) and [testing skill](../.agents/skills/testrill/SKILL.md)                                                |
| Integrate with the local engine                   | [HTTP API](api.md)                                                                                                                     |
| Understand execution, persistence, and limits     | [Architecture](architecture.md)                                                                                                        |
| Understand major technical choices                | [Architecture decisions](decisions/README.md)                                                                                          |
| Diagnose setup or execution problems              | [Troubleshooting](troubleshooting.md)                                                                                                  |
| Review what has actually been tested              | [Verification](verification.md) and [workbench verification](ui-redesign-verification.md)                                              |
| Review product direction                          | [Roadmap](roadmap.md) and [changelog](../CHANGELOG.md)                                                                                 |
| Change the workbench design                       | [Design contract](../DESIGN.md), [reference review](ui-reference-review.md), and [palette comparison](ui-palette-check.json)           |
| Use product identity assets                       | [Brand guide](../brand/brand.md), [name comparison](../brand/naming-comparison.md), and [brand verification](../brand/verification.md) |
| Continue a workspace from the temporary name      | [Upgrade compatibility](branding-upgrade.md)                                                                                           |
| Prepare a source or desktop release               | [Release guide](releasing.md)                                                                                                          |

For project collaboration, read [Contributing](../CONTRIBUTING.md), [Governance](../GOVERNANCE.md), [Code of conduct](../CODE_OF_CONDUCT.md), [Support](../SUPPORT.md), and [Security](../SECURITY.md). Coding agents contributing to this repository should follow [AGENTS.md](../AGENTS.md).

`npm run docs:check` validates local Markdown links/anchors, required collaboration files, and GitHub configuration. `npm run format:check` checks formatting. Verification records describe a tested snapshot; they are not a guarantee about every platform or future commit.
