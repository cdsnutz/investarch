// Per-seed documentation. The same generator that emits a seed's codebase also emits that
// codebase's user guide, technical guide and file manifest, so what is documented and what
// ships can never drift apart. Everything here is derived from the seed, never transcribed.
import { buildKitFiles } from '@/lib/buildKit';
import { buildAgentReadme, buildAcceptanceGuide, buildDeploymentGuide } from '@/lib/agentDocs';
import { buildAgentDeployGuide } from '@/lib/agentDeploy';
import { appSlug } from '@/lib/scaffoldKit';

const DIR_PURPOSE = {
  '': 'Project root: package manifest, build config, entry points, verification script and the hand-off documents.',
  server: 'Express application: middleware, authentication, owner-scoped data access, HTTP routes.',
  database: 'Schema migration, the idempotent migration runner and the deterministic demo seed.',
  src: 'React interface: design tokens, session provider, shell, metadata-driven record screens.',
  'src/pages': 'One file per screen.',
  'src/components': 'Shared interface pieces every screen composes.',
  tests: 'Test suites: route protection, validation, schema, collection contracts, ownership isolation.',
  brand: 'Brand module and its documentation.'
};

const DOCS = [
  'README.md',
  'USER_GUIDE.md',
  'TECHNICAL_GUIDE.md',
  'MANIFEST.md',
  'ACCEPTANCE.md',
  'AGENT_ORDERS.md',
  'AGENTS.md',
  'DEPLOYMENT.md',
  'AGENT_DEPLOY.md'
];

// Exactly the set the exporter writes for one seed (the ZIP adds AUDIT.md at packaging time).
export function seedFileSet(seed, brand, codebase) {
  return buildKitFiles(seed, codebase || {}, brand).concat([
    { path: 'AGENTS.md', content: buildAgentReadme(seed, codebase) },
    { path: 'ACCEPTANCE.md', content: buildAcceptanceGuide(seed, codebase) },
    { path: 'DEPLOYMENT.md', content: buildDeploymentGuide(seed) },
    {
      path: 'AGENT_DEPLOY.md',
      content: buildAgentDeployGuide({
        agentName: seed.title,
        seedTitle: seed.title,
        repoName: codebase?.repo_name
      })
    }
  ]);
}

const bytes = (content) => new TextEncoder().encode(content || '').length;

function group(files) {
  const groups = new Map();
  for (const file of files) {
    const parts = file.path.split('/');
    const dir = parts.length === 1 ? '' : parts[0] === 'src' && parts.length > 2 ? `src/${parts[1]}` : parts[0];
    if (!groups.has(dir)) groups.set(dir, []);
    groups.get(dir).push(file);
  }
  return [...groups.entries()].sort(([a], [b]) => (a === '' ? -1 : b === '' ? 1 : a.localeCompare(b)));
}

function treeDoc(seed, files) {
  const groups = group(files);
  const total = files.reduce((sum, file) => sum + bytes(file.content), 0);
  const docCount = files.filter((file) => DOCS.includes(file.path)).length;

  const sections = groups
    .map(([dir, entries]) => {
      const heading = dir ? `### \`${dir}/\`` : '### Project root';
      const purpose = DIR_PURPOSE[dir] ? ` — ${DIR_PURPOSE[dir]}` : '';
      const rows = entries
        .slice()
        .sort((a, b) => a.path.localeCompare(b.path))
        .map((file) => `| \`${file.path}\` | ${bytes(file.content).toLocaleString('en-US')} |`)
        .join('\n');
      return `${heading}${purpose}\n\n| File | Bytes |\n| --- | --- |\n${rows}`;
    })
    .join('\n\n');

  return `# ${seed.title}: File Manifest

Every file the generator writes for this seed. The list is produced by walking the emitted file set, not transcribed by hand, so it cannot describe a file that does not ship or omit one that does.

## Summary

| Measure | Value |
| --- | --- |
| Files | ${files.length} |
| Directories | ${groups.filter(([dir]) => dir).length} |
| Documentation | ${docCount} |
| Total source | ${total.toLocaleString('en-US')} bytes |
| Slug | \`${appSlug(seed)}\` |
| Packaging adds | \`AUDIT.md\`, written by the verifier when the pack is built |

## Completeness

The export for this seed writes this exact set plus \`AUDIT.md\`. Nothing here is a placeholder: each path is a complete file, and \`./verify.sh\` exercises the built application rather than the source alone. The three documents that govern the build are \`USER_GUIDE.md\` (behaviour), \`TECHNICAL_GUIDE.md\` (architecture and data model) and \`MANIFEST.md\` (what exists and why).

${sections}
`;
}

export function seedDocSet(seed, brand, codebase) {
  const files = seedFileSet(seed, brand, codebase);
  const read = (path) => files.find((file) => file.path === path)?.content || '';

  return {
    files,
    user: read('USER_GUIDE.md'),
    technical: read('TECHNICAL_GUIDE.md'),
    tree: treeDoc(seed, files)
  };
}