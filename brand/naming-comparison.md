# Naming comparison

Decision date: 10 November 2026. User choice: **Testrill**.

## Five finalists

| Candidate    | Intended meaning                           | Strength                                                                                        | Tradeoff                                                                                      |
| ------------ | ------------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Testrill** | Test + drill                               | Short; identifies testing; suggests repeatable practice; usable in prose and CLI configuration. | Some listeners may initially spell it Testdrill, so show the spelling in onboarding and docs. |
| Casehelm     | A helm for test cases                      | A broad workbench identity that can grow across runners.                                        | Could suggest legal case management; less direct about execution.                             |
| Caseweft     | Test cases woven into a repeatable process | Distinctive; connects scenarios and evidence.                                                   | Weft is unfamiliar to many readers and the spelling needs explanation.                        |
| Probeloom    | Investigation and connected evidence       | Suggests exploring behavior across tests.                                                       | Could sound like an observability or security product.                                        |
| Testcairn    | Tests as reliable markers along a path     | Clear testing prefix and a grounded metaphor.                                                   | Cairn has pronunciation/spelling friction; longer as a CLI name.                              |

The first three were presented to the user. Testrill was recommended for the clearest connection to testing and chosen by the user. These meanings are brand constructions, not dictionary definitions.

## Screening record

All completed checks below were run on 10 November 2026. GitHub queries used the repository search API with `NAME in:name`; this is a search result, not ownership or registration availability. npm checks used the exact registry package endpoint. A 404 does not reserve a name.

| Check                             | Testrill                                                                              | Casehelm                                                     | Caseweft                                      | Probeloom                                                              | Testcairn                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Exact-name web search             | Dictionary/word-game results; no obvious competing software found in returned results | No obvious software found in returned results                | No obvious software found in returned results | Literary uses; no obvious competing software found in returned results | Game-review text joining “test” and “Cairn”; no obvious competing software found in returned results |
| GitHub repository-name search     | 0 results                                                                             | 1 substring result, `swimmant/CASEhelmet`; not an exact name | 0 results                                     | 0 results                                                              | 0 results                                                                                            |
| Exact npm package lookup          | HTTP 404                                                                              | HTTP 404                                                     | HTTP 404                                      | HTTP 404                                                               | HTTP 404                                                                                             |
| US trademark search               | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |
| EU trademark search               | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |
| Canada trademark search           | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |
| WIPO global search                | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |
| Domain registration lookup        | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |
| App Store and Google Play         | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |
| GitHub/X/Instagram/TikTok handles | To run                                                                                | To run                                                       | To run                                        | To run                                                                 | To run                                                                                               |

This is an exploratory naming screen. It does not establish availability, protectability, or absence of similar names.

## Why retire Rehearsal

The temporary name meant rehearsing failure scenarios before users encounter them. Research found [Rehearsal Labs' retest](https://github.com/rehearsal-labs/retest), explicitly built for engineers and coding agents, and [rehearsal-js](https://github.com/rehearsal-js/rehearsal-js), a TypeScript migration tool. A distinct identity is preferable for this developer-facing project.

Other same-space candidates were removed after finding existing products or repositories, including [Runledger](https://github.com/runledger/Runledger), [Testrove](https://testrove.com), and [Runweft](https://github.com/1deat0r/runweft). This avoids building the brand around an already observed collision; it is not a full similarity search.

## Candidate longlist

The exploration covered descriptive names (Test Workbench, Scenario Desk, Evidence Lab, Run Ledger, Case Table), compounds and coined forms (Testrill, Casehelm, Caseweft, Probeloom, Testcairn, Faultbench, Caseframe, Runstead, Runlatch, Runweft, Checkweave, Testrove), metaphors (Rehearsal, Cairn, Beacon, Helm), and action names (Replay, Recheck, Verify, Inspect). Generic single-word options were not advanced because they provide little distinction for a public developer tool.
