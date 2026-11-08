// Assembles the complete generated application: root config, package manifest and the
// hand-off documents (MANIFEST, AGENT_ORDERS) that describe what ships and who extends it.
import { entityModel, primaryEntity, sqlColumn } from '@/lib/kit/model';
import { appSlug, buildEnvExample, buildSeedScript } from '@/lib/scaffoldKit';
import { buildMigrateScript } from '@/lib/kit/db';
import { buildServerFiles } from '@/lib/kit/server';
import { buildClientFiles } from '@/lib/kit/client';
import { buildTestFiles } from '@/lib/kit/tests';
import { normalizeBrand, buildBrandFiles } from '@/lib/kit/brand';
import {
  buildReadme,
  buildUserGuide,
  buildTechnicalGuide,
  buildVerifyScript
} from '@/lib/kit/docs';

function buildPackageJson(seed) {
  const pkg = {
    name: appSlug(seed),
    private: true,
    version: '1.0.0',
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
      verify: 'npm run lint && npm test && npm run build',
      'verify:full': 'bash verify.sh'
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

const MAIN_JSX = `import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);
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

function buildIndexHtml(seed, brand) {
  const description = (brand.tagline || seed.gap || seed.solution || seed.title || '').replace(/"/g, '').slice(0, 150);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${brand.name}</title>
    <meta name="description" content="${description}" />
    <meta name="theme-color" content="${brand.primary}" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${brand.name}" />
    <meta property="og:title" content="${brand.name}" />
    <meta property="og:description" content="${description}" />
${brand.logo ? `    <meta property="og:image" content="${brand.logo}" />\n    <link rel="icon" href="${brand.logo}" />\n` : ''}  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
}

export function buildManifest(seed) {
  const entities = entityModel(seed);
  const primary = primaryEntity(seed);
  const entityRows = entities
    .map(
      (entity) =>
        `| \`"${entity.key}"\` | ${entity.fields.length} fields: ${entity.fields
          .map((f) => `\`${f.name}\` (${f.type})`)
          .join(', ')} | \`001_init.sql\` | ${entity.key === primary.key ? 'Interface, yes' : 'API only'} |`
    )
    .join('\n');

  return `# ${seed.title}: Repository Manifest

The application in this folder is finished. It authenticates, persists, scopes every row to its owner, renders every screen, and passes its own test suite on a clean checkout. This file is the map: what exists, what each path does, what it depends on, and how it is proven.

## 1. What is already built

| Area | Paths | State |
| --- | --- | --- |
| HTTP server | \`server/app.js\`, \`server/index.js\` | Complete. Middleware order, health, static build, JSON 404, one error handler. |
| Collections API | \`server/routes/records.js\`, \`server/services/records.js\` | Complete. Five owner-scoped routes per collection, column allowlist, validation. |
| Authentication | \`server/routes/auth.js\`, \`server/services/auth.js\`, \`server/middleware/auth.js\` | Complete. Register, login, logout, profile, reset. |
| Schema and migrations | \`database/\` | Complete. Baseline SQL, idempotent runner, deterministic seed. |
| Interface | \`src/\` | Complete. Landing, register, sign in, dashboard, create, detail, settings, not found. |
| Tests | \`tests/\` | Complete. Five suites. |
| Full run | \`verify.sh\` | Complete. Install through live probe, failing loudly. |
| Hand-off docs | \`README.md\`, \`USER_GUIDE.md\`, \`TECHNICAL_GUIDE.md\` | Complete. |

## 2. Every path

| Path | Purpose |
| --- | --- |
| \`package.json\` | Pinned dependencies and the scripts in section 5. |
| \`eslint.config.js\` | Flat config for server and React source. |
| \`vite.config.js\`, \`index.html\`, \`src/main.jsx\` | Frontend build and mount. |
| \`vitest.config.js\`, \`tests/setup.js\` | Test runner and environment defaults. |
| \`server/schema.js\` | Generated collection metadata: fields, labels, types, required flags. |
| \`server/app.js\` | App factory: helmet, cors, json, cookies, \`/health\`, \`/api\`, static \`dist\`, 404, errors. |
| \`server/index.js\` | Loads \`.env\` and listens on \`PORT\`. |
| \`server/db.js\` | Pool and \`query\`. |
| \`server/wrap.js\` | Passes async route failures to the error handler. |
| \`server/middleware/auth.js\` | Session signing, cookie options, \`requireAuth\`. |
| \`server/services/auth.js\` | Register, login, profile, reset. |
| \`server/services/records.js\` | Owner-scoped CRUD with a column allowlist. |
| \`server/routes/index.js\` | API root: \`/version\`, mounts auth and collections. |
| \`server/routes/auth.js\`, \`server/routes/records.js\` | HTTP layer per area. |
| \`database/migrations/001_init.sql\` | \`users\` plus every collection, with indexes and \`updated_at\` triggers. |
| \`database/migrate.js\` | Applies pending migrations once each, one transaction per file. |
| \`database/seed.js\` | Demo dataset: one owner with three rows per collection, one empty account. |
| \`src/index.css\` | Design tokens and every shared class. |
| \`src/brand.js\`, \`brand/BRAND.md\` | Brand name, tagline, logo, palette and type, generated from the operator's brand kit. |
| \`src/api.js\` | Fetch wrapper: credentials included, typed errors carrying \`status\` and \`fields\`. |
| \`src/auth.jsx\` | Session provider and \`useAuth\`. |
| \`src/schema.js\` | Client view of the collection plus \`titleOf\`. |
| \`src/App.jsx\` | Routes, auth gate, layout. |
| \`src/components/Shell.jsx\` | Top bar, navigation, sign out. |
| \`src/components/StateBlock.jsx\` | Loading, error-with-retry and empty states. |
| \`src/components/RecordForm.jsx\` | Metadata-driven form for any collection. |
| \`src/pages/Landing.jsx\` | Public entry with one primary action. |
| \`src/pages/Login.jsx\`, \`src/pages/Register.jsx\` | Credential screens with inline errors. |
| \`src/pages/Reset.jsx\` | Request a reset token, then choose a new password. |
| \`src/pages/Dashboard.jsx\` | Owner's rows, count, empty state, retry. |
| \`src/pages/RecordNew.jsx\` | Create screen. |
| \`src/pages/RecordDetail.jsx\` | Read, inline edit, delete, not-found. |
| \`src/pages/Settings.jsx\` | Name change, session, sign out. |
| \`src/pages/NotFound.jsx\` | Unknown route. |
| \`tests/health.test.js\` | Shell endpoints and JSON 404. |
| \`tests/auth-guard.test.js\` | 401 without a session, and with a forged cookie. |
| \`tests/validation.test.js\` | 400 with field messages, no stack trace leaked. |
| \`tests/schema.test.js\` | Metadata invariants. |
| \`tests/ownership.test.js\` | Two-account isolation, when \`DATABASE_URL_TEST\` is set. |
| \`verify.sh\` | The full run in section 7. |

## 3. Data model

| Collection | Shape | Migration | Screens |
| --- | --- | --- | --- |
${entityRows}

\`users\`: \`id\`, \`email\` unique, \`full_name\`, \`password_hash\`, \`reset_token\`, \`reset_expires\`, timestamps.
Every collection row carries \`owner_id uuid not null references users(id) on delete cascade\`; \`updated_at\` is maintained by trigger.

## 4. Dependencies

| Package | Version | Role |
| --- | --- | --- |
| \`express\` | ^4.19.2 | HTTP server, routing, middleware. |
| \`pg\` | ^8.11.5 | Parameterised queries and migrations. |
| \`dotenv\` | ^16.4.5 | \`.env\` loading in server and scripts. |
| \`bcryptjs\` | ^2.4.3 | Password hashing, cost 12, no native build. |
| \`jsonwebtoken\` | ^9.0.2 | Signed session cookie. |
| \`cookie-parser\` | ^1.4.6 | Reads the httpOnly session cookie. |
| \`cors\` | ^2.8.5 | Allows the Vite dev origin. |
| \`helmet\` | ^7.1.0 | Security headers. |
| \`zod\` | ^3.23.8 | Route-boundary validation. |
| \`react\`, \`react-dom\` | ^18.3.1 | UI runtime. |
| \`react-router-dom\` | ^6.26.2 | Six routes plus not-found. |
| \`vite\`, \`@vitejs/plugin-react\` | ^5.4.2, ^4.3.1 | Build and dev server. |
| \`vitest\` | ^2.0.5 | Test runner. |
| \`supertest\` | ^7.0.0 | HTTP assertions without a bound port. |
| \`eslint\`, \`@eslint/js\`, \`globals\`, \`eslint-plugin-react-hooks\` | ^9.9.0 group | Lint gate. |

Add a package only with the code that imports it, and remove it with the last import.

## 5. Scripts

| Command | What it does |
| --- | --- |
| \`npm run dev\` | API with reload. |
| \`npm run dev:web\` | Vite on 5173, proxying \`/api\` to 3000. |
| \`npm run build\` | Builds the interface into \`dist/\`. |
| \`npm start\` | Serves \`dist/\` and the API from one process. |
| \`npm test\` | Five suites. |
| \`npm run lint\` | ESLint over the repo. |
| \`npm run db:migrate\` | Applies pending migrations. |
| \`npm run db:seed\` | Inserts the demo dataset. |
| \`npm run verify\` | Lint, test, build. |
| \`npm run verify:full\` | \`verify.sh\`: the whole run including a live probe. |

## 6. Services and ports

| Service | Port | Started by |
| --- | --- | --- |
| API | \`PORT\`, default 3000 | \`npm run dev\` |
| Interface dev | 5173 | \`npm run dev:web\` |
| Postgres | 5432 | local install or \`docker compose up -d db\` |

## 7. The full run

\`\`\`bash
./verify.sh
\`\`\`

1. Install dependencies.
2. \`npm run lint\` passes.
3. \`npm test\` passes.
4. \`npm run build\` produces \`dist/\`.
5. With \`DATABASE_URL\` set: migrate, migrate again (asserted to be a no-op), seed.
6. Boot \`server/index.js\` on port 3999, poll \`/health\` until it answers.
7. Assert \`{"ok":true}\` and a JSON \`/api/version\`.
8. Assert an unauthenticated collection read returns 401.

Any failure exits non-zero with the step name. A build is handed off only after this prints \`PASS\`.

Manual smoke path, if you want the same thing by hand:

\`\`\`bash
npm install
cp .env.example .env
npm run db:migrate
npm run db:seed
npm run dev &
curl -s localhost:3000/health
curl -s localhost:3000/api/version
npm run dev:web
\`\`\`

## 8. Who owns what from here

| Agent | Paths | First job |
| --- | --- | --- |
| Data | \`database/\` | Confirm the baseline against the business rules; add \`002_*.sql\` for what is missing. |
| Backend | \`server/\` | Verify each route against the API reference; extend a service rather than a screen. |
| Frontend | \`src/\` | Verify the six screens against \`ACCEPTANCE.md\`; add a screen when the product needs one. |
| Integrations | \`server/services/\` | Add vendor modules behind env keys; degrade clearly when a key is missing. |
| QA | \`tests/\`, \`ACCEPTANCE.md\` | Run \`verify.sh\`, then check every box with evidence. |
| Release | \`DEPLOYMENT.md\`, \`devpro-deploy/\` | Preview, verify on the preview URL, promote, roll back on failure. |

## 9. Report rules

Every agent reports files touched, commands run with real output, what is proven by test rather than by eye, and what remains. No claim without the output behind it.
`;
}

export function buildAgentOrders(seed, codebase) {
  const entities = entityModel(seed);
  const primary = primaryEntity(seed);
  const collection = '/api/records/' + primary.key;

  return `# ${seed.title}: Work Orders by Agent

The application ships complete. An agent's job is to verify its slice against evidence, then extend it without breaking the rest. Six agents, one contract each, and a path belongs to exactly one of them.

## A0 Everyone, before anything

\`\`\`bash
npm install
cp .env.example .env      # DATABASE_URL, AUTH_SECRET (openssl rand -hex 32), APP_URL
./verify.sh               # must print PASS before you change a line
\`\`\`

Read \`README.md\`, \`MANIFEST.md\`, \`USER_GUIDE.md\` and \`TECHNICAL_GUIDE.md\`. If \`verify.sh\` fails on a clean checkout, that is the first defect, and the cause is yours to find before any feature work.

## A1 Data agent

Owns \`database/\`. Read \`TECHNICAL_GUIDE.md\` section 4.

Verify
1. \`npm run db:migrate\` then again: the second run prints \`no pending migrations\`.
2. \`npm run db:seed\` twice: row counts are identical, no duplicates.
3. Every collection has \`owner_id\` indexed and an \`updated_at\` trigger.

Extend
1. Compare the baseline with the business rules in AGENTS.md section 5 and list each gap.
2. Close a gap in a new numbered file. Never edit a migration that has run.
3. Prefer a constraint over a convention: \`not null\`, \`unique\`, \`check\`, foreign key with the right delete behaviour.
4. Mirror any new table in \`database/seed.js\` \`DATASET\`.

Done when: both runs above pass on an empty database, and \`\\d+ "${primary.key}"\` shows the indexes and trigger.

## A2 Backend agent

Owns \`server/\`. Read \`TECHNICAL_GUIDE.md\` sections 5 to 8.

Verify
1. \`curl -i $APP_URL${collection}\` returns 401 without a session.
2. Register, list, create, read, patch and delete work with the seeded account.
3. \`npm test\` passes. \`DATABASE_URL_TEST=... npm test\` passes, including isolation.

Extend
1. A new capability is a service module first, a route second. Signature \`(ownerId, input)\`.
2. Every query filters on \`owner_id\`; the owner never comes from the request.
3. Validate bodies with zod at the route and map failures through the existing 400 handler.
4. Keep status codes as documented: 400, 401, 404, 409, 500.

Done when: the route table in the technical guide matches the code, and both test commands pass.

## A3 Frontend agent

Owns \`src/\`. Read \`ACCEPTANCE.md\` in full.

Verify
1. Every route reachable: \`/\`, \`/login\`, \`/register\`, \`/reset\`, \`/app\`, \`/app/new\`, \`/app/:id\`, \`/settings\`.
2. Each shows loading, empty, error and success states; the error state has a working retry.
3. At 375 px: no horizontal scroll, primary action above the fold, tap targets at least 40 px.
4. Signed out, every \`/app*\` and \`/settings\` route redirects to \`/login\`.

Extend
1. New screen: one file in \`src/pages/\`, one route in \`src/App.jsx\`, its criteria in \`ACCEPTANCE.md\`.
2. Render from metadata in \`src/schema.js\` instead of hardcoding field names.
3. Never call \`fetch\` directly: go through \`src/api.js\` so errors keep their \`status\` and \`fields\`.

Done when: every S1 to S8 box is checked with the step that proved it, and \`npm run build\` is clean.

## A4 Integrations agent

Owns \`server/services/\` vendor modules and their keys in \`.env.example\`.

Verify: with keys unset, the app still boots, \`npm test\` still passes, and the feature that needs the key reports itself as not configured.

Extend
1. One module per vendor, key read at call time from \`process.env\`.
2. Timeout every outbound call; log vendor and status, never the key.
3. Add each key to \`.env.example\` with a one-line purpose.

Done when: missing keys degrade, present keys work, and nothing secret reaches the bundle.

## A5 QA agent

Owns \`tests/\` and the \`ACCEPTANCE.md\` evidence log.

Verify
1. \`./verify.sh\` prints PASS.
2. \`DATABASE_URL_TEST=... npm test\`: the two-account isolation suite passes.
3. Every \`ACCEPTANCE.md\` box walked, none checked from the code alone.
4. With the API stopped, every data screen shows an error state, not a blank page.

Extend: an integration test per route — happy path, unauthenticated, wrong owner, invalid body.

Done when: unchecked boxes are zero and the transcript is attached to the hand-off.

## A6 Release agent

Owns \`DEPLOYMENT.md\` execution and \`devpro-deploy/\`.

Verify: \`npm run build && npm start\` serves the built interface and \`/health\` answers 200 on the production port.

Extend: preview deploy, run the post-deploy checks, promote, keep the previous build as the rollback.

Done when: the deployed URL answers \`/health\` 200, the primary flow works on it, and the commit is recorded.

## Shared rules

- A path belongs to one owner. Needing another owner's file is a hand-off request, not an edit.
- Do not weaken a guard to make a screen easier: fix the screen.
- Never delete a test to pass a phase. Fix the cause.
- Every claim carries its output.
${codebase?.repo_name ? `\nRepository name: \`${codebase.repo_name}\`.\n` : ''}`;
}

export function buildKitFiles(seed, codebase, brandKit) {
  const brand = normalizeBrand(brandKit, seed);
  return [
    { path: 'package.json', content: buildPackageJson(seed) },
    { path: 'eslint.config.js', content: ESLINT_CONFIG },
    { path: 'vite.config.js', content: VITE_CONFIG },
    { path: 'vitest.config.js', content: VITEST_CONFIG },
    { path: 'index.html', content: buildIndexHtml(seed, brand) },
    { path: '.gitignore', content: GITIGNORE },
    { path: 'src/main.jsx', content: MAIN_JSX },
    { path: '.env.example', content: buildEnvExample(seed) },
    { path: 'database/migrate.js', content: buildMigrateScript() },
    { path: 'database/seed.js', content: buildSeedScript(seed) },
    ...buildBrandFiles(seed, brand),
    ...buildClientFiles(seed, brand),
    ...buildServerFiles(seed),
    ...buildTestFiles(seed),
    { path: 'README.md', content: buildReadme(seed) },
    { path: 'USER_GUIDE.md', content: buildUserGuide(seed) },
    { path: 'TECHNICAL_GUIDE.md', content: buildTechnicalGuide(seed) },
    { path: 'MANIFEST.md', content: buildManifest(seed) },
    { path: 'AGENT_ORDERS.md', content: buildAgentOrders(seed, codebase) },
    { path: 'verify.sh', content: buildVerifyScript(seed), executable: true }
  ];
}

export { sqlColumn };