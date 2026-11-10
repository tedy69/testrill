# Project manifests

A manifest contains `version: 1`, a stable `id`, `name`, HTTP(S) `baseUrl`, `suites`, and optional `scenarios` and `environment`. IDs contain letters, digits, dots, underscores, or hyphens. Suite/scenario IDs must be unique within their lists. A suite can declare a default scenario.

The editor schema is in `schemas/project.schema.json`; regenerate it with `npm run schema`. Cross-field constraints, such as scenario references and runner/step exclusivity, are additionally enforced by runtime validation.

## Inline steps

- `navigate`: `url`, relative to baseUrl or using `{{baseUrl}}` / `{{mockUrl}}`.
- `fill`: exact accessible `label` and `value`.
- `click`: accessible `name`, optional `role` (button by default).
- `expectText`: visible `text`.
- `expectUrl`: URL substring `includes`.
- `request`: `method`, `url`, `expectStatus`, optional JSON `body` and `expectBodyIncludes`.
- `screenshot`: stable `name` used in the artifact filename.
- `checkpoint`: scenario checkpoint `name` to release.

Click, fill, expectations, and requests accept `timeoutMs`. Suite steps are sequential. Use a test framework through the command adapter for branching, custom selectors, authentication setup, richer assertions, or complex data preparation.

## Scenarios

A route matches an exact `method` and `path`. It can supply a `status`, `delayMs`, JSON `body`, or an SSE `stream` action list. Stream actions are `event` (data, optional id/event name), `delay` (ms), `checkpoint` (name), and `disconnect`.

Known `Last-Event-ID` values resume after the corresponding event. Unknown IDs restart the configured sequence; this is a deliberate mock behavior, not an assertion of the correct behavior for every real server. Checkpoint releases persist for that run only. Use unique event IDs for unambiguous replay.

## Existing tests and mobile flows

A suite declares either inline `steps` or a `runner`:

```json
{
  "id": "regression",
  "name": "Existing regression suite",
  "runner": {
    "type": "command",
    "command": ["npm", "run", "test:e2e"],
    "timeoutMs": 120000
  }
}
```

On Windows, use the actual executable name where needed, such as `npm.cmd`; Rehearsal does not invoke a shell. Arguments are passed separately. Do not put a complete shell expression in one array entry.

An app launched from Finder may have a different PATH from your terminal. Use an absolute executable path in a manifest when a tool cannot be found in the graphical application's environment.

```json
{
  "id": "android-login",
  "name": "Mobile login",
  "runner": { "type": "maestro", "flow": "flows/login.yaml", "timeoutMs": 120000 }
}
```

Maestro must already be installed and a supported device/simulator available. Flows must resolve inside the project root. Use an optional `device` value to choose a device. A successful exit is recorded as runner success; the original JUnit output is retained for inspection. Physical mobile execution is not guaranteed by configuration validation alone.

## External test environment

Command and Maestro processes receive:

| Variable                  | Value                                                 |
| ------------------------- | ----------------------------------------------------- |
| `REHEARSAL_BASE_URL`      | Project target                                        |
| `REHEARSAL_MOCK_URL`      | Temporary scenario endpoint, empty without a scenario |
| `REHEARSAL_ARTIFACT_DIR`  | Run evidence directory                                |
| `REHEARSAL_CONTROL_URL`   | Checkpoint control endpoint prefix                    |
| `REHEARSAL_CONTROL_TOKEN` | Temporary checkpoint bearer token                     |

Release a checkpoint from a Node test:

```ts
await fetch(`${process.env.REHEARSAL_CONTROL_URL}/continue`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${process.env.REHEARSAL_CONTROL_TOKEN}` },
});
```

Do not print checkpoint credentials. Stored scenarios and run configuration snapshots do not include these temporary credentials.

## Environment process

`environment.command` is an argument array such as `["npm", "run", "dev"]`. An optional `readyUrl` overrides baseUrl for readiness. Rehearsal checks readiness before launching: an already responding service is not claimed or stopped. Only an owned process is stopped through the environment control. Importing never starts the command automatically.
