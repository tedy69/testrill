# Upgrade from the temporary product name

Rehearsal was the working name. Testrill is the chosen public identity. The product name, window title, logos, bundle executable, CLI output, MCP server identity, new manifest examples, downloads, and exports now use Testrill.

The native bundle identifier remains `dev.rehearsal.workbench` so the operating system continues to resolve the installed workspace, its project registrations, history, and evidence paths. This is an internal compatibility identifier, not the public product name. Changing it would create a different app-data directory.

Existing workspaces keep using `rehearsal.sqlite`. New workspaces create `testrill.sqlite`. The database schema and artifact paths are unchanged. Do not move or rename an active SQLite database, its WAL, or evidence directories.

New source checkouts use `.testrill/`. Pass `--data /absolute/path/to/old/.rehearsal` to continue an existing source workspace. Explicit `--data` takes precedence over `TESTRILL_DATA_DIR`, then the older `REHEARSAL_DATA_DIR`.

Test commands receive the documented `TESTRILL_*` environment variables and the previous `REHEARSAL_*` aliases. Checkpoint requests accept both `/__testrill/checkpoints/` and the previous prefix. Runtime/UI environment overrides accept the previous names as fallbacks. Existing manifest filenames remain importable; `testrill.json` is the new convention, not a required basename.

Browser storage keeps the previous private token and selected-project keys, so an already-open workspace retains its state. Fresh MCP configurations use the `testrill` server key. Recopy Agent connection after replacing the installed bundle, because its executable path has changed.
