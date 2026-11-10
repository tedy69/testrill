# Workbench redesign verification

Verified locally on 10 November 2026, macOS Apple silicon. This record covers the reference-led workbench revision and the installed app.

## Result

- The layout now separates a searchable suite library from its execution inspector. History has working search and result filtering. Step labels describe the action or assertion. Evidence starts with recorded completion, elapsed time, and artifact count.
- Figtree is self-hosted with its OFL license. Radix Tabs supplies unstyled tab/tabpanel semantics and keyboard navigation. The mobile drawer supports Escape, outside dismissal, focus containment, and focus return.
- All **19 existing color tokens** match the preceding branding revision, commit `38950d5`. The new stylesheet contains no hard-coded color values. See [the palette comparison](ui-palette-check.json).
- The six supplied reference sites were reviewed. The [reference review](ui-reference-review.md) records what informed the implementation and which account-only functionality was not used. No reference assets or proprietary component source were copied.

## Checks performed

| Check                      | Observed result                                                                                                                                                                                                      |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm test`                 | All ten engine/integration tests passed.                                                                                                                                                                             |
| `npm run build`            | TypeScript, Vite, and the shared engine bundle passed.                                                                                                                                                               |
| `npm run test:e2e`         | Both workbench and CLI/MCP integration tests passed.                                                                                                                                                                 |
| Suite search               | A matching query filtered the library; an unmatched query displayed the empty state; clearing restored the list.                                                                                                     |
| History search/filter      | Unmatched search displayed the empty state; selecting failed results showed failed runs; clearing restored the history.                                                                                              |
| Radix tabs                 | ArrowRight selected the next tab and exposed its associated panel in browser and native checks.                                                                                                                      |
| Editing and run lifecycle  | Scenario validation/save/addition, project save, agent config copy, comparison, checkpoints, rerun, cancellation, and import-dialog Escape passed.                                                                   |
| Responsive layouts         | Suite library, scenarios, configuration, history with comparison open, agent connection, and run evidence each had no document overflow at 320, 768, 1024, and 1440px. Tables retain their own horizontal scrolling. |
| Accessibility              | The tested run-evidence state had zero axe WCAG 2 A/AA and 2.1 AA violations; keyboard tab navigation and drawer Escape were exercised.                                                                              |
| Browser errors             | No uncaught page errors during the full interaction flow.                                                                                                                                                            |
| Motion                     | State transitions use 160ms; the reduced-motion media rule disables animations/transitions. Captured screenshots fast-forward transient animations.                                                                  |
| `npm audit --omit=dev`     | Zero reported vulnerabilities.                                                                                                                                                                                       |
| `npm run desktop:build`    | A macOS arm64 Tauri bundle built successfully.                                                                                                                                                                       |
| Installed signature        | `/Applications/Testrill.app` passed strict deep ad hoc signature verification.                                                                                                                                       |
| Native execution           | The connected app ran Health contract successfully: 1 of 1 steps, 55ms, one evidence file. Its history showed five runs, preserving the preceding four.                                                              |
| Native evidence navigation | Artifacts showed the real network file; Right selected Saved definition and exposed the stored suite/scenario.                                                                                                       |

The updated screenshots under `docs/screenshots/` are actual bundled-example executions. Browser tests operate in temporary workspaces and remove them after completion. The preceding installed app was retained as a recoverable local backup outside the repository.

## Antislop delivery gate

| Item                    | Result and evidence                                                                                                                                                   |
| ----------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R-02                    | PASS: new application copy has no em dash.                                                                                                                            |
| R-03                    | PASS: all six main views passed the four-width overflow checks.                                                                                                       |
| R-17                    | PASS: displayed result counts and metrics come from persisted runs; no invented adoption statistics.                                                                  |
| R-18                    | PASS: no testimonials or fictional identities.                                                                                                                        |
| R-23                    | PASS: the user requested this reference-led redesign and specified that colors remain unchanged.                                                                      |
| R-24                    | PASS: navigation uses existing functional views, not placeholder destinations.                                                                                        |
| R-25                    | PASS: original accessible palette retained; tested evidence state reports zero axe contrast violations.                                                               |
| R-26                    | PASS: search, filters, tabs, navigation, editing, and run controls were exercised; no decorative controls were added.                                                 |
| R-27                    | PASS: loading/disconnection, empty search, validation, saving, execution, success, and failure states remain implemented.                                             |
| R-28                    | PASS: no FAQ was introduced.                                                                                                                                          |
| R-32                    | PASS: native controls, focus outlines, tab arrows, and drawer Escape/focus containment are implemented and checked.                                                   |
| R-33                    | PASS: JSX and CSS changes were authored with apply_patch.                                                                                                             |
| R-34                    | PASS: the user-approved light theme remains; no nonfunctional theme switch.                                                                                           |
| R-35                    | PASS: production and native builds, browser interaction checks, and installed-app execution completed.                                                                |
| R-36                    | PASS: no fabricated security, performance, compatibility, or customer claims.                                                                                         |
| R-37                    | PASS: the Design Read and 2/2/1 dials were recorded before implementation.                                                                                            |
| R-38                    | PASS: real suites, configurations, results, and captured evidence supply the UI content.                                                                              |
| R-39                    | PASS: native labeled controls retain hover/active/disabled states; logo dimensions/alt are explicit; reduced motion is honored; tested state has zero axe violations. |
| R-40                    | PASS: the logo reserves its dimensions; the local font is preloaded; no third-party scripts or invented performance scores.                                           |
| R-01                    | PASS: no new gradient or glow.                                                                                                                                        |
| R-04                    | PASS: existing Phosphor icons identify testing, navigation, execution, and evidence actions.                                                                          |
| R-06                    | PASS: Figtree links the application to its wordmark; monospace is limited to technical values. Reasons are in DESIGN.md.                                              |
| R-07                    | PASS: no decorative background grid. The step connector communicates ordered execution.                                                                               |
| R-08                    | PASS: arrows remain directional inspection/back controls rather than decoration on every button.                                                                      |
| R-09                    | PASS: result indicators represent actual execution states; no promotional badges.                                                                                     |
| R-10                    | PASS: no glass effects.                                                                                                                                               |
| R-12                    | PASS: reading panels use borders; no shadow-heavy card system.                                                                                                        |
| R-13                    | PASS: no glow.                                                                                                                                                        |
| R-14                    | PASS: real suite rows replace stacked generic cards.                                                                                                                  |
| R-19                    | PASS: brief state transitions only; reduced motion disables them.                                                                                                     |
| R-22                    | PASS: no generic illustration or fake terminal decoration.                                                                                                            |
| Liveliness: dials       | PASS: ENERGY 2 / RHYTHM 2 / MOTION 1 remain explicit.                                                                                                                 |
| Liveliness: focal point | PASS: selected suite and its Run suite action lead the suite view; recorded outcome leads evidence.                                                                   |
| Liveliness: whitespace  | PASS: a 24px gap separates library and inspector; controls and steps use compact spacing.                                                                             |
| Liveliness: accent      | PASS: existing teal marks selection and primary actions.                                                                                                              |
| Liveliness: motif       | PASS: checkpoint-like step markers and the existing path/checkpoint brand connect the workflow.                                                                       |
| Liveliness: Design Read | PASS: the reference contract predates implementation.                                                                                                                 |
| C-1                     | PASS: the design contract explains hierarchy, typography, spacing, palette preservation, and motion.                                                                  |
| C-2                     | PASS: the complete interaction flow passed with no uncaught page errors.                                                                                              |
| C-3                     | PASS: every panel serves selection, configuration, execution, or investigation.                                                                                       |
| C-4                     | PASS: responsive checks cover six views; keyboard tabs and drawer dismissal work.                                                                                     |
| C-5                     | PASS: screenshots and metrics reflect executed tests, and verification limits are stated.                                                                             |
| R-05                    | PASS: content-driven workbench layout; no marketing-page template.                                                                                                    |
| R-11                    | PASS: small control radii, larger reading-panel radii, and square step geometry have distinct roles.                                                                  |
| R-15                    | PASS: actions name Run suite, Save scenario, Rerun saved, Inspect, and Export evidence.                                                                               |
| R-16                    | PASS: new copy describes testing actions without generic AI marketing language.                                                                                       |
| R-20                    | PASS: Figtree, warm instrument surfaces, ordered steps, and an evidence-first hierarchy support Testrill's identity.                                                  |
| R-21                    | PASS: warm light was explicitly selected and its colors were required to remain unchanged.                                                                            |
| R-29                    | PASS: all existing colors preserved; no imported library palette.                                                                                                     |
| R-30                    | PASS: public references informed hierarchy and feedback; no source branding, exact layout, or imagery was copied.                                                     |
| R-31                    | PASS: major decisions and their purpose are written in the reference contract and DESIGN.md.                                                                          |

Automated checks do not replace a full manual screen-reader audit. Windows/Linux builds, physical mobile execution, named vendor-client configuration, Apple notarization, and other-machine distribution remain outside this verification. Execution semantics and the previously documented roadmap limits are unchanged.
