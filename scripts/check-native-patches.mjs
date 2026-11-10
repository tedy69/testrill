import { createHash } from 'node:crypto';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const metadata = JSON.parse(readFileSync(join(root, 'src-tauri/patches/glib-0.18.5.json'), 'utf8'));
const vendor = join(root, 'src-tauri/vendor/glib');
const actual = {};
function inspect(directory, prefix = '') {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const name = `${prefix}${entry.name}`;
    if (entry.isDirectory()) inspect(join(directory, entry.name), `${name}/`);
    else if (entry.isFile())
      actual[name] = createHash('sha256')
        .update(readFileSync(join(directory, entry.name)))
        .digest('hex');
    else throw new Error(`Unexpected entry in vendored GLib: ${name}`);
  }
}
inspect(vendor);
for (const name of new Set([...Object.keys(metadata.files), ...Object.keys(actual)])) {
  if (!metadata.files[name] || actual[name] !== metadata.files[name])
    throw new Error(`Vendored GLib differs from the reviewed backport: ${name}`);
}

const manifest = readFileSync(join(root, 'src-tauri/Cargo.toml'), 'utf8');
if (!/\[patch\.crates-io\]\s+glib\s*=\s*\{\s*path\s*=\s*"vendor\/glib"\s*\}/.test(manifest))
  throw new Error('The native manifest must select the reviewed GLib backport');
const lock = readFileSync(join(root, 'src-tauri/Cargo.lock'), 'utf8');
const entries = lock.split('[[package]]').filter((entry) => /^\s*name = "glib"$/m.test(entry));
if (
  entries.length !== 1 ||
  !/^version = "0\.18\.5"$/m.test(entries[0]) ||
  /^source = /m.test(entries[0])
)
  throw new Error('The native lockfile must resolve GLib to the local backport');

process.stdout.write(
  `Verified ${Object.keys(actual).length} vendored GLib files and native patch resolution.\n`,
);
