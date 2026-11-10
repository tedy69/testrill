# Workbench reference review

Reviewed 10 November 2026. User constraint: redesign the workbench without changing its colors. Preserve the current logo and implemented execution semantics. A UI library is permitted.

## Sources reviewed

| Source                                                                                                 | Review and useful pattern                                                                                                          | Application to Testrill                                                                                                        |
| ------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| [Jiro](https://jiro.build/)                                                                            | Public library and MCP setup reviewed. Clear section hierarchy and distinct primary actions. MCP account access was not connected. | Make the current action and inspection context unmistakable. No paid template or proprietary component was copied.             |
| [Design Spells](https://designspells.com/spells/effort-selection-animations-in-chatgpt)                | Viewed the running effort-selection video and its changing selection states.                                                       | Brief selected-state and tab feedback; no decorative effects or perpetual motion.                                              |
| [Refero: Intercom](https://styles.refero.design/style/12255b63-e506-4bc1-a4cd-d05487de32f3)            | Reviewed its screenshot and interpreted typography/spacing guidance.                                                               | Strong heading/body separation, quiet surfaces, limited borders. Keep Testrill's colors and accessible font weights.           |
| [Refero: teenage engineering](https://styles.refero.design/style/aecf9dda-5cba-4dc7-9e73-59b65d895cdf) | Viewed the product screenshot and instrument-like visual hierarchy.                                                                | Make test definitions and evidence the dominant objects. Do not copy its ultra-light type or palette.                          |
| [Supahero](https://supahero.io/)                                                                       | Reviewed the hero gallery and its framing of primary content.                                                                      | Use a stronger page heading and intentional composition inside the app. A marketing hero is not needed in a working test tool. |
| [Mobbin](https://mobbin.com/)                                                                          | Reviewed the public catalog presentation and app/dashboard examples. Full authenticated flow browsing was not used.                | Separate persistent navigation, contextual tools, and detail content; make rows easier to scan.                                |
| [Style UI](https://style.ai.id/)                                                                       | Reviewed the directory and its listings for component and interaction libraries.                                                   | Use a small unstyled primitive for accessible evidence tabs; keep native form controls.                                        |

Refero describes interpreted design systems, not original product source. These references inform hierarchy, density, and feedback; their branding, colors, assets, and exact layouts are not copied.

## Design contract

Reading this as a desktop testing instrument for developers and coding agents, with warm editorial typography and precise controls, dial ENERGY 2 / RHYTHM 2 / MOTION 1.

- **Screen job:** choose a test definition, configure its scenario, run it, and inspect the recorded result.
- **Primary action:** Run suite in the selected suite inspector. Inspection actions are secondary.
- **Navigation:** compact project selector; a consistent navigation rail with the active location; engine status and agent connection remain available.
- **Suite view:** searchable list of real suite definitions, selected-row emphasis, explicit runner type, readable step labels, and an execution panel with target/scenario controls. A latest-run strip uses persisted results only.
- **Evidence:** a result header with completed steps, duration, and artifact count; accessible tabs; aligned event times; a distinct preview surface. Errors and waiting checkpoints remain prominent.
- **Other screens:** preserve scenario/configuration editing, real history comparison, import, agent configuration, and all existing controls.
- **Typography:** self-host Figtree for the app to connect the workbench to the wordmark. Monospace stays limited to code, paths, identifiers, and timings. Body/control text gets more readable sizing.
- **Color lock:** retain every existing token value. Reuse tokens for new surfaces and interaction states. No imported library color theme.
- **Spacing:** use a 4px base, compact navigation and rows, and more space around the selected content. Avoid equal padding around everything.
- **Motion:** 120–180ms state feedback; honor reduced motion. No page entrance choreography, decorative loaders, or moving backgrounds.
- **Responsive behavior:** persistent sidebar on desktop; a dismissible navigation drawer on small windows; split views stack before they become cramped. Long paths wrap, tables scroll inside their container.
- **Required states:** initial loading, disconnected engine, empty/filtered lists, invalid edits, saving, running, waiting at a checkpoint, cancellation, success, and failure.
- **Reject:** giant cards, fake terminal decoration, marketing sections, copied product chrome, changed brand colors, fabricated test history, and controls without behavior.

## Library choice

[Radix Tabs](https://www.radix-ui.com/primitives/docs/components/tabs) provides roving keyboard focus, tab-panel relationships, and arrow/Home/End navigation. Its unstyled primitives let Testrill retain its exact palette. Existing native selects, buttons, and the import dialog remain native controls.
