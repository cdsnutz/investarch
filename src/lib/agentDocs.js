// Deterministic build documents for an AI coding agent, generated from the seed blueprint and scaffold.
import { parseTables, appSlug } from '@/lib/scaffoldKit';
import { buildKitFiles } from '@/lib/buildKit';
const list = (arr) => (arr || []).map((x) => `- ${x}`).join('\n') || '- Not specified; choose a mainstream, well-documented stack.';

export function buildAgentReadme(seed, codebase) {
  const bp = seed.blueprint || {};
  const built = buildKitFiles(seed, codebase);
  const tree = built.map((f) => `- \`${f.path}\``).join('\n');
  const drafts = (codebase?.files || []).map((f) => `- \`${f.path}\` (reference draft)`).join('\n') || '- None.';
  return `# ${seed.title}: Build Brief for an AI Coding Agent

Read this file in full before writing code. It is the single source of truth for scope.

The application described here is already built in \`Codebase/\`: authentication, owner-scoped persistence, every screen, migrations, seed data, tests and hand-off documentation. It runs and passes its own full run as delivered. This brief is the specification it was built against, and the contract for every change after it.

\`USER_GUIDE.md\` is what the product does for its users. \`TECHNICAL_GUIDE.md\` is how it is put together, endpoint by endpoint. \`MANIFEST.md\` maps every path to its purpose and its owning agent.

\`SCAFFOLD.md\` is the order to change things in, with a command check after each step. Run \`./verify.sh\` first: if the delivered application does not pass its own run, that is the only defect worth fixing.

\`ACCEPTANCE.md\` holds the pass conditions for each screen. A screen is not finished because it renders: it is finished when every box in its block is checked against observed behaviour.

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
## What ships in Codebase/

Runnable application:

${tree}

Build-pod drafts, kept for intent only. They are already reconciled into \`server/\` and \`src/\`; do not port them again:

${drafts}

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

The application is complete and already runs: \`package.json\`, \`server/\` (auth, owner-scoped collections, validation), \`src/\` (six screens plus not found), \`database/\` (baseline migration, runner, seed), \`tests/\` and \`verify.sh\`. Do not scaffold a new project on top of it and do not rebuild what is there.

\`\`\`bash
npm install
cp .env.example .env            # fill DATABASE_URL, AUTH_SECRET (openssl rand -hex 32), APP_URL
./verify.sh                     # install, lint, test, build, migrate, seed, boot, probe
npm run dev                     # listening on http://localhost:3000
curl -s localhost:3000/health   # {"ok":true,...}
npm run dev:web                 # http://localhost:5173
\`\`\`

\`MANIFEST.md\` lists every dependency, path and script with its purpose, and states which agent writes which file. \`AGENT_ORDERS.md\` holds one work contract per agent: owned paths, tasks, commands and hand-off evidence.

If AGENTS.md section 4 names a different framework, database or package manager, substitute it here and keep the section order.

Check: \`npm test\` passes and \`curl localhost:3000/health\` returns 200 before you write any feature code.

## 3. Reference drafts

The \`backend/\`, \`frontend/\` and \`database/\` drafts in this folder were the build pod's proposal. They are already reconciled into \`server/\`, \`src/\` and \`database/migrations/\`, and the working application is the authority. Read a draft only to recover intent that did not make it into the code, then implement that intent in the real files. Never port a draft over working code.

Rules for changing what exists:

- Endpoint path, method and payload must be identical in the client, the route and the service. Fix mismatches now, not at integration time.
- Every \`process.env\` read must appear in \`.env.example\`.
- Keep files under 200 lines; split by responsibility instead of growing a file.

Check: \`npm run build\` passes and \`node server/index.js\` boots with no missing module or undefined import.

## 4. Data layer

- \`database/migrations/001_init.sql\` already holds the baseline: \`users\` plus every entity in AGENTS.md section 5, owner-scoped, indexed, with an \`updated_at\` trigger. Read it against section 5 and close every gap in \`002_*.sql\`.
- One table per entity in AGENTS.md section 5. Copy the columns it names verbatim.
- Every table carries \`id uuid primary key default gen_random_uuid()\`, \`created_at timestamptz default now()\`, \`updated_at timestamptz default now()\`, and \`owner_id uuid not null references users(id)\` unless the entity is explicitly public.
- One numbered migration per change: \`001_init.sql\`, \`002_add_x.sql\`. Never edit a migration that already ran.
- Write \`database/migrate.js\` that applies pending files in order and records them in a \`migrations\` table.
- Index every \`owner_id\` and every column a filter or sort uses.

Check: run \`npm run db:migrate\` against an empty database twice; the second run applies nothing and exits 0.

### Demo dataset

\`database/seed.js\` ships with this pack. It inserts a demo user with three rows in every table it can match, plus a second account with no rows for the ownership test. The row values are drawn from this dossier, not invented.

\`\`\`bash
npm run db:seed
\`\`\`

- Run it after migrations and after the auth tables exist.
- The \`USERS\` map at the top of the file is its only schema knowledge. Edit those four names if your tables differ.
- It deletes the demo user's rows before inserting, so re-running is safe.
- The \`DATASET\` constant holds the actual rows. Extend it there instead of adding fixtures elsewhere.

Check: \`npm run db:seed\` exits 0, prints one line per table, and prints the demo credentials. Sign in with them and the dashboard shows the seeded rows.

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

All six exist and are wired to the real API. Verify them in this order, then extend:

1. \`/\` landing: what the product does and one call to action.
2. \`/login\` and \`/register\`.
3. \`/app\` dashboard: the signed-in user's records, count, and the primary action.
4. \`/app/new\`: create form for the primary entity, validated inline.
5. \`/app/:id\`: record detail with edit and delete.
6. \`/settings\`: profile and account actions.

Every screen needs loading, empty, error and success states. Responsive at 375px, 768px and 1280px. A control that does nothing is a defect, not a placeholder.

Each screen's pass conditions are in \`ACCEPTANCE.md\`, one block per screen. Work screen by screen: build it, check its block against observed behaviour, and only then move on. A screen with unchecked boxes is unfinished work, not a finishing touch.

Check: walk the primary flow from AGENTS.md section 6 in a browser with the console open. Zero errors, data persists across a refresh, and every box in the blocks for sections S1 to S8 is checked with evidence.

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
- [ ] \`./verify.sh\` prints PASS, including the live probe and the 401 check.
- [ ] \`npm run lint\`, \`npm test\`, \`npm run build\` pass with no new warnings.
- [ ] \`.env.example\` covers every \`process.env\` read.
- [ ] \`grep -rn "TODO\\|FIXME\\|coming soon\\|lorem" src server\` returns nothing.
- [ ] Every block in ACCEPTANCE.md is 100% checked, each box backed by an observed screen or command output.
- [ ] \`npm run db:seed\` runs twice without error, and the isolation account sees zero rows.
- [ ] antislop-code, antislop-ui, antislop-layoutmobile and antislop-copywriting checklists applied and findings fixed.
- [ ] Deployed per DEPLOYMENT.md; production health check 200; primary flow verified on the deployed URL.

## 12. Report back

State, in this order: files created and their purpose, commands run with their real results, any departure from AGENTS.md with its reason, and what remains out of scope. Never mark a step complete without the output that proves it.
`;
}

export function buildAcceptanceGuide(seed, codebase) {
  const slug = appSlug(seed);
  const tables = parseTables(seed.blueprint?.db_schema);
  const primary = tables[0]?.name || 'items';
  const tableList = (tables.length ? tables.map((t) => `\`${t.name}\``) : ['\`items\`']).join(', ');
  const demo = `demo@${slug}.example.com`;
  const other = `other@${slug}.example.com`;

  return `# ${seed.title}: Screen Acceptance Criteria

Pass conditions for every screen, written so they can be checked by observation rather than opinion. Build a screen, then check its block. A screen is finished when every box in its block is checked and you can point at the evidence: a command transcript, or the step you performed and what you saw. Never check a box you did not observe, and never edit a criterion to match what was built.

Data for every check comes from \`database/seed.js\`: sign in as \`${demo}\` with \`DemoPass123!\`. The second account \`${other}\` has no rows and exists for the ownership checks.

Tables in scope: ${tableList}.

## Global criteria

- [ ] G1 Loading, empty, error and success states all exist and are reachable through the real data path, not by editing source.
- [ ] G2 No console error or warning from app code on load, navigation or the primary action.
- [ ] G3 At 375, 768 and 1280 px: no horizontal scroll, no overlapping or clipped text, primary action visible without scrolling at 375.
- [ ] G4 Every input has a visible label; every button and link has an accessible name; focus ring visible when tabbing.
- [ ] G5 A grep for TODO, FIXME, "coming soon" and lorem across \`src\` and \`server\` returns nothing.
- [ ] G6 A failed request shows a human sentence and a retry control; it never leaves a blank screen or a spinner that never stops.

## S1 Landing: \`/\`

Purpose: state the problem and the offer, then route a visitor into the product.

- [ ] S1-A1 The headline names the problem from AGENTS.md section 1 in plain language, not the product's internal name.
- [ ] S1-A2 One primary call to action is visibly dominant; secondary actions carry visibly lower weight.
- [ ] S1-A3 Signed out the primary action leads to \`/register\`; signed in it leads to \`/app\`. Both observed.
- [ ] S1-A4 No dead links: every link and button either navigates or is absent.
- [ ] S1-A5 Content renders with a clean console and no layout shift after fonts load.

Fails if: the page is a placeholder hero that never says what the product does.

## S2 Registration: \`/register\`

Purpose: create an account that owns data from its first row.

- [ ] S2-A1 Empty submit shows field-level messages and sends no request (check the network panel).
- [ ] S2-A2 Invalid email and a password under 8 characters are both rejected with specific messages.
- [ ] S2-A3 Mismatched password confirmation is rejected before submit.
- [ ] S2-A4 An already-registered email returns an inline error naming the field, not a 500 and not a console error.
- [ ] S2-A5 Success creates the user, starts a session and lands on \`/app\` with no second login.
- [ ] S2-A6 The submit control disables while in flight and cannot be double-submitted.
- [ ] S2-A7 A typed password never appears as a DOM attribute, query string or log line.

## S3 Sign in: \`/login\`

Purpose: start a session for an existing account.

- [ ] S3-A1 The seeded credentials land on \`/app\`.
- [ ] S3-A2 Wrong password and unknown email return the same generic message; neither reveals which was wrong.
- [ ] S3-A3 Visiting \`/login\` while signed in redirects to \`/app\`.
- [ ] S3-A4 The form shows a pending state and cannot be re-submitted during the request.
- [ ] S3-A5 After reload the session persists and \`/app\` renders without a flash of the logged-out state.

## S4 Dashboard: \`/app\`

Purpose: the signed-in user's working surface.

- [ ] S4-A1 The count shown equals \`select count(*) from ${primary} where owner_id = <current user>\`.
- [ ] S4-A2 Only rows owned by the signed-in user appear. Signed in as \`${other}\`, the list is empty.
- [ ] S4-A3 The empty state explains what will appear here and carries the create action.
- [ ] S4-A4 Newest first, and that order survives a refresh.
- [ ] S4-A5 A loading state appears on first load and on refresh, and resolves within 2 seconds locally.
- [ ] S4-A6 With the API stopped the error state and a working retry appear, and the retry succeeds once the API is back.
- [ ] S4-A7 Each row opens its detail screen, and the whole row is clickable rather than only the text.

## S5 Create: \`/app/new\`

Purpose: add a row owned by the current user.

- [ ] S5-A1 Empty submit shows required-field errors and issues no request.
- [ ] S5-A2 Wrongly typed or oversized input is rejected with a field-level message, not a server 500.
- [ ] S5-A3 Success creates exactly one row owned by the current user and lands on its detail screen.
- [ ] S5-A4 The new row is on \`/app\` on return, without a hard reload.
- [ ] S5-A5 A double-click on submit creates one row, not two.
- [ ] S5-A6 Cancel returns to \`/app\` and creates nothing.

## S6 Detail: \`/app/:id\`

Purpose: read one row, then change or remove it.

- [ ] S6-A1 Every stored field renders. Empty fields are hidden or marked, never printed as undefined or null.
- [ ] S6-A2 An edited field persists and survives a full reload.
- [ ] S6-A3 \`updated_at\` changes on save; \`created_at\` does not.
- [ ] S6-A4 Delete asks for confirmation, and confirming removes the row from the list and navigates away.
- [ ] S6-A5 A non-existent id shows a not-found state with a way back.
- [ ] S6-A6 Signed in as \`${other}\`, opening this record's URL shows not-found or forbidden and leaks no field of the record.
- [ ] S6-A7 A failed save keeps the entered values on screen and shows an error; it never silently discards input.

## S7 Settings: \`/settings\`

Purpose: account self-service.

- [ ] S7-A1 The signed-in user's name and email are shown and prefilled.
- [ ] S7-A2 A valid change persists after reload.
- [ ] S7-A3 Invalid input is rejected inline before any request is sent.
- [ ] S7-A4 Sign out clears the session and lands on \`/\`; pressing back does not restore \`/app\`.

## S8 Route protection

- [ ] S8-A1 Signed out, \`/app\`, \`/app/new\`, \`/app/:id\` and \`/settings\` each redirect to \`/login\`.
- [ ] S8-A2 The attempted path is returned to after a successful sign in.
- [ ] S8-A3 A signed-out deep link never renders record content before redirecting.

## S9 API contract

Run against the local or deployed base URL.

\`\`\`bash
curl -i $APP_URL/health
curl -i -X POST $APP_URL/api/auth/register -H 'content-type: application/json' -d '{"email":"probe@example.com","password":"Passw0rd!23","fullName":"Probe"}'
curl -i $APP_URL/api/records/${primary}
\`\`\`

- [ ] S9-A1 \`/health\` returns 200 with a JSON body.
- [ ] S9-A2 Register returns 201 and a session cookie; repeating it returns 4xx, not 500.
- [ ] S9-A3 The protected list route returns 401 without a session.
- [ ] S9-A4 No response body contains a password hash, a token or an internal stack trace.

## S10 Seed and isolation

- [ ] S10-A1 \`npm run db:seed\` exits 0 and prints one result line per table.
- [ ] S10-A2 Running it twice leaves the same row counts, never duplicates.
- [ ] S10-A3 Signed in as \`${demo}\`, every seeded table shows three rows.
- [ ] S10-A4 Signed in as \`${other}\`, every seeded table shows zero rows.

## Scoring

Count the unchecked boxes. Zero unchecked is the only passing state for the primary flow in AGENTS.md section 6. Report that count in your hand-off note alongside the evidence for each global criterion.
`;
}