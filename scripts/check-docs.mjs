import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, extname, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { marked } from 'marked';
import GithubSlugger from 'github-slugger';
import { parseDocument } from 'yaml';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const files = [
  ...new Set(
    execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '-z'], {
      cwd: root,
      encoding: 'utf8',
    }).split('\0'),
  ),
].filter(
  (file) => file && !file.startsWith('src-tauri/vendor/') && existsSync(resolve(root, file)),
);
const errors = [];
const required = [
  'README.md',
  'CONTRIBUTING.md',
  'CODE_OF_CONDUCT.md',
  'GOVERNANCE.md',
  'SECURITY.md',
  'SUPPORT.md',
  'CHANGELOG.md',
  'AGENTS.md',
  'CLAUDE.md',
  'LICENSE',
  '.github/CODEOWNERS',
  '.github/PULL_REQUEST_TEMPLATE.md',
  '.github/ISSUE_TEMPLATE/bug_report.yml',
  '.github/ISSUE_TEMPLATE/feature_request.yml',
  '.github/ISSUE_TEMPLATE/config.yml',
  '.github/dependabot.yml',
  'docs/README.md',
  'docs/development.md',
  'docs/agents.md',
  'docs/api.md',
  'docs/releasing.md',
];
for (const file of required)
  if (!existsSync(resolve(root, file))) errors.push(`Missing collaboration file: ${file}`);

const documents = new Map();
function plain(tokens = []) {
  return tokens.map((token) => (token.tokens ? plain(token.tokens) : (token.text ?? ''))).join('');
}
function document(file) {
  if (documents.has(file)) return documents.get(file);
  const tokens = marked.lexer(readFileSync(file, 'utf8'));
  const slugger = new GithubSlugger();
  const anchors = new Set();
  const links = [];
  marked.walkTokens(tokens, (token) => {
    if (token.type === 'heading') anchors.add(slugger.slug(plain(token.tokens)));
    if (token.type === 'link' || token.type === 'image') links.push(token.href);
  });
  const value = { anchors, links };
  documents.set(file, value);
  return value;
}
let checkedLinks = 0;
for (const file of files.filter((file) => file.endsWith('.md'))) {
  const source = resolve(root, file);
  for (const href of document(source).links) {
    if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href)) continue;
    checkedLinks++;
    try {
      const [pathname, fragment] = href.split('#', 2);
      const path = decodeURIComponent(pathname.split('?', 1)[0]);
      const target = path.startsWith('/')
        ? resolve(root, `.${path}`)
        : resolve(dirname(source), path || '.');
      const relativeTarget = relative(root, target);
      if (relativeTarget === '..' || relativeTarget.startsWith(`..${sep}`))
        throw new Error('target escapes the repository');
      if (!existsSync(target)) throw new Error('target does not exist');
      const markdownTarget = pathname ? target : source;
      if (
        fragment &&
        extname(markdownTarget) === '.md' &&
        statSync(markdownTarget).isFile() &&
        !document(markdownTarget).anchors.has(decodeURIComponent(fragment))
      )
        throw new Error('heading anchor does not exist');
    } catch (error) {
      errors.push(`${file}: ${href}: ${error.message}`);
    }
  }
}

let checkedYaml = 0;
for (const file of files.filter((file) => file.startsWith('.github/') && /\.ya?ml$/.test(file))) {
  checkedYaml++;
  const parsed = parseDocument(readFileSync(resolve(root, file), 'utf8'), { uniqueKeys: true });
  if (parsed.errors.length) {
    errors.push(...parsed.errors.map((error) => `${file}: ${error.message}`));
    continue;
  }
  const data = parsed.toJS();
  if (file.startsWith('.github/ISSUE_TEMPLATE/') && !file.endsWith('/config.yml')) {
    if (!data?.name || !data?.description || !Array.isArray(data?.body)) {
      errors.push(`${file}: missing issue-form name, description, or body`);
      continue;
    }
    const ids = new Set();
    for (const field of data.body) {
      if (!['markdown', 'input', 'textarea', 'dropdown', 'checkboxes'].includes(field.type))
        errors.push(`${file}: unsupported field type ${field.type}`);
      if (field.type === 'markdown') continue;
      if (!field.id || ids.has(field.id) || !field.attributes?.label)
        errors.push(`${file}: fields need unique IDs and labels`);
      ids.add(field.id);
    }
  }
  if (file.startsWith('.github/workflows/')) {
    if (!data?.on || !data?.jobs) errors.push(`${file}: missing workflow triggers or jobs`);
    for (const job of Object.values(data?.jobs ?? {})) {
      for (const step of job.steps ?? []) {
        if (
          step.uses &&
          !step.uses.startsWith('./') &&
          !/^[\w.-]+\/[\w./-]+@[a-f0-9]{40}$/.test(step.uses)
        )
          errors.push(`${file}: action must be pinned to a full commit SHA: ${step.uses}`);
      }
    }
  }
  if (file === '.github/dependabot.yml' && (data?.version !== 2 || !Array.isArray(data.updates)))
    errors.push(`${file}: invalid Dependabot configuration`);
}
const owners = readFileSync(resolve(root, '.github/CODEOWNERS'), 'utf8');
if (!/^\*\s+@tedy69\s*$/m.test(owners))
  errors.push('CODEOWNERS must route default ownership to the maintainer');
const mcp = readFileSync(resolve(root, 'src/mcp.ts'), 'utf8');
const agentDocs = readFileSync(resolve(root, 'docs/agents.md'), 'utf8');
for (const match of mcp.matchAll(/(?:register|server\.registerTool)\(\s*'([a-z_]+)'/g))
  if (!agentDocs.includes(`\`${match[1]}\``))
    errors.push(`docs/agents.md: missing MCP tool ${match[1]}`);

if (errors.length) {
  process.stderr.write(`${errors.join('\n')}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Checked ${documents.size} Markdown documents, ${checkedLinks} local links, ${checkedYaml} GitHub YAML files, collaboration files, and MCP tool coverage.\n`,
  );
}
