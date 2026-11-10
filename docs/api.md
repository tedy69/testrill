# Local HTTP API

The CLI and MCP interfaces are the preferred automation entry points. This API reference describes the current preview implementation in `src/server.ts`; it is not a separately versioned stable remote-service contract.

The engine binds to loopback. Read the URL and bearer token from the intended workspace's private `connection.json`, or obtain client configuration from the workbench's Agent connection page. Every API request requires `Authorization: Bearer <token>`. JSON requests use `Content-Type: application/json`. The example token below is a placeholder; do not commit a real one.

```http
GET /api/projects HTTP/1.1
Authorization: Bearer <token>
```

## Routes

Paths are relative to the engine URL. Encode project, run, and artifact identifiers when constructing paths.

| Method and path                                   | Request or result                                                                                                                                  |
| ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| `GET /api/health`                                 | Engine name, version, and process ID                                                                                                               |
| `GET /api/connection`                             | Concrete MCP client configuration, workspace path, and HTTP endpoint                                                                               |
| `GET /api/projects`                               | Registered project definitions                                                                                                                     |
| `POST /api/projects/import`                       | `{ "path": "/absolute/path/testrill.json" }`, or `{ "config": <manifest>, "root": "/absolute/project/root" }`; registers a project and returns 201 |
| `GET /api/projects/:projectId`                    | Project definition with environment state                                                                                                          |
| `PUT /api/projects/:projectId`                    | `{ "config": <manifest>, "writeToSource": false }`; validates and updates the workspace definition                                                 |
| `GET /api/projects/:projectId/environment`        | Current readiness/process state                                                                                                                    |
| `POST /api/projects/:projectId/environment/start` | Starts the declared trusted environment if needed, then checks readiness                                                                           |
| `POST /api/projects/:projectId/environment/stop`  | Stops only a process owned by the engine                                                                                                           |
| `GET /api/runs?project=:projectId`                | Recent runs, optionally filtered; omits the full event ledger and configuration snapshot                                                           |
| `POST /api/runs`                                  | `{ "projectId": "…", "suiteId": "…", "scenarioId": "…" }`; scenario is optional; returns 202 with a run ID                                         |
| `GET /api/runs/:runId`                            | Full saved run, status, events, snapshot, and artifact metadata                                                                                    |
| `POST /api/runs/:runId/cancel`                    | Requests cancellation; poll the run for its final status                                                                                           |
| `POST /api/runs/:runId/checkpoint`                | `{ "name": "continue" }`; releases a checkpoint scoped to that run                                                                                 |
| `POST /api/runs/:runId/rerun`                     | Starts a run from the saved suite/scenario/target definition; returns 202                                                                          |
| `GET /api/runs/:runId/artifacts/:artifactId`      | Recorded PNG, JSON, or ZIP bytes with the appropriate content type                                                                                 |
| `GET /api/runs/:runId/export`                     | Evidence ZIP after finalization; returns 409 while a run is unfinished                                                                             |
| `POST /mcp`                                       | Authenticated stateless MCP Streamable HTTP transport; use an MCP SDK rather than hand-written protocol messages                                   |

Updating a project does not overwrite its source manifest by default. `writeToSource: true` is an explicit write and requires an associated source file. MCP's `update_project` changes only the workspace copy. Importing a manifest does not execute its commands, but starting an environment or running an external suite does.

## Outcomes and errors

Poll a started run until its status is terminal. `queued` and `running` are not results. `passed` means configured inline assertions completed or the external command exited successfully; it does not prove behavior that was not asserted. Other terminal states are `failed`, `blocked`, `cancelled`, and `interrupted`.

JSON route errors return an HTTP error status and `{ "error": "message" }`. Typical cases include 400 for malformed/invalid input, 401 for invalid authentication, 403 for a rejected origin, 404 for an unknown project/suite/run/artifact, 409 for duplicate imports or an unfinished export, and 413 for request/export limits. MCP exposes tool errors through the MCP result contract instead.

The engine accepts JSON bodies up to 2 MB and limits included export artifacts to 80 MB. [Architecture](architecture.md) documents further limits and the trust model. Screenshots, traces, and output can contain application data; the API does not sanitize all evidence for publication.
