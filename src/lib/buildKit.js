// The runnable skeleton every codebase pack ships: pinned dependencies, a booting server,
// a migration runner, a seeded baseline schema, a test harness and the file manifests.
import { parseTables, appSlug } from '@/lib/scaffoldKit';

const ENTITY_CAP = 8;

function sqlType(col) {
  const c = col.toLowerCase();
  if (/^(is_|has_)|_flag$|boolean|(^|_)(active|enabled)($|_)/.test(c)) return 'boolean not null default false';
  if (/amount|price|cost|revenue|budget|fee|salary|score|count|qty|quantity|percent|hours|days|month|year|rating|number/.test(c)) return 'numeric not null default 0';
  if (/date|_at$|due|deadline|starts|ends|expires/.test(c)) return 'timestamptz';
  if (/status|state|stage|phase/.test(c)) return "text not null default 'active'";
  if (/url|link|website|href/.test(c)) return 'text';
  return 'text';
}

function entitiesOf(seed) {
  const parsed = parseTables(seed.blueprint?.db_schema);
  return (parsed.length ? parsed : [{ name: 'items', cols: ['title', 'description', 'status'] }])
    .slice(0, ENTITY_CAP)
    .map((t) => ({
      name: t.name,
      cols: t.cols.filter((c) => !/^(id|created_at|updated_at|owner_id|user_id)$/i.test(c)).slice(0, 12)
    }));
}

export function buildInitSql(seed) {
  const entities = entitiesOf(seed);
  const blocks = entities.map((t) => {
    const lines = t.cols.map((c) => `  "${c}" ${sqlType(c)}`).join(',\n');
    return `create table if not exists "${t.name}" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
${lines ? lines + ',\n' : ''}  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists "${t.name}_owner_id_idx" on "${t.name}" (owner_id);
create index if not exists "${t.name}_created_at_idx" on "${t.name}" (created_at desc);`;
  });

  return `-- Baseline schema for ${seed.title}, generated from AGENTS.md section 5.
-- Column types are a starting point: refine them where the business needs it.
-- Never edit a migration that has already run. Add 002_*.sql instead.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

${blocks.join('\n\n')}

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

${entities
  .map(
    (t) => `drop trigger if exists "${t.name}_touch" on "${t.name}";
create trigger "${t.name}_touch" before update on "${t.name}" for each row execute function touch_updated_at();`
  )
  .join('\n')}
`;
}

function buildPackageJson(seed) {
  const pkg = {
    name: appSlug(seed),
    private: true,
    version: '0.1.0',
    type: 'module',
    engines: { node: '>=20' },
    scripts: {
      dev: 'node --watch server/index.js',
      'dev:web': 'vite',
      build: 'vite build',
      start: 'node server/index.js',
      test: 'vitest run',
      'test:watch': 'vitest',
      lint: 'eslint .',
      'db:migrate': 'node database/migrate.js',
      'db:seed': 'node database/seed.js',
      verify: 'npm run lint && npm test && npm run build'
    },
    dependencies: {
      bcryptjs: '^2.4.3',
      'cookie-parser': '^1.4.6',
      cors: '^2.8.5',
      dotenv: '^16.4.5',
      express: '^4.19.2',
      helmet: '^7.1.0',
      jsonwebtoken: '^9.0.2',
      pg: '^8.11.5',
      react: '^18.3.1',
      'react-dom': '^18.3.1',
      'react-router-dom': '^6.26.2',
      zod: '^3.23.8'
    },
    devDependencies: {
      '@eslint/js': '^9.9.0',
      '@vitejs/plugin-react': '^4.3.1',
      eslint: '^9.9.0',
      'eslint-plugin-react-hooks': '^4.6.2',
      globals: '^15.9.0',
      supertest: '^7.0.0',
      vite: '^5.4.2',
      vitest: '^2.0.5'
    }
  };
  return JSON.stringify(pkg, null, 2) + '\n';
}

const SERVER_APP = `import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import helmet from 'helmet';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import apiRouter from './routes/index.js';

const here = dirname(fileURLToPath(import.meta.url));
const dist = join(here, '..', 'dist');

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
  app.use(cors({ origin: process.env.APP_URL || true, credentials: true }));
  app.use(express.json({ limit: '1mb' }));
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ ok: true, uptime: process.uptime() }));
  app.use('/api', apiRouter);

  if (existsSync(dist)) {
    app.use(express.static(dist));
    app.get('*', (_req, res) => res.sendFile(join(dist, 'index.html')));
  }

  app.use((req, res) => res.status(404).json({ error: 'Not found', path: req.path }));

  app.use((err, req, res, _next) => {
    const status = err.status || 500;
    console.error(
      JSON.stringify({
        level: 'error',
        method: req.method,
        path: req.path,
        status,
        message: err.message
      })
    );
    res.status(status).json({ error: status === 500 ? 'Internal error' : err.message });
  });

  return app;
}
`;

const SERVER_INDEX = `import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});
`;

const ROUTER_INDEX = `import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8'));
const router = Router();

router.get('/version', (_req, res) => {
  res.json({ name: pkg.name, version: pkg.version });
});

// Mount feature routers below, each in its own file: router.use('/auth', authRouter);

export default router;
`;

const MIGRATE = `import 'dotenv/config';
import { readdirSync, readFileSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import pg from 'pg';

const here = dirname(fileURLToPath(import.meta.url));
const dir = join(here, 'migrations');
if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
await client.connect();
await client.query(
  'create table if not exists migrations (name text primary key, applied_at timestamptz not null default now())'
);
const applied = new Set((await client.query('select name from migrations')).rows.map((r) => r.name));
const files = readdirSync(dir).filter((f) => f.endsWith('.sql')).sort();
let count = 0;

for (const file of files) {
  if (applied.has(file)) continue;
  const sql = readFileSync(join(dir, file), 'utf8');
  await client.query('begin');
  try {
    await client.query(sql);
    await client.query('insert into migrations (name) values ($1)', [file]);
    await client.query('commit');
    count += 1;
    console.log('applied ' + file);
  } catch (error) {
    await client.query('rollback');
    console.error('failed ' + file + ': ' + error.message);
    await client.end();
    process.exit(1);
  }
}

console.log(count === 0 ? 'no pending migrations' : 'applied ' + count + ' migration(s)');
await client.end();
`;

const VITEST_CONFIG = `import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['tests/**/*.test.js'],
    setupFiles: ['tests/setup.js'],
    testTimeout: 15000,
    restoreMocks: true
  }
});
`;

const TEST_SETUP = `process.env.NODE_ENV = 'test';
process.env.APP_URL = process.env.APP_URL || 'http://localhost:3000';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-not-for-production';
`;

const HEALTH_TEST = `import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';

const app = createApp();

describe('service shell', () => {
  it('reports health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('reports version', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(typeof res.body.version).toBe('string');
  });

  it('answers unknown api routes with JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
`;

const GITIGNORE = `node_modules/
dist/
.env
.env.*
!.env.example
coverage/
*.log
.DS_Store
`;

const ESLINT_CONFIG = `import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  { ignores: ['dist', 'node_modules', 'coverage'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2023,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: { ...globals.node, ...globals.browser }
    },
    plugins: { 'react-hooks': reactHooks },
    rules: { ...reactHooks.configs.recommended.rules, 'no-unused-vars': ['error', { argsIgnorePattern: '^_' }] }
  }
];
`;

const VITE_CONFIG = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3000',
      '/health': 'http://localhost:3000'
    }
  }
});
`;

const STYLES = `:root {
  color-scheme: light;
  --ink: #0a0a0a;
  --muted: #525252;
  --line: #e5e5e5;
  --paper: #ffffff;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  margin: 0;
  background: var(--paper);
  color: var(--ink);
  font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
}

main {
  max-width: 760px;
  margin: 0 auto;
  padding: 56px 24px 96px;
}

.eyebrow {
  margin: 0 0 12px;
  font-size: 12px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--muted);
}

h1 {
  margin: 0 0 16px;
  font-family: Georgia, "Times New Roman", serif;
  font-size: 34px;
  line-height: 1.15;
}

p {
  margin: 0 0 16px;
  font-size: 15px;
  line-height: 1.6;
  color: var(--muted);
}

.status {
  display: inline-block;
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 4px 10px;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
  color: var(--ink);
}

@media (max-width: 480px) {
  main {
    padding: 32px 20px 64px;
  }

  h1 {
    font-size: 27px;
  }
}
`;

function buildIndexHtml(seed) {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${seed.title}</title>
    <link rel="stylesheet" href="/src/index.css" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

function buildMainJsx() {
  return `import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);
`;
}

function buildAppJsx(seed) {
  return `import { useEffect, useState } from 'react';

const PRODUCT = ${JSON.stringify(seed.title)};

export default function App() {
  const [status, setStatus] = useState('checking');

  useEffect(() => {
    let live = true;
    fetch('/api/version')
      .then((res) => res.json())
      .then((body) => {
        if (live) setStatus(body.name + ' ' + body.version);
      })
      .catch(() => {
        if (live) setStatus('api unreachable');
      });
    return () => {
      live = false;
    };
  }, []);

  return (
    <main>
      <p className="eyebrow">Build shell</p>
      <h1>{PRODUCT}</h1>
      <p>
        This shell boots, serves, and talks to the API. Replace its body with the routed screens in AGENTS.md
        section 6. Each screen's pass conditions are in ACCEPTANCE.md.
      </p>
      <p className="status">api: {status}</p>
    </main>
  );
}
`;
}

export function buildManifest(seed) {
  const entities = entitiesOf(seed);
  const entityRows = entities
    .map((t) => `| \`"${t.name}"\` | ${t.cols.length} columns: ${t.cols.map((c) => `\`${c}\``).join(', ')} | \`database/migrations/001_init.sql\` |`)
    .join('\n');

  return `# ${seed.title}: Repository Manifest

What ships runnable, what each agent must write, and how every piece is verified. Read this before the first command and update it when a path changes.

## 1. What already runs

These files are complete. Do not rewrite them: extend them. On a clean checkout \`npm install && npm run db:migrate && npm run db:seed && npm run verify\` is the target state.

| Path | Purpose |
| --- | --- |
| \`package.json\` | Pinned dependencies and every script in section 4. |
| \`eslint.config.js\` | Flat ESLint config covering server and React source. |
| \`vite.config.js\` | Frontend build, plus a dev proxy for \`/api\` and \`/health\`. |
| \`index.html\` | Frontend entry document. |
| \`src/main.jsx\` | React root mount. |
| \`src/App.jsx\` | Boot shell: renders and proves the API connection. Replace its body with routed screens. |
| \`src/index.css\` | Base typography and layout tokens. |
| \`server/app.js\` | Express app factory: security headers, JSON body, cookies, \`/health\`, \`/api\` mount, static \`dist\`, JSON 404 and one error handler. |
| \`server/index.js\` | Process entry: loads \`.env\`, listens on \`PORT\`. |
| \`server/routes/index.js\` | API root router with \`GET /api/version\`. Mount feature routers here. |
| \`database/migrate.js\` | Applies \`database/migrations/*.sql\` in filename order, one transaction each, recorded in \`migrations\`. Idempotent. |
| \`database/migrations/001_init.sql\` | Baseline schema: \`users\` plus every entity in section 5, each owner-scoped, indexed and touch-triggered. |
| \`database/seed.js\` | Deterministic demo dataset, re-runnable. |
| \`vitest.config.js\` | Node test runner config. |
| \`tests/setup.js\` | Test environment defaults. |
| \`tests/health.test.js\` | Three passing tests for health, version and JSON 404. Extend this suite, never delete it. |
| \`.env.example\` | Every environment variable with a one-line purpose. |
| \`.gitignore\` | Keeps \`.env\`, \`node_modules\` and \`dist\` out of git. |

## 2. Schema this pack assumes

| Table | Shape | Created in |
| --- | --- | --- |
${entityRows}
| \`users\` | \`id\`, \`email\` unique, \`full_name\`, \`password_hash\`, timestamps | \`001_init.sql\` |

Every entity table carries \`owner_id uuid not null references users(id)\` and \`updated_at\` maintained by trigger. Add a new numbered migration for any change; never edit \`001_init.sql\` after it has run anywhere.

## 3. Files each agent must write

### Data agent
| Path | Done when |
| --- | --- |
| \`database/migrations/002_*.sql\` and up | Every column the product needs exists, with the constraint that makes the wrong value impossible. |
| \`database/seed.js\` \`DATASET\` | Extending it covers any new table; \`npm run db:seed\` stays idempotent. |

### Backend agent
| Path | Done when |
| --- | --- |
| \`server/middleware/auth.js\` | \`requireAuth\` rejects a missing or invalid session with 401 and attaches the user. |
| \`server/services/*.js\` | One module per capability, each taking \`ownerId\` first and filtering on it. |
| \`server/routes/*.js\` | One router per resource, mounted in \`server/routes/index.js\`, body validated with zod. |
| \`tests/*.test.js\` | Unit test per service function and one rejection case per route. |

### Frontend agent
| Path | Done when |
| --- | --- |
| \`src/pages/*.jsx\` | All six screens in SCAFFOLD.md section 7 exist, wired to the real API. |
| \`src/components/*.jsx\` | Shared pieces under 200 lines, no screen importing another screen's internals. |
| \`src/App.jsx\` | Replaced with the router and auth gate; the boot shell body is gone. |
| \`src/api.js\` | One client reading the base URL from env, no hardcoded host. |

### Integrations agent
| Path | Done when |
| --- | --- |
| \`server/services/<vendor>.js\` | Each key read from env; a missing key degrades with a clear message instead of crashing. |

### QA agent
| Path | Done when |
| --- | --- |
| \`tests/e2e/\` or manual evidence log | Every box in ACCEPTANCE.md checked with a command transcript or observed step. |

### Release agent
| Path | Done when |
| --- | --- |
| \`DEPLOYMENT.md\` runbook, \`devpro-deploy/\` | Preview and production deploys pass with \`/health\` returning 200. |

## 4. Scripts

| Command | What it does |
| --- | --- |
| \`npm run dev\` | API with reload on \`PORT\`. |
| \`npm run dev:web\` | Vite dev server on 5173, proxying \`/api\` to 3000. |
| \`npm run build\` | Builds the frontend into \`dist/\`. |
| \`npm start\` | API serving \`dist/\` for a production smoke test. |
| \`npm test\` | Vitest suite. |
| \`npm run lint\` | ESLint over the repo. |
| \`npm run db:migrate\` | Applies pending migrations. |
| \`npm run db:seed\` | Inserts the demo dataset. |
| \`npm run verify\` | Lint, test and build in one command. CI runs this. |

## 5. Dependencies and why each exists

| Package | Version | Role | Owner |
| --- | --- | --- | --- |
| \`express\` | ^4.19.2 | HTTP server and routing. | Backend |
| \`pg\` | ^8.11.5 | Postgres driver for queries and migrations. | Data |
| \`dotenv\` | ^16.4.5 | Loads \`.env\` in the server and in scripts. | Backend |
| \`bcryptjs\` | ^2.4.3 | Password hashing, pure JS so no native build step. | Backend |
| \`jsonwebtoken\` | ^9.0.2 | Signed session token when a cookie session is not enough. | Backend |
| \`cookie-parser\` | ^1.4.6 | Reads the httpOnly session cookie. | Backend |
| \`cors\` | ^2.8.5 | Allows the Vite dev origin to call the API. | Backend |
| \`helmet\` | ^7.1.0 | Security headers. | Backend |
| \`zod\` | ^3.23.8 | Request validation at route boundaries. | Backend |
| \`react\`, \`react-dom\` | ^18.3.1 | UI runtime. | Frontend |
| \`react-router-dom\` | ^6.26.2 | Client routing for the six screens. | Frontend |
| \`vite\`, \`@vitejs/plugin-react\` | ^5.4.2, ^4.3.1 | Frontend build and dev server. | Frontend |
| \`vitest\` | ^2.0.5 | Test runner. | QA |
| \`supertest\` | ^7.0.0 | HTTP assertions against the app without binding a port. | QA |
| \`eslint\`, \`@eslint/js\`, \`globals\`, \`eslint-plugin-react-hooks\` | ^9.9.0 group | Lint gate, including hook rules. | QA |

Add a package only with the code that uses it in the same commit. Remove a package the moment its last import goes.

## 6. Services and ports

| Service | Port | Started by |
| --- | --- | --- |
| API | \`PORT\`, default 3000 | \`npm run dev\` |
| Frontend dev | 5173 | \`npm run dev:web\` |
| Postgres | 5432 | local install or \`docker compose up -d db\` |

## 7. Smoke path

Run in order. Each line states what you should see.

\`\`\`bash
npm install                                  # exits 0
cp .env.example .env                         # then fill DATABASE_URL, AUTH_SECRET, APP_URL
npm run db:migrate                           # applied 1 migration, then "no pending migrations" on a second run
npm run db:seed                              # one line per table, plus the demo credentials
npm test                                     # 3 passing tests, no database required
npm run dev                                  # listening on http://localhost:3000
curl -s localhost:3000/health                # {"ok":true,...}
curl -s localhost:3000/api/version           # {"name":"...","version":"0.1.0"}
npm run dev:web                              # open http://localhost:5173, shell shows "api: <name> 0.1.0"
npm run verify                               # lint, test and build all pass
\`\`\`

If a line fails, fix the cause before the next one. A pack is not delivered until this whole block runs clean on a fresh clone.

## 8. Report

Every agent reports, in this order: files touched, commands run with real output, what is verified by test rather than by eye, and what remains. Never claim a step passed without the output that proves it.
`;
}

export function buildAgentOrders(seed, codebase) {
  const entities = entitiesOf(seed);
  const primary = entities[0]?.name || 'items';
  const apiBase = `\`/api/${primary}\``;

  return `# ${seed.title}: Work Orders by Agent

Six agents, one contract each. An agent never edits a path outside its own section, and never marks work done without the command output that proves it. Order of execution: Data, Backend, Frontend, Integrations, QA, Release. Later agents start only when the earlier contract is signed off.

## A1 Data agent

Owns: \`database/\`.

Read first: AGENTS.md section 5, MANIFEST.md sections 1 and 2.

Tasks
1. \`001_init.sql\` ships as the baseline. Read it against AGENTS.md section 5 and list every gap: missing column, wrong type, missing uniqueness or check constraint.
2. Close each gap with a new numbered file: \`002_*.sql\`, \`003_*.sql\`. Never edit an applied migration.
3. Add the constraint that makes the bad value impossible, not a note asking people not to do it: \`not null\`, \`unique\`, \`check (amount >= 0)\`, foreign key with the right delete behaviour.
4. Index every column a query filters or sorts on, and every foreign key.
5. Extend \`DATASET\` in \`database/seed.js\` for any table you added.

Commands
\`\`\`bash
npm run db:migrate && npm run db:migrate   # second run: "no pending migrations", exit 0
npm run db:seed && npm run db:seed         # identical row counts both times
psql "$DATABASE_URL" -c '\\d+ ${primary}'  # constraints and indexes are present
\`\`\`

Handoff: a table-by-table list of the final schema, with any deliberate departure from AGENTS.md section 5 and its reason.

## A2 Backend agent

Owns: \`server/middleware/\`, \`server/services/\`, \`server/routes/\`, \`tests/\` (server tests).

Read first: MANIFEST.md sections 2 and 3, ACCEPTANCE.md sections S9 and S10.

Tasks
1. \`server/middleware/auth.js\`: \`requireAuth\` reads the session cookie, verifies it, loads the user, returns 401 with \`{ "error": "..." }\` when absent or invalid.
2. Auth routes: \`POST /api/auth/register\`, \`/login\`, \`/logout\`, \`/reset-request\`, \`/reset\`, plus \`GET /api/auth/me\`. bcryptjs with cost 12. httpOnly, sameSite lax, secure in production.
3. One service module per capability in AGENTS.md section 6. Signature \`(ownerId, input)\`. Every query filters on \`owner_id\`. The owner id never comes from the request body.
4. One router per resource under \`/api\`, mounted in \`server/routes/index.js\`, every body validated with zod and a 400 carrying field-level messages.
5. Errors: 400 invalid input, 401 no session, 403 wrong owner, 404 missing, 409 conflict, 500 unexpected. Never leak a stack trace or a hash.

Commands
\`\`\`bash
npm test                                     # auth, owner scoping and happy paths pass
curl -i localhost:3000${apiBase}             # 401 without a session
npm run lint
\`\`\`

Handoff: route table (method, path, auth required, request shape, response shape, status codes) appended to AGENTS.md.

## A3 Frontend agent

Owns: \`src/pages/\`, \`src/components/\`, \`src/api.js\`, and the body of \`src/App.jsx\`.

Read first: ACCEPTANCE.md in full, MANIFEST.md section 3, SCAFFOLD.md section 7.

Tasks
1. Replace the boot shell in \`src/App.jsx\` with the router, the auth gate and a layout. Keep \`src/main.jsx\` untouched.
2. \`src/api.js\`: one fetch wrapper reading the base URL from \`import.meta.env.VITE_API_URL\`, falling back to same-origin. It throws a typed error on non-2xx so screens can show a message instead of a blank page.
3. Build the six screens in order: landing, login, register, dashboard, create, detail, settings. Each wired to the real API, each with loading, empty, error and success states.
4. Mobile first: no horizontal scroll at 375px, primary action above the fold, tap targets at least 44px.
5. Every input has a label. Every button has an accessible name. Focus is visible.

Commands
\`\`\`bash
npm run dev:web                              # shell shows "api: <name> 0.1.0"
npm run build                                # dist/ builds clean
npm run lint
\`\`\`

Handoff: the ACCEPTANCE.md blocks S1 to S8, each box checked with the step that proved it.

## A4 Integrations agent

Owns: \`server/services/<vendor>.js\` and the matching keys in \`.env.example\`.

Read first: AGENTS.md section 7.

Tasks
1. One module per vendor, key read at call time from \`process.env\`, never a literal.
2. Missing key returns \`{ configured: false }\`; the feature using it renders a clear disabled state. It never throws on import.
3. Every call has a timeout and logs failures with the vendor name and status, never the key.
4. Add each key to \`.env.example\` with a one-line purpose.

Commands
\`\`\`bash
npm test                                     # runs with keys unset: nothing crashes
npm run dev                                  # with keys unset, features degrade with a message
\`\`\`

Handoff: vendor table (service, env keys, endpoints used, failure behaviour).

## A5 QA agent

Owns: \`tests/\` (integration and end-to-end), the ACCEPTANCE.md evidence log.

Read first: ACCEPTANCE.md, MANIFEST.md section 7.

Tasks
1. Run the smoke path in MANIFEST.md section 7 on a clean clone. Record each command and its real output.
2. Add an integration test per route: happy path, unauthenticated, wrong owner, invalid body.
3. Add the ownership test: user B requests user A's record by id and receives 404 or 403, never the record.
4. Walk every box in ACCEPTANCE.md. An unchecked box is a defect report, not a note.
5. Check 375, 768 and 1280 px. Check with the API stopped: every screen shows an error state, not a blank page.

Commands
\`\`\`bash
npm run verify                               # lint, test, build
npm test                                     # coverage of every route
\`\`\`

Handoff: the unchecked-box count, zero being the only pass, plus the command transcript.

## A6 Release agent

Owns: \`DEPLOYMENT.md\` execution, \`devpro-deploy/\`.

Tasks
1. Fill \`.env\` for the host, mirror every key in the host's environment settings.
2. Preview deploy, then run DEPLOYMENT.md section 6 checks on the preview URL.
3. Production deploy. Confirm \`/health\` returns 200 and the primary flow works on the deployed URL.
4. Confirm error logging is active and database backups are scheduled.

Commands
\`\`\`bash
./devpro-deploy/deploy.sh preview
curl -s https://<preview-host>/health
./devpro-deploy/deploy.sh production
\`\`\`

Handoff: deployed URL, health response, and the exact commit deployed.

## Shared rules

- A path appears under exactly one owner. If a change needs another owner's file, report it as a handoff request instead of editing.
- Every claim carries its output. "Tests pass" without a transcript is not a report.
- No placeholders survive: no TODO, no mock response, no control without a handler.
${codebase?.repo_name ? `\nRepository name: \`${codebase.repo_name}\`.\n` : ''}`;
}

export function buildKitFiles(seed, codebase) {
  return [
    { path: 'package.json', content: buildPackageJson(seed) },
    { path: 'eslint.config.js', content: ESLINT_CONFIG },
    { path: 'vite.config.js', content: VITE_CONFIG },
    { path: 'vitest.config.js', content: VITEST_CONFIG },
    { path: 'index.html', content: buildIndexHtml(seed) },
    { path: '.gitignore', content: GITIGNORE },
    { path: 'src/main.jsx', content: buildMainJsx() },
    { path: 'src/App.jsx', content: buildAppJsx(seed) },
    { path: 'src/index.css', content: STYLES },
    { path: 'server/app.js', content: SERVER_APP },
    { path: 'server/index.js', content: SERVER_INDEX },
    { path: 'server/routes/index.js', content: ROUTER_INDEX },
    { path: 'database/migrate.js', content: MIGRATE },
    { path: 'database/migrations/001_init.sql', content: buildInitSql(seed) },
    { path: 'tests/setup.js', content: TEST_SETUP },
    { path: 'tests/health.test.js', content: HEALTH_TEST },
    { path: 'MANIFEST.md', content: buildManifest(seed) },
    { path: 'AGENT_ORDERS.md', content: buildAgentOrders(seed, codebase) }
  ];
}