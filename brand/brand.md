# Testrill

Testrill combines **test + drill**: repeat a controlled test, inspect what happened, and run it again after a fix. Pronounce it **TEST-rill**. Write Testrill in prose and `testrill` in package names and configuration. Do not shorten it to TR or split it into Test Rill.

The user selected this name on 10 November 2026 after comparing Testrill, Casehelm, and Caseweft. Rehearsal was a temporary name about practising failure before users experience it. It was retired because existing developer tools already use that identity, including [Rehearsal Labs' testing tools for engineers and coding agents](https://github.com/rehearsal-labs/retest).

## Product promise

**The testing workbench for people and agents.**

Run configured suites against controlled scenarios and inspect recorded assertions and evidence through one desktop, CLI, and MCP engine. The audience is developers and coding agents testing applications. Describe implemented adapters and assertion behavior precisely. A screenshot by itself does not prove a test passed.

Supporting line: **Repeat the test. Inspect the evidence.**

## Visual direction

Reading this as a desktop developer instrument and public repository identity, with warm practical surfaces and restrained teal, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

| Decision                                        | Purpose                                                                                                                        |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| T-shaped path with a separate square checkpoint | Links the initial to an observable point in a test run; the silhouette works without a wordmark.                               |
| Deep teal `#246B59`                             | Carries the mark and primary controls without filling the whole workspace with accent color.                                   |
| Graphite `#27352F`                              | Makes dense evidence readable and distinguishes the checkpoint from the path.                                                  |
| Warm canvas `#F6F5F0`, white `#FFFFFF`          | Separates the workspace from editing surfaces while keeping the approved warm light character.                                 |
| Figtree SemiBold wordmark                       | Open humanist lettering gives the technical instrument a warm, clear voice. Logos use outlined paths for consistent rendering. |
| System sans-serif in the application            | Uses familiar native text and avoids loading a logo font throughout dense evidence views.                                      |
| Generous clear space in brand artwork           | Gives the mark a recognizable silhouette; workbench spacing stays compact for investigation.                                   |
| Motion limited to functional feedback           | Progress and state changes remain the focus; the identity itself is static.                                                    |

Use normal graphite or teal text on white or warm canvas. Use white text on deep teal. The measured contrast pairs are recorded in `contrast.json`; all approved text pairs exceed 4.5:1. Status colors remain semantic application tokens and always accompany text labels.

## Logo and assets

`logo.svg` is the primary horizontal lockup. `wordmark.svg` contains the lettering alone. `symbol.svg` is the two-color mark; `symbol-mono.svg` and `symbol-white.svg` are for single-color contexts. `logo-mono.svg` and `logo-white.svg` provide matching lockups. SVG wordmarks contain paths, so they do not depend on a locally installed font.

Keep clear space equal to the stem width around the symbol, or half the symbol height around a lockup. Use the symbol below 120px of lockup width. The symbol may be used at 16px; prefer 24px and above when space permits. Never stretch, rotate, add effects, close the checkpoint gap, recolor individual parts arbitrarily, or place the teal mark on a dark background. Use the white variant there.

`app-icon.png` is the 1024px transparent macOS artwork. Its rounded tile is part of the artwork; other desktop icon formats are generated under `src-tauri/icons/`. `favicon.svg` and `favicon.png` provide the browser identity. `social.png` and `social.svg` are 1200 by 630 repository/social artwork. `brand-preview.png` shows the system together. These are real identity assets, not product screenshots.

The first exploration used the built-in image generation tool. Final production assets were redrawn as deterministic SVG geometry and outlined Figtree text; the generated bitmap is not embedded in the app. The prompt is recorded in `concept-prompt.txt`. Figtree's font and SIL Open Font License are in `fonts/`. Font source: [Figtree](https://github.com/erikdkennedy/figtree). Logo and artwork files follow this repository's MIT license; no domain, handle, or trademark registration is implied.

## Voice

**Clear:** name the action and result. **Precise:** distinguish assertions, evidence, and runner outcomes. **Calm:** explain a failure and the next useful step without drama.

| Use                                      | Avoid                                                |
| ---------------------------------------- | ---------------------------------------------------- |
| Run suite                                | Generic invitations to get started                   |
| Inspect the failed assertion             | Vague promises of insights                           |
| Screenshot captured                      | Claiming a screenshot proves success                 |
| The engine stopped. Restart Testrill.    | Unexplained error codes or dramatic failure language |
| Connect the coding agent you already use | Claims that every hosted agent client is supported   |

Common interface strings: Run suite; Run history; Agent connection; Import project; Save configuration; Release checkpoint; Cancel run; Rerun saved configuration; No runs yet. Run a suite to record evidence.; The local engine is starting.

## Research and compatibility

See `naming-comparison.md` for the shortlist and the dated screening record. Web/GitHub/npm screening is preliminary. Domain, store, handle, and trademark searches are still to run. The chosen name is a product decision, not a statement of legal clearance or availability.

Legacy internal identifiers intentionally retained for existing users are documented in [upgrade compatibility](../docs/branding-upgrade.md).
