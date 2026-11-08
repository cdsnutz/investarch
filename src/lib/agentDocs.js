// Deterministic build documents for an AI coding agent, generated from the seed blueprint and scaffold.
const list = (arr) => (arr || []).map((x) => `- ${x}`).join('\n') || '- Not specified; choose a mainstream, well-documented stack.';

export function buildAgentReadme(seed, codebase) {
  const bp = seed.blueprint || {};
  const tree = (codebase?.files || []).map((f) => `- \`${f.path}\``).join('\n') || '- No scaffold files exported. Create the project from scratch using the stack below.';
  return `# ${seed.title}: Build Brief for an AI Coding Agent

Read this file in full before writing code. It is the single source of truth for scope. Build the complete, working application described here on top of the scaffold in \`Codebase/\`. Do not stop at stubs.

\`SCAFFOLD.md\` is the execution order for that build: bootstrap, port the scaffold, data, auth, core logic, screens, integrations, tests, and the finish checklist. Follow it step by step and run every check it names.

## 1. Problem
${seed.gap || ''}
${seed.pain_signal ? `\nObserved pain signal: ${seed.pain_signal}` : ''}

## 2. Solution
${seed.solution || ''}

## 3. Execution Plan
${seed.mini_plan || 'Derive milestones from sections 2 and 5.'}

## 4. Tech Stack
${list(bp.tech_stack)}

## 5. Data Model
\`\`\`
${bp.db_schema || 'Derive entities from the core logic below. Every table needs id, created_at, updated_at and an owner reference.'}
\`\`\`

## 6. Core Logic
${bp.core_logic || 'Implement the solution in section 2 as the primary user flow.'}
${seed.ecosystem_interlocks ? `\n## 7. Integrations\n${seed.ecosystem_interlocks}\n` : ''}
## Scaffold Contents
${tree}

## Agent Operating Rules
1. Inspect every scaffold file first, then execute \`SCAFFOLD.md\` sections 2 to 11 in order. Extend the scaffold; do not rewrite working parts without cause.
2. Implement every entity in section 5 with create, read, update and delete paths, plus input validation at API boundaries.
3. Implement authentication and owner-scoped data access before any feature screen.
4. Build every flow end to end: UI, API, persistence, loading, empty and error states.
5. Keep secrets in environment variables. Commit a \`.env.example\` listing every key with a one-line purpose.
6. Write tests for the core logic in section 6. All tests must pass before deployment.
7. Follow \`ROADMAP.md\` phase by phase. Apply the skills in \`.agent/skills/\` (antislop) to all code, UI and copy.
8. Ship with \`./devpro-deploy/deploy.sh\` per \`DEPLOYMENT.md\`. Update this file if scope changes.

## Definition of Done
- The app installs with one command and starts with one command.
- Every feature in sections 2 and 6 is reachable from the UI and persists data.
- Lint, type checks and tests pass.
- The app is deployed per \`DEPLOYMENT.md\` and the health check returns 200.
`;
}

export function buildDeploymentGuide(seed) {
  const stack = (seed.blueprint?.tech_stack || []).join(', ') || 'the stack named in AGENTS.md';
  return `# ${seed.title}: Deployment Guide

Target stack: ${stack}.

## 1. Prerequisites
- Node.js 20 LTS or the runtime required by the stack
- Git, and an account on the chosen host (Vercel, Render, Fly.io or Railway)
- A managed Postgres instance (Neon, Supabase or the host's own) unless the stack specifies otherwise

## 2. Environment
1. Copy \`.env.example\` to \`.env\`.
2. Set \`DATABASE_URL\`, \`AUTH_SECRET\` (32+ random bytes) and \`APP_URL\`.
3. Set every third-party key named in AGENTS.md section 7.
4. Mirror the same variables in the host's environment settings. Never commit \`.env\`.

## 3. Local Verification
\`\`\`bash
npm install
npm run db:migrate   # or the stack's migration command
npm test
npm run build
npm start
\`\`\`
Confirm \`GET /health\` returns 200 before deploying.

## 4. Production Deploy
1. Push the repository to GitHub.
2. Connect the repository to the host and select the production branch.
3. Build command: \`npm run build\`. Start command: \`npm start\`.
4. Run migrations against the production database as a release step.
5. Attach the custom domain and enforce HTTPS.

## 5. CI
Add a pipeline that runs install, lint, test and build on every pull request, and deploys on merge to the production branch.

## 6. Post-Deploy Checks
- Health check returns 200.
- Sign up, sign in and complete the primary flow from AGENTS.md section 6.
- Error logging and uptime monitoring are active.
- Database backups are scheduled daily.

## 7. Rollback
Redeploy the previous successful build from the host dashboard. Reverse the latest migration only if it is backward-incompatible.
`;
}

const FILE_ROLES = [
  [/^README/i, 'Readme from the scaffold generator. Keep its run instructions accurate as you build.'],
  [/^package\.json$/i, 'Dependency manifest. Merge its dependencies into the real manifest instead of overwriting yours.'],
  [/^docker-compose/i, 'Local services (app and database). Extend it; do not delete services.'],
  [/^\.env\.template$/i, 'Key list. Every key here must exist in `.env.example` with a one-line purpose.'],
  [/^frontend\//i, 'Frontend source draft. Port into the real app shell, fixing imports to real paths.'],
  [/^backend\//i, 'Server source draft. Port into the real server structure.'],
  [/^database\//i, 'Schema draft. Convert to numbered migrations, never run as-is.']
];

function roleFor(path) {
  const hit = FILE_ROLES.find(([re]) => re.test(path));
  return hit ? hit[1] : 'Scaffold file. Read it, then port or extend it.';
}

export function buildScaffoldGuide(seed, codebase) {
  const bp = seed.blueprint || {};
  const stack = (bp.tech_stack || []).join(', ') || 'React frontend, Node.js with Express backend, Postgres';
  const files = codebase?.files || [];
  const table = files.slice(0, 24).map((f) => `| \`${f.path}\` | ${roleFor(f.path)} |`).join('\n')
    || '| none | No code scaffold was generated. Create every file from scratch using the structure in section 3. |';
  const extra = files.length > 24 ? `\nThe table lists the first 24 of ${files.length} scaffold files. Apply the same reasoning to the rest: read, port, then extend.\n` : '';

  return `# ${seed.title}: Scaffold Runbook for an AI Coding Agent

AGENTS.md defines what the product is. This file defines how to stand it up and finish it. Work top to bottom. Run every check named here and read its output. Do not start a section while the previous check fails.

## 0. Ground rules

1. Read AGENTS.md, ROADMAP.md, DEPLOYMENT.md and this file before the first command.
2. No placeholders survive the build: no TODO, no "coming soon", no endpoint returning mock data, no control without a handler.
3. Every section ends with a command. Paste its real output into your progress note. A claim of completion without output is false.
4. The app must build at the end of every section. Leave it broken and the next section compounds the damage.
5. Keep the scaffold's stack unless a real blocker forces a swap. If you swap, record the swap and the reason in AGENTS.md.

## 1. Inventory of what you were given

Target stack: ${stack}.

| Scaffold file | What it is |
| --- | --- |
${table}
${extra}
Documentation and tooling you follow rather than port: \`AGENTS.md\`, \`ROADMAP.md\`, \`DEPLOYMENT.md\`, \`.env.example\`, \`.agent/skills/*\` (antislop checklists), \`devpro-deploy/*\` (build and ship).

## 2. Bootstrap the project

\`\`\`bash
npm create vite@latest app -- --template react
cd app
npm pkg set type=module
npm i express pg dotenv bcryptjs jsonwebtoken zod
npm i -D vitest supertest nodemon eslint @eslint/js eslint-plugin-react-hooks
npm pkg set scripts.dev="node --watch server/index.js" \\
  scripts.start="node server/index.js" \\
  scripts.build="vite build" \\
  scripts.test="vitest run" \\
  scripts.lint="eslint ." \\
  scripts.db:migrate="node database/migrate.js"
mkdir -p server/routes server/services server/middleware database/migrations src/pages src/components tests
\`\`\`

If AGENTS.md section 4 names a different framework, database or package manager, substitute it here and keep the section order.

Create \`server/index.js\` with a \`GET /health\` route returning \`{"ok":true}\` and one error handler that logs and returns JSON.

Check: \`npm run dev\` starts and \`curl localhost:3000/health\` returns 200.

## 3. Port the scaffold

Order matters. Each layer must exist before the layer above it references it.

1. \`database/\`: read the schema draft, then write \`database/migrations/001_init.sql\` (section 4). Do not execute the draft directly.
2. \`backend/\` service modules: move each into \`server/services/\`. Replace every import with a real relative path that exists.
3. \`backend/\` route handlers: move into \`server/routes/\`, mount each router in \`server/index.js\`.
4. \`frontend/\`: move pages to \`src/pages/\`, components to \`src/components/\`. Point the API client at the server base URL from \`env\`, not a hardcoded host.
5. Root config: merge \`package.json\` dependencies, reconcile \`docker-compose.yml\` with the real service names, and turn \`.env.template\` into \`.env.example\`.

Porting rules:

- Endpoint path, method and payload must be identical in the client, the route and the service. Fix mismatches now, not at integration time.
- Every \`process.env\` read must appear in \`.env.example\`.
- Keep files under 200 lines; split by responsibility instead of growing a file.

Check: \`npm run build\` passes and \`node server/index.js\` boots with no missing module or undefined import.

## 4. Data layer

- One table per entity in AGENTS.md section 5. Copy the columns it names verbatim.
- Every table carries \`id uuid primary key default gen_random_uuid()\`, \`created_at timestamptz default now()\`, \`updated_at timestamptz default now()\`, and \`owner_id uuid not null references users(id)\` unless the entity is explicitly public.
- One numbered migration per change: \`001_init.sql\`, \`002_add_x.sql\`. Never edit a migration that already ran.
- Write \`database/migrate.js\` that applies pending files in order and records them in a \`migrations\` table.
- Index every \`owner_id\` and every column a filter or sort uses.

Check: run \`npm run db:migrate\` against an empty database twice; the second run applies nothing and exits 0.

## 5. Authentication, before any feature screen

- Routes: \`POST /auth/register\`, \`POST /auth/login\`, \`POST /auth/logout\`, \`POST /auth/reset-request\`, \`POST /auth/reset\`.
- Hash with bcryptjs. Session as a signed httpOnly cookie. \`GET /auth/me\` returns the current user or 401.
- \`requireAuth\` middleware on every route except health, register, login and reset.
- Every service function takes \`ownerId\` as its first argument and filters on it. Never trust an owner id from the request body.

Check: an automated test where user B requests user A's record and receives 404 or 403, not the record.

## 6. Core logic

- One service module per capability in AGENTS.md section 6, each with unit tests in \`tests/\`.
- Validate every request body with zod at the route boundary and return 400 with field-level messages.
- Long or paid operations run server-side only; no secret reaches the client bundle.

Check: \`npm test\` passes and service coverage is at or above 80%.

## 7. Screens

Build in this order, each wired to the real API:

1. \`/\` landing: what the product does and one call to action.
2. \`/login\` and \`/register\`.
3. \`/app\` dashboard: the signed-in user's records, count, and the primary action.
4. \`/app/new\`: create form for the primary entity, validated inline.
5. \`/app/:id\`: record detail with edit and delete.
6. \`/settings\`: profile and account actions.

Every screen needs loading, empty, error and success states. Responsive at 375px, 768px and 1280px. A control that does nothing is a defect, not a placeholder.

Check: walk the primary flow from AGENTS.md section 6 in a browser with the console open. Zero errors, data persists across a refresh.

## 8. Integrations and configuration

- Each service in AGENTS.md section 7 sits behind one module that reads its key from \`env\`.
- Missing key yields a clear runtime message and a disabled feature, not a crash.
- Add every key to \`.env.example\` with a one-line purpose.

Check: start with the key unset (feature degrades with a clear message), then with it set (feature works).

## 9. Tests

- Unit: every service function, including a rejection case.
- Integration: auth, owner scoping, and one happy path per route with supertest.
- Keep tests deterministic: no network, no sleeps, seeded fixtures per test.

Check: \`npm run lint && npm test && npm run build\` all pass.

## 10. Run it locally

\`\`\`bash
cp .env.example .env
# fill DATABASE_URL, AUTH_SECRET (openssl rand -hex 32), APP_URL
npm run db:migrate
npm test
npm run build
npm run start
\`\`\`

Expect \`GET /health\` to return 200 and the primary flow to work end to end.

## 11. Finish checklist

Do not report the build as complete until every line is true.

- [ ] Every entity in AGENTS.md section 5 is creatable, readable, updatable and deletable from the UI.
- [ ] Every read and write is owner-scoped and proven by a test.
- [ ] Register, login, logout and password reset work; session survives a refresh; logout clears it.
- [ ] Every flow in AGENTS.md section 6 is reachable from the UI and persists.
- [ ] Loading, empty, error and success states exist on every data screen.
- [ ] \`npm run lint\`, \`npm test\`, \`npm run build\` pass with no new warnings.
- [ ] \`.env.example\` covers every \`process.env\` read.
- [ ] \`grep -rn "TODO\\|FIXME\\|coming soon\\|lorem" src server\` returns nothing.
- [ ] antislop-code, antislop-ui, antislop-layoutmobile and antislop-copywriting checklists applied and findings fixed.
- [ ] Deployed per DEPLOYMENT.md; production health check 200; primary flow verified on the deployed URL.

## 12. Report back

State, in this order: files created and their purpose, commands run with their real results, any departure from AGENTS.md with its reason, and what remains out of scope. Never mark a step complete without the output that proves it.
`;
}