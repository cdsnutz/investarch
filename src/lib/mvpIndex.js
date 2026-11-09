// One index at the root of the archive: every forged app, the head of its market, and the single
// advantage it was built to win on, so the portfolio can be read before any folder is opened.
const text = (value) => String(value ?? '').trim();

export function buildPortfolioIndex(shipped) {
  const stamp = new Date().toISOString().slice(0, 10);
  const rows = shipped.map((entry, index) => {
    const spec = entry.spec || {};
    return `| ${index + 1} | [${text(entry.seed.title)}](${entry.folder}/MVP_BRIEF.md) | ${text(spec.category) || 'unclassified'} | ${
      text(spec.headline) || text(entry.seed.title)
    } | ${text(spec.wedge).slice(0, 160) || 'not recorded'} | ${(spec.competitors || []).length} | ${spec.score ?? 0}/100 |`;
  });

  return `# Gold-standard MVP portfolio

Forged ${stamp} from the IP seed ledger. ${shipped.length} application${shipped.length === 1 ? '' : 's'}, each one a complete project rather than a mockup.

Every folder in this archive is a runnable full-stack application: Express API with owner-scoped records, Postgres migrations and a deterministic demo dataset, a React interface with a screen for every collection, a test suite, and the hand-off documents. Each was audited before it was packaged: structure, syntax and contracts pass, or the app is not here.

| # | Application | Category | Headline | Advantage | Competitors read | Score |
| --- | --- | --- | --- | --- | --- | --- |
${rows.join('\n')}

## Opening one

\`\`\`bash
cd <application-folder>
cp .env.example .env      # DATABASE_URL, AUTH_SECRET (openssl rand -hex 32)
npm install
npm run db:migrate && npm run db:seed
npm run dev &             # API on :3000
npm run dev:web           # interface on :5173
\`\`\`

\`./verify.sh\` runs install, lint, test, build and a live probe, and prints \`PASS\` only when all of it works.

## Reading order

1. \`<application-folder>/MVP_BRIEF.md\` for the competitor teardown that set the scope, the wedge, and the criteria the build is measured against.
2. \`MANIFEST.md\` for every path and what proves it.
3. \`AGENT_ORDERS.md\` for the six work orders that extend it without breaking it.
4. \`DEPLOYMENT.md\` for the preview, verification and promote sequence.

Nothing in these archives is a placeholder: if a screen, a route or a test is described, it exists in the folder.
`;
}