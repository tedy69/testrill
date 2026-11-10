# Testrill design direction

The workbench uses compact layouts, warm light surfaces, graphite text, and restrained teal controls. The product name is Testrill. The identity uses a T-shaped test path ending at a square checkpoint. See brand/brand.md for assets, palette, typography, and usage.

Identity: a practical instrument for investigating software behavior. A quiet workspace that gives detailed evidence room to breathe.

The sidebar selects projects. The main view selects suites, scenarios, run history, or configuration. The primary action runs a suite. A run view pairs a chronological ledger with selected evidence. Agent connection is a real configuration view.

Warm off-white distinguishes the canvas from white editing surfaces. Graphite provides readable contrast. Teal marks primary actions and active navigation; success, warning, and failure always have text labels. Self-hosted Figtree connects the workbench to the wordmark; monospace appears only in code, durations, paths, and payloads. Small radii and restrained rules organize dense content without making every item a card.

ENERGY 2 / RHYTHM 2 / MOTION 1. Motion only communicates progress. Respect reduced motion. Desktop uses persistent navigation and split details; smaller windows stack panels and expose compact navigation. Controls remain keyboard operable with visible focus. Include empty, loading, disconnected, invalid-config, and failed-run states.

No invented run history, static success claims, decorative terminal, gradients, or marketing sections. Bundled sample suites are labeled examples and generate real results when executed.

## Reference-led workbench revision

The reference-led revision draws on Jiro, Design Spells, Refero, Supahero, Mobbin, and Style UI, with the existing colors preserved. See [the reference review and design contract](docs/ui-reference-review.md). Every original color token remains unchanged.

The suite library and execution inspector are separate reading surfaces. Search and result filters operate on real local data. Explicit step labels make assertions understandable without memorizing the manifest API. Evidence starts with recorded step completion, elapsed time, and artifact count, then leads into Radix's unstyled keyboard-accessible tabs. Desktop navigation is compact; the mobile drawer supports Escape, focus containment, and outside dismissal. Functional selection transitions last at most 160ms and are disabled for reduced motion.

`ui/styles.css` supplies shared controls and states; `ui/workbench.css` supplies the reference-led composition and responsive presentation. All colors come from the established token file. Figtree is bundled locally under public/fonts with its OFL license; no remote font service is contacted.
