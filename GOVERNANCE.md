# Project governance

Testrill is maintained by [Mochammad Tedy Fazrin (@tedy69)](https://github.com/tedy69). The maintainer is responsible for direction, reviews, releases, repository settings, and moderation. There is no separate technical steering committee or promised review schedule.

## Decisions and contributions

Use issues for reproducible bugs and scoped proposals. Use Discussions for usage questions and early design conversations. Significant decisions affecting the manifest, persistence, adapter boundaries, or agent interfaces should be recorded in [architecture decision records](docs/decisions/README.md).

Contributors work on branches and submit pull requests to `main`. Prefer a complete, reviewable workflow over a large collection of partial features. Maintainers decide whether a change fits the product's scope and may ask for a smaller proposal, additional evidence, or a compatibility plan.

## Review and merge

The [CODEOWNERS file](.github/CODEOWNERS) routes changes to the maintainer. Main-branch protection requires the Verify checks, a pull request, and resolved review conversations, and prevents force pushes and branch deletion. Merge with squash and delete the merged branch.

The repository currently has one maintainer, so branch protection does not require a second person's approval on the maintainer's own PRs. External contributions are still expected to receive maintainer review. Additional required approvals can be introduced when another maintainer is appointed. A passing CI run alone does not establish that a change fits the project.

## Releases and ownership

Only a maintainer publishes version tags and releases. Follow the [release guide](docs/releasing.md). There is no automatic release or auto-merge process. The current preview should not be treated as a stable plugin API or a production support contract.

Maintainer access may be expanded after sustained, constructive contributions and an explicit discussion with the existing maintainer. Update this file and CODEOWNERS when responsibility changes. Follow the [code of conduct](CODE_OF_CONDUCT.md) when discussing decisions or disagreements.
