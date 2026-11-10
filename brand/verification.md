# Testrill identity verification

Verified locally on 10 November 2026, macOS Apple silicon.

- PASS: all ten engine tests and both browser/MCP integration tests completed. Coverage includes legacy SQLite persistence, new and previous checkpoint routes, and environment aliases.
- PASS: TypeScript/Vite/engine build, macOS release bundle, `cargo check --locked`, formatting, and whitespace checks completed.
- PASS: the installed `/Applications/Testrill.app` passed strict deep ad hoc signature verification. This is local signing; Apple notarization and other-machine distribution remain unverified.
- PASS: native launch showed Testrill in the window, page title, sidebar logo, footer, and agent configuration. Both registered projects and the three prior runs remained. A new Health contract passed, bringing the visible history to four runs.
- PASS: native MCP configuration names the `testrill` server and points at the executable and engine inside Testrill.app, using the existing workspace.
- PASS: seven intended text/background pairs exceed 4.5:1; see `contrast.json` for measured ratios. Teal on warm canvas is 5.79:1, graphite on warm canvas is 11.76:1.
- PASS: the production lockup and app icon were rendered from SVG and visually inspected, including the genuine updated workbench screenshots. Logo lettering is outlined; Figtree attribution and license are bundled.
- PASS: the source identity sweep found no unexplained legacy-name matches. The 35 matches in 22 source/documentation files are compatibility identifiers, tests of those identifiers, ignore rules, and naming/upgrade history. The unfiltered sweep is intentionally not empty. Generated build trees, local state, and hook logs are excluded from the source review.

## Antislop delivery gate

This gate applies to the identity assets and the changed workbench. Unchanged interaction behavior was exercised by the full existing integration flow. It does not claim a complete manual screen-reader audit.

| Item                    | Result and evidence                                                                                                                                                     |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-02 punctuation        | PASS: new product copy contains no em dash.                                                                                                                             |
| R-03 responsive layout  | PASS: integration checks at 320, 768, 1024, and 1440px found no overflow in the agent view; mobile navigation opened and closed.                                        |
| R-17 statistics         | PASS: no adoption or performance statistics were added to identity artwork.                                                                                             |
| R-18 testimonials       | PASS: no testimonials or fictional people were added.                                                                                                                   |
| R-23 authorization      | PASS: the user requested logo/branding, chose Testrill, and had approved warm light, graphite, and teal.                                                                |
| R-24 navigation         | PASS: branding adds no navigation destinations; existing workbench navigation was exercised.                                                                            |
| R-25 contrast           | PASS: seven intended text pairs pass AA; tested run state has zero axe violations.                                                                                      |
| R-26 behavior           | PASS: the logo is a noninteractive image; the existing controls passed the integration flow.                                                                            |
| R-27 states             | PASS: loading, disconnected, validation, empty, and failure states remain implemented; invalid configuration and failed-run flows were tested.                          |
| R-28 FAQ                | PASS: no FAQ was added.                                                                                                                                                 |
| R-32 keyboard           | PASS: native controls and visible focus remain; Escape closes the import dialog in the integration test.                                                                |
| R-33 source edits       | PASS: application JSX and CSS changes were made with apply_patch. Asset generation renders authored vector geometry.                                                    |
| R-34 theme              | PASS: the approved fixed warm light theme remains; no nonfunctional theme toggle was added. White logo variants support dark external artwork.                          |
| R-35 execution          | PASS: the app was built, browser controls exercised, and the installed native app launched and ran a test.                                                              |
| R-36 claims             | PASS: copy describes configured assertions and recorded evidence; no fabricated security or customer claims.                                                            |
| R-37 direction          | PASS: brand.md records the approved direction and explicit 2/2/1 dials.                                                                                                 |
| R-38 content            | PASS: screenshots show real bundled-example executions; brand artwork presents identity rather than fabricated application results.                                     |
| R-39 controls and media | PASS: logo has an accessible name and explicit dimensions; integration checks report zero page errors and zero axe violations in the tested state. No motion was added. |
| R-40 loading            | PASS: the sidebar image reserves 176 by 48px and loads locally; no third-party scripts or claimed performance scores were added.                                        |
| R-01 gradients          | PASS: production artwork uses solid fills.                                                                                                                              |
| R-04 icon relevance     | PASS: the initial/path/checkpoint symbol has its product connection recorded in brand.md.                                                                               |
| R-06 typography         | PASS: Figtree's warm humanist wordmark and native UI font roles are explained in brand.md.                                                                              |
| R-07 background motif   | PASS: no background grid or dot pattern.                                                                                                                                |
| R-08 arrows             | PASS: no decorative arrows were added.                                                                                                                                  |
| R-09 badges             | PASS: no decorative badges or invented status claims were added.                                                                                                        |
| R-10 glass              | PASS: no glass effects.                                                                                                                                                 |
| R-12 shadows            | PASS: flat identity artwork has no shadows.                                                                                                                             |
| R-13 glow               | PASS: no glow.                                                                                                                                                          |
| R-14 cards              | PASS: no feature-card layout was added.                                                                                                                                 |
| R-19 animation          | PASS: static identity, no new animation.                                                                                                                                |
| R-22 illustration       | PASS: original product-specific geometry replaces the text placeholder; no generic stock illustration.                                                                  |
| Liveliness dials        | PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 are declared and reflected in the static artwork.                                                                                  |
| Liveliness focal point  | PASS: each brand image centers the primary lockup; supporting symbol applications are smaller.                                                                          |
| Liveliness whitespace   | PASS: clear space separates lockup, supporting line, and applications in the inspected preview.                                                                         |
| Liveliness accent       | PASS: teal carries the path and primary controls; graphite carries text and checkpoint.                                                                                 |
| Liveliness motif        | PASS: the same path and square checkpoint repeat in symbol, lockup, icon, favicon, and social artwork.                                                                  |
| Liveliness Design Read  | PASS: direction and dials were declared before image generation and recorded in brand.md.                                                                               |
| C-1 intentionality      | PASS: a decision/purpose table records the visual choices.                                                                                                              |
| C-2 completeness        | PASS: no new dead controls; the full workbench integration flow passed.                                                                                                 |
| C-3 composition         | PASS: identity artwork contains only a lockup, product-specific supporting copy, and actual brand applications.                                                         |
| C-4 resilience          | PASS: outlined lettering removes font dependencies; responsive and accessibility integration checks passed.                                                             |
| C-5 evidence            | PASS: checks are recorded as performed; domain/handle/trademark checks are explicitly pending.                                                                          |
| R-05 layout             | PASS: no template landing page or marketing-card sequence was added.                                                                                                    |
| R-11 radii              | PASS: rounded symbol corners improve small-size silhouette; application radius roles are unchanged.                                                                     |
| R-15 action copy        | PASS: Run suite, Import project, and Inspect results retain concrete actions.                                                                                           |
| R-16 language           | PASS: copy names testing and evidence without generic AI marketing claims.                                                                                              |
| R-20 identity           | PASS: the approved warm instrument palette, path/checkpoint motif, and evidence-led workbench are consistently applied.                                                 |
| R-21 theme choice       | PASS: warm light was explicitly chosen by the user.                                                                                                                     |
| R-29 palette            | PASS: teal plus warm, graphite, and white neutrals; application statuses retain semantic roles.                                                                         |
| R-30 originality        | PASS: no third-party logo or UI reference was used as a template; the concept follows the product's own initial/path/checkpoint brief.                                  |
| R-31 written reasons    | PASS: brand.md explains color, typography, geometry, clear space, and motion.                                                                                           |
