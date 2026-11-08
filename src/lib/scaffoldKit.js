// Files bundled into every IP scaffold: env template, antislop skills, devpro-deploy kit, agent roadmap.
const SKILLS = import.meta.glob('/skills/**/*', { query: '?raw', import: 'default', eager: true });

export function antislopFiles() {
  return Object.entries(SKILLS).map(([path, content]) => ({ path: `.agent${path}`, content }));
}

export function buildEnvExample(seed) {
  const extra = (seed.blueprint?.tech_stack || [])
    .filter((t) => /stripe|openai|anthropic|resend|twilio|s3|aws|supabase|redis|sendgrid|clerk|auth0/i.test(t))
    .map((t) => `# ${t}\n${t.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}_API_KEY=`)
    .join('\n\n');
  return `# ${seed.title}: copy to .env and fill every value. Never commit .env.

# Core
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/app

# Auth (32+ random bytes: openssl rand -hex 32)
AUTH_SECRET=

# Email
EMAIL_FROM=
EMAIL_API_KEY=

# devpro-deploy
DEPLOY_HOST=vercel            # vercel | render | fly
DEPLOY_TOKEN=
DEPLOY_PROJECT=
${extra ? `\n# Stack integrations\n${extra}\n` : ''}`;
}

const DEPLOY_SH = `#!/usr/bin/env bash
# devpro-deploy: verify, build and ship. Usage: ./devpro-deploy/deploy.sh [preview|production]
set -euo pipefail
TARGET="\${1:-preview}"
[ -f .env ] && set -a && . ./.env && set +a
: "\${DEPLOY_HOST:?Set DEPLOY_HOST in .env}"
: "\${DEPLOY_TOKEN:?Set DEPLOY_TOKEN in .env}"

echo "[1/5] Install";      npm ci
echo "[2/5] Lint";         npm run lint --if-present
echo "[3/5] Test";         npm test --if-present
echo "[4/5] Build";        npm run build
echo "[5/5] Deploy -> $DEPLOY_HOST ($TARGET)"
case "$DEPLOY_HOST" in
  vercel) npx --yes vercel deploy --token "$DEPLOY_TOKEN" $([ "$TARGET" = production ] && echo --prod) ;;
  render) curl -fsS -X POST "https://api.render.com/v1/services/$DEPLOY_PROJECT/deploys" -H "Authorization: Bearer $DEPLOY_TOKEN" ;;
  fly)    FLY_API_TOKEN="$DEPLOY_TOKEN" npx --yes @flydotio/flyctl deploy --app "$DEPLOY_PROJECT" ;;
  *) echo "Unsupported DEPLOY_HOST: $DEPLOY_HOST"; exit 1 ;;
esac
[ -n "\${APP_URL:-}" ] && curl -fsS "$APP_URL/health" >/dev/null && echo "Health check passed"
`;

const CI_YML = `name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  verify-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: chmod +x devpro-deploy/deploy.sh
      - run: ./devpro-deploy/deploy.sh \${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
        env:
          DEPLOY_HOST: \${{ secrets.DEPLOY_HOST }}
          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}
          DEPLOY_PROJECT: \${{ secrets.DEPLOY_PROJECT }}
          APP_URL: \${{ secrets.APP_URL }}
`;

export function devproDeployFiles() {
  return [
    { path: 'devpro-deploy/deploy.sh', content: DEPLOY_SH },
    { path: '.github/workflows/devpro-deploy.yml', content: CI_YML },
    { path: 'devpro-deploy/README.md', content: '# devpro-deploy\n\nOne-command verify, build and deploy.\n\n```bash\nchmod +x devpro-deploy/deploy.sh\n./devpro-deploy/deploy.sh preview\n./devpro-deploy/deploy.sh production\n```\n\nConfigure `DEPLOY_HOST`, `DEPLOY_TOKEN`, `DEPLOY_PROJECT` in `.env` locally and as repository secrets for CI. Supported hosts: vercel, render, fly.\n' }
  ];
}

export function appSlug(seed) {
  return (seed.title || 'app').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 32) || 'app';
}

// Reads table and column names out of a schema draft written as CREATE TABLE statements.
export function parseTables(dbSchema) {
  const tables = [];
  const re = /create\s+table(?:\s+if\s+not\s+exists)?\s+"?(\w+)"?\s*\(([\s\S]*?)\)\s*;/gi;
  let match;
  while ((match = re.exec(dbSchema || ''))) {
    const name = match[1];
    if (/^(users?|migrations|sessions|accounts)$/i.test(name)) continue;
    const cols = match[2]
      .split('\n')
      .map((l) => l.trim())
      .filter(Boolean)
      .filter((l) => !/^(primary key|foreign key|constraint|unique|check|index|--)/i.test(l))
      .map((l) => l.split(/[\s(]/)[0].replace(/"/g, ''))
      .filter((c) => c && !/^(id|created_at|updated_at|owner_id|user_id|deleted_at)$/i.test(c));
    if (cols.length) tables.push({ name, cols });
  }
  return tables;
}

function seedPools(seed) {
  const plan = (seed.mini_plan || '')
    .split(/\n+/)
    .map((l) => l.replace(/^[-*\d.)\s]+/, '').trim())
    .filter((l) => l.length > 12);
  const titles = [seed.title, ...plan].filter(Boolean).map((t) => String(t).slice(0, 120));
  const bodies = [seed.solution, seed.gap, seed.pain_signal, ...plan]
    .filter((b) => b && String(b).length > 20)
    .map((b) => String(b).slice(0, 300));
  while (titles.length < 3) titles.push(`${seed.title || 'Record'} ${titles.length + 1}`);
  while (bodies.length < 3) bodies.push(String(seed.solution || seed.title || 'Seeded record'));
  return { titles: titles.slice(0, 3), bodies: bodies.slice(0, 3) };
}

function valueFor(col, i, pools, slug) {
  const c = col.toLowerCase();
  if (/email/.test(c)) return `owner${i + 1}@${slug}.example.com`;
  if (/amount|price|cost|revenue|budget|fee|salary|value/.test(c)) return [1200, 4800, 9600][i];
  if (/count|qty|quantity|score|rating|percent|hours|days|month|year|number/.test(c)) return i + 1;
  if (/^(is_|has_)|_flag$|boolean|active|enabled/.test(c)) return true;
  if (/date|_at$|due|deadline|start|end|expires/.test(c)) return new Date(Date.UTC(2026, 0, 8 + i * 7)).toISOString();
  if (/url|link|website|href/.test(c)) return `https://example.com/${slug}-${i + 1}`;
  if (/status|state|stage|phase/.test(c)) return ['active', 'in_progress', 'done'][i];
  if (/title|name|label|headline|subject/.test(c)) return pools.titles[i];
  if (/desc|summary|body|content|detail|note|text|thesis|rationale|comment/.test(c)) return pools.bodies[i];
  return `${pools.titles[i]} · ${col} ${i + 1}`;
}

export function buildSeedScript(seed) {
  const slug = appSlug(seed);
  const pools = seedPools(seed);
  const parsed = parseTables(seed.blueprint?.db_schema);
  const tables = (parsed.length ? parsed : [{ name: 'items', cols: ['title', 'description', 'status'] }]).slice(0, 6);
  const dataset = tables.map((t) => {
    const cols = t.cols.filter((c) => !/password|token|secret|hash|salt/i.test(c)).slice(0, 8);
    return {
      name: t.name,
      rows: [0, 1, 2].map((i) => {
        const row = {};
        cols.forEach((c) => { row[c] = valueFor(c, i, pools, slug); });
        return row;
      })
    };
  });
  const demoEmail = `demo@${slug}.example.com`;
  const otherEmail = `other@${slug}.example.com`;

  return `#!/usr/bin/env node
// Deterministic demo dataset for ${seed.title}. Re-runnable: it clears the demo user's rows first.
import 'dotenv/config';
import pg from 'pg';
import bcrypt from 'bcryptjs';

// The only schema knowledge in this file. Edit these names if your tables differ.
const USERS = { table: 'users', email: 'email', name: 'full_name', password: 'password_hash' };
const OWNER = 'owner_id';

const DEMO = {
  email: ${JSON.stringify(demoEmail)},
  other: ${JSON.stringify(otherEmail)},
  password: 'DemoPass123!',
  name: ${JSON.stringify(seed.title || 'Demo Operator')}
};

const DATASET = ${JSON.stringify(dataset, null, 2)};

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();

const passwordHash = await bcrypt.hash(DEMO.password, 10);

async function ensureUser(email, name) {
  const found = await client.query(
    'select id from ' + USERS.table + ' where ' + USERS.email + ' = $1',
    [email]
  );
  if (found.rowCount) return found.rows[0].id;
  const made = await client.query(
    'insert into ' + USERS.table + ' (' + USERS.email + ', ' + USERS.name + ', ' + USERS.password + ') values ($1, $2, $3) returning id',
    [email, name, passwordHash]
  );
  return made.rows[0].id;
}

const demoId = await ensureUser(DEMO.email, DEMO.name);
await ensureUser(DEMO.other, 'Outside Reviewer');

const found = await client.query("select table_name from information_schema.tables where table_schema = 'public'");
const known = new Set(found.rows.map((r) => r.table_name));
const report = [];

for (const table of DATASET) {
  if (!known.has(table.name)) {
    report.push({ table: table.name, result: 'skipped: table not found' });
    continue;
  }
  const cols = await client.query(
    'select column_name from information_schema.columns where table_schema = $1 and table_name = $2',
    ['public', table.name]
  );
  const present = new Set(cols.rows.map((r) => r.column_name));
  const ownsRows = present.has(OWNER);
  if (ownsRows) {
    await client.query('delete from "' + table.name + '" where "' + OWNER + '" = $1', [demoId]);
  }

  let inserted = 0;
  for (const row of table.rows) {
    const names = Object.keys(row).filter((k) => present.has(k));
    if (ownsRows) names.push(OWNER);
    if (!names.length) continue;
    const values = names.map((k) => (k === OWNER ? demoId : row[k]));
    const marks = names.map((_, idx) => '$' + (idx + 1));
    await client.query(
      'insert into "' + table.name + '" (' + names.map((n) => '"' + n + '"').join(', ') + ') values (' + marks.join(', ') + ')',
      values
    );
    inserted += 1;
  }
  report.push({ table: table.name, result: inserted + ' rows' });
}

console.table(report);
console.log('Demo sign-in: ' + DEMO.email + ' / ' + DEMO.password);
console.log('Isolation account (no rows): ' + DEMO.other);
await client.end();
`;
}

export function buildRoadmap(seed) {
  return `# ${seed.title}: Agent Roadmap

Execute phases in order. Do not start a phase until every exit check of the previous one passes. Record progress by ticking boxes in this file.

## Phase 0: Orientation
- [ ] Read AGENTS.md, SCAFFOLD.md, DEPLOYMENT.md and this file in full.
- [ ] Load every skill in \`.agent/skills/\`. Apply antislop-code to all code, antislop-ui and antislop-layoutmobile to all screens, antislop-copywriting to all user-facing text.
- [ ] Copy \`.env.example\` to \`.env\` and fill values.
Exit: \`npm install\` succeeds.

## Phase 1: Foundation
- [ ] Run SCAFFOLD.md sections 2 and 3: bootstrap the project, then port every scaffold file.
- [ ] Project structure, lint, formatter and test runner configured.
- [ ] Confirm the shipped scripts run: dev, dev:web, build, start, test, lint, db:migrate, db:seed, verify.
- [ ] \`GET /health\` returns 200.
Exit: \`npm run lint && npm test && npm run build\` pass.

## Phase 2: Data and Auth
- [ ] Implement every entity in AGENTS.md section 5 with migrations.
- [ ] Sign up, sign in, sign out, password reset.
- [ ] Every query scoped to the record owner.
Exit: tests prove user A cannot read or modify user B's records.

## Phase 3: Core Logic
- [ ] Implement AGENTS.md section 6 as server-side services with unit tests.
- [ ] Validate all input at API boundaries.
Exit: core logic test coverage at or above 80%.

## Phase 4: Interface
- [ ] Every flow reachable from the UI, with loading, empty and error states.
- [ ] Responsive at 375px, 768px and 1280px.
- [ ] Run the antislop-ui and antislop-copywriting checklists; fix every finding.
Exit: manual walkthrough of the primary flow succeeds with no console errors.

## Phase 5: Integrations
- [ ] Wire each service in AGENTS.md section 7 behind an env-configured client.
- [ ] Failures surface a clear error and do not crash the app.
Exit: integration tests pass against sandbox credentials.

## Phase 6: Ship
- [ ] \`./devpro-deploy/deploy.sh preview\` succeeds.
- [ ] Complete DEPLOYMENT.md section 6 checks on the preview URL.
- [ ] \`./devpro-deploy/deploy.sh production\`.
Exit: production health check returns 200 and the primary flow works end to end.

## Failure Protocol
On any failed check: read the full error, fix the root cause, re-run the check. Never skip, disable or mock a failing test to pass a phase.
`;
}