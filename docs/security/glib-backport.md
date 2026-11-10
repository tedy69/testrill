# GLib iterator security backport

Reviewed on 10 November 2026 for [Dependabot alert #1](https://github.com/tedy69/testrill/security/dependabot/1), [GHSA-wrw7-89jp-8q8g](https://github.com/advisories/GHSA-wrw7-89jp-8q8g), and [RUSTSEC-2024-0429](https://rustsec.org/advisories/RUSTSEC-2024-0429.html).

## Finding and fix

`glib::VariantStrIter::impl_get` passed an immutable pointer reference to the variadic C function `g_variant_get_child`, which writes through that reference. Optimized Rust can discard the write, leaving a null pointer that subsequently reaches `CStr::from_ptr`. The affected public methods are `next`, `next_back`, `nth`, `nth_back`, and `last`.

The current stable Tauri Linux GTK/WebKit stack requires GLib 0.18. Simply adding GLib 0.20 would leave the old dependency in place or introduce incompatible types. No patched 0.18 registry release exists at review time. The Tauri GTK4 migration proposal is not merged.

Testrill vendors `glib 0.18.5` and applies only the [upstream fix](https://github.com/gtk-rs/gtk-rs-core/commit/05dff0ee696f9bcd8617cd48c4b812d046d440cb): make the pointer mutable and pass `&mut p`. The package version is unchanged. `[patch.crates-io]` in [the native manifest](../../src-tauri/Cargo.toml) redirects every matching GLib dependency to that copy; the lockfile records a path dependency. No advisory is ignored or manually dismissed.

## Provenance

- Source: [official glib 0.18.5 crate archive](https://static.crates.io/crates/glib/glib-0.18.5.crate).
- Archive SHA-256: `233daaf6e83ae6a12a52055f568f9d7cf4671dabb78ff9560ab6da230ce00ee5`, verified against crates.io and the original Cargo lockfile.
- Upstream fix: `05dff0ee696f9bcd8617cd48c4b812d046d440cb`, [gtk-rs-core PR #1343](https://github.com/gtk-rs/gtk-rs-core/pull/1343).
- Only changed upstream file: `src/variant_iter.rs`, with the two-line fix above. All other files match the archive.
- The original [MIT license](../../src-tauri/vendor/glib/LICENSE), copyright notices, and package metadata are retained.
- [Review metadata](../../src-tauri/patches/glib-0.18.5.json) records the archive, upstream commit, original iterator hash, and hashes of all 121 patched source files.

## Verification

```sh
npm run native:check-patches
cargo test --locked --release --manifest-path tests/native/glib-variant/Cargo.toml
cargo tree --locked --manifest-path src-tauri/Cargo.toml --target x86_64-unknown-linux-gnu -i glib@0.18.5
npm run desktop:prepare
cargo check --locked --manifest-path src-tauri/Cargo.toml
```

The regression needs GLib development libraries. Linux CI installs Tauri's GTK/WebKit prerequisites, runs the regression with optimization level 3 and thin LTO, checks the resolved application dependency tree, and compiles the native application. The existing macOS native job remains in place. A compile check is not a Linux GUI or packaging test.

Local macOS arm64 results:

- The exact unmodified crate archive, tested with the same regression harness and release profile, crashes in `last_reads_the_final_string` with signal 11 (`SIGSEGV`). This negative control demonstrates that the test detects the original problem.
- The patched source passes all six tests. They cover all five advisory-listed methods, empty/Unicode strings, mixed iteration, exhaustion, and large skip values.
- All 121 source hashes and the native manifest/lockfile patch selection pass verification.
- The engine/UI build, resource preparation, and macOS native `cargo check --locked` pass.
- Cargo audit reports zero vulnerabilities and only the separate unmaintained `proc-macro-error` warning. A path dependency is outside registry-version matching, so this audit result alone is not evidence that the backport is correct.

Linux CI also passed all six iterator tests and compiled the native application using the local GLib source. See the [verification run](https://github.com/tedy69/testrill/actions/runs/42854991378).

## CodeQL triage

Importing the upstream source exposed seven CodeQL reports. Their SARIF traces were reviewed individually. These are false positives in generic/FFI analysis, not changes to the backport or additional fixed vulnerabilities. No query, language, directory, or security check is disabled.

| CodeQL alert                     | Location under `src-tauri/vendor/glib/src/` | Evidence                                                                                                                                                                                                                                                                                                                                               |
| -------------------------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1, `rust/cleartext-logging`      | `log.rs:85`                                 | The trace carries `g_uuid_string_is_valid` through generic `from_glib` into `LogLevel`. The actual UUID function returns `bool`, not `LogLevel`, and does not log its input. The reported sink prints only an invalid numeric log-level value.                                                                                                         |
| 2, `rust/access-invalid-pointer` | `object.rs:470`                             | The trace routes a `char*` charset, a `GError*`, or a string output through generic `from_glib_none` into `ObjectRef`'s `GObject*` implementation. These are distinct Rust pointer types and trait instantiations; the shown call path cannot compile as an `ObjectRef` conversion. The C out-parameter writes are also absent from the trace.         |
| 3, `rust/access-invalid-pointer` | `object.rs:493`                             | The trace routes `GError*` and string outputs into `FromGlibPtrFull<GObject*>`. The actual error path selects `glib::Error` after a non-null check, not `ObjectRef`. The same generic-instantiation mismatch applies to the string paths.                                                                                                              |
| 4, `rust/access-invalid-pointer` | `subclass/boxed.rs:76`                      | The sink is the `MyBoxed` derive in an upstream `#[cfg(test)]` fixture. The reported charset/error-to-`MyBoxed` path conflates distinct generic trait implementations and is not a native application call path.                                                                                                                                       |
| 5, `rust/access-invalid-pointer` | `value.rs:462`                              | The trace routes a charset or `GError*` through `from_glib_none` into the `GValue*` wrapper's copy function. These pointer types select different trait implementations; a charset/error conversion does not invoke `copy_into_value`.                                                                                                                 |
| 6, `rust/access-invalid-pointer` | `value.rs:470`                              | The same generic mismatch routes a non-null `GError*` conversion into `Value`'s clear/free functions. `file_set_contents` explicitly checks the error pointer before selecting `glib::Error`; it does not construct a `GValue`.                                                                                                                        |
| 7, `rust/access-invalid-pointer` | `collections/ptr_slice.rs:900`              | The trace treats `drop_in_place::<T>(p)` as freeing the slice slot before `ptr::write(p, ...)`. Rust's `drop_in_place` drops the element, not its storage allocation. `PtrSlice` still owns the backing allocation, with `len` bounded by `capacity`. A separate optimized test truncates owned strings, appends, empties, and reuses that allocation. |

See [Rust's `drop_in_place` contract](https://doc.rust-lang.org/std/ptr/fn.drop_in_place.html). CodeQL false-positive dismissals use the specific explanations above and remain distinct from dependency advisory #1, which is addressed by the code backport rather than dismissal. Future CodeQL findings remain enabled for the vendored source.

## Maintenance and removal

Do not run automatic formatters over the vendored crate or edit unrelated upstream files. The source hash check fails on changed, missing, or extra files and on a native lockfile that returns GLib to the registry. Dependency updates must keep the override effective and pass the optimized regression and Linux native job.

Remove the vendored copy, Cargo patch, and hash manifest only when the supported Tauri stack resolves an upstream GLib release containing this fix. Retarget and retain the behavioral regression, regenerate the native lockfile, inspect the full Linux dependency tree, and rerun native CI and security auditing. Do not change a version string merely to clear a scanner finding.

`proc-macro-error 1.0.4` remains an upstream maintenance finding. This backport does not address it. See [the security policy](../../SECURITY.md).

## Review gate

- R-31 PASS: the two-line change repairs the writable C out-pointer; unrelated upstream code and comments remain unchanged.
- R-33 PASS: the fix is present in checked-in Rust source and selected by Cargo, with no install-time source rewriting.
- R-35 PASS: the unpatched optimized control crashes; all six patched regression tests and the macOS native check pass.
- R-36 / C-5 PASS: the review distinguishes source-level remediation, registry-scanner coverage, and unverified Linux GUI/packaging behavior.
- Visual gates are outside this change: no UI, colors, navigation, typography, or assets were modified.
