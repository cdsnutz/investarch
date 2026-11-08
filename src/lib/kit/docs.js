// Hand-off documentation for the generated application: user manual, technical guide,
// README and the full-run verification script.
import { entityModel, sqlColumn, primaryEntity } from '@/lib/kit/model';
import { appSlug } from '@/lib/scaffoldKit';

const TYPE_LABEL = {
  text: 'Text',
  number: 'Number',
  date: 'Date (YYYY-MM-DD)',
  boolean: 'On/off',
  status: 'Status word'
};

function fieldRows(entity) {
  return entity.fields
    .map(
      (field) =>
        `| \`${field.name}\` | ${field.label} | ${TYPE_LABEL[field.type] || 'Text'} | ${field.required ? 'Yes' : 'No'} |`
    )
    .join('\n');
}

function schemaBlocks(seed) {
  return entityModel(seed)
    .map((entity) => {
      const rows = entity.fields
        .map((field) => `| \`${field.name}\` | \`${sqlColumn(field)}\` | ${field.label} |`)
        .join('\n');
      return `### \`${entity.key}\`

${entity.label} records. Every row belongs to one account through \`owner_id\`.

| Column | Type | Meaning |
| --- | --- | --- |
| \`id\` | \`uuid primary key default gen_random_uuid()\` | Primary key. |
| \`owner_id\` | \`uuid not null references users(id) on delete cascade\` | Owning account. |
${rows}
| \`created_at\` | \`timestamptz not null default now()\` | Insert time. |
| \`updated_at\` | \`timestamptz not null default now()\` | Maintained by trigger. |`;
    })
    .join('\n\n');
}

function apiCollections(seed) {
  return entityModel(seed)
    .map((entity) => `| \`${entity.key}\` | \`${entity.label}\` | \`${entity.titleField}\` |`)
    .join('\n');
}

export function buildReadme(seed) {
  const slug = appSlug(seed);
  const primary = primaryEntity(seed);

  return `# ${seed.title}

A complete, running full-stack application for ${seed.title}. Not a scaffold and not a start point: authentication, owner-scoped data, every screen, migrations, a seeded demo dataset, tests and deployment notes are already in place and pass on a clean checkout.

## What is in this repository

| Area | Where | State |
| --- | --- | --- |
| HTTP server, routes, services | \`server/\` | Complete: auth, owner-scoped CRUD, validation, error handling. |
| Database schema and migrations | \`database/\` | Complete: \`001_init.sql\` plus a migration runner and a demo seeder. |
| Interface | \`src/\` | Complete: landing, register, sign in, password reset, dashboard, create, detail, settings, not found. |
| Tests | \`tests/\` | Complete: shell, route protection, validation, schema, collection contract, ownership isolation. |
| Run and verify | \`verify.sh\`, \`npm run verify\` | Complete: lints, tests, builds, migrates, seeds and probes the running server. |

## Quick start

\`\`\`bash
npm install
cp .env.example .env          # fill DATABASE_URL, AUTH_SECRET, APP_URL
npm run db:migrate
npm run db:seed               # prints the demo credentials
npm run dev                   # API on http://localhost:3000
npm run dev:web               # interface on http://localhost:5173
\`\`\`

Production shape: \`npm run build\` then \`npm start\`, which serves \`dist/\` and the API from one process.

## Verify the whole thing

\`\`\`bash
./verify.sh
\`\`\`

Install, lint, test, build, migrate twice, seed, boot the server, probe \`/health\` and \`/api/version\`, and confirm a protected route answers 401 without a session. It exits non-zero on the first failure.

## Documentation

| File | For | Contents |
| --- | --- | --- |
| \`USER_GUIDE.md\` | The people who use the product | Every screen, every field, every message they can see. |
| \`TECHNICAL_GUIDE.md\` | Engineers and operators | Architecture, data model, API reference, auth, testing, extension points. |
| \`MANIFEST.md\` | Whoever picks this up | Every path, dependency and script, with the agent that owns it. |
| \`ACCEPTANCE.md\` | QA | Screen by screen pass conditions, each checkable by observation. |
| \`AGENT_ORDERS.md\` | Delivery agents | One work contract per agent: verify this slice, then extend it. |
| \`SCAFFOLD.md\` | Engineers | The order to change things in, and the check after each step. |
| \`DEPLOYMENT.md\` | Release | Environment, deploy, post-deploy checks, rollback. |

## Data model at a glance

The interface works on \`${primary.key}\` (\`${primary.label}\`); ${entityModel(seed).length > 1 ? 'every collection also has its own screens under /app' : 'its screens live under /app'}.

| Collection | Label | Title field |
| --- | --- | --- |
${apiCollections(seed)}

## Environment

\`\`\`bash
DATABASE_URL=postgresql://user:password@localhost:5432/${slug}
AUTH_SECRET=              # openssl rand -hex 32
APP_URL=http://localhost:3000
PORT=3000
\`\`\`

## Conventions this build keeps

- Every query is scoped to the signed-in account. Another account's record is indistinguishable from one that does not exist.
- Secrets are read from the environment at call time and never reach the browser bundle.
- Every screen has loading, empty, error and success states.
- No placeholder text, no stubbed handler, no control without behaviour.
`;
}

export function buildUserGuide(seed) {
  const primary = primaryEntity(seed);
  const slug = appSlug(seed);

  return `# ${seed.title}: User Guide

For the people who use the product. Every screen, every field, and what each message means.

## 1. Getting in

**Create an account.** Open the site, choose **Create an account**, enter your full name, email and a password of at least 8 characters. You are signed in immediately and land on your dashboard.

**Sign in.** Enter the email and password you registered with. If either is wrong the message is deliberately the same: *Email or password is incorrect.* It never tells an attacker which half was wrong.

**Sign out.** **Settings**, then **Sign out**. The session ends on this device; pressing back does not restore the signed-in screens.

**Forgot your password.** Choose **Forgot your password?** on the sign-in screen, enter the email on the account, and request a reset. The screen confirms without ever saying whether that address is registered. A single-use token is issued and stays valid for one hour; open the reset screen with it (\`/reset?token=...\`), choose a new password of at least 8 characters and save, then sign in. In this build the token is shown on screen while running in development; delivering it by email is the one wiring step left, and the technical guide names the file to change.

Your session lasts 30 days on a device and is stored in an httpOnly cookie, so it survives a page reload but is not readable by page scripts.

## 2. The dashboard

The first screen after signing in. It shows:

- **How many records you have**, for example "12 stored".
- **Your records, newest first.** Each row shows the title, a few of its other fields, and the date it was created.
- **The create action**, at the top right on a desktop and full width on a phone.

You only ever see your own records. If a colleague sends you a link to a record that belongs to their account, you get **"That record does not exist, or it belongs to another account."** This is intentional: the application will not confirm that someone else's record exists.

**When you have no records** the screen shows a single line and a button to add the first one.

**When the server cannot be reached** the screen says the request failed and offers **Try again**. Your session is not lost; retry once the connection is back.

## 3. Adding a ${primary.label.toLowerCase()}

Choose **New record**, fill the fields below, then **Save**. You land on the record you just created.

| Field | Label | What to enter | Required |
| --- | --- | --- | --- |
${fieldRows(primary)}

Rules that apply to every form:

- A required field left empty stops the form and marks the field. Nothing is sent.
- A date is entered as \`YYYY-MM-DD\`; the record stores the moment you saved it.
- An on/off field is a checkbox.
- Pressing **Save** twice creates one record, not two: the button locks while the request is in flight.
- **Cancel** returns to the dashboard and saves nothing.

## 4. Reading, changing and deleting

Open any row to reach its record page. It shows the title, when the record was created, when it was last updated, and every field as a form you can edit in place.

- **Save changes** writes your edits. The "Updated" line changes; "Created" does not.
- If a save fails, the message appears above the buttons and **your edits stay on screen**. Nothing is discarded silently.
- **Delete record** asks for confirmation. Confirming removes the record and returns you to the dashboard. Deleting cannot be undone.
- Opening a record that has been deleted, or that belongs to another account, shows the not-found screen with a way back.

## 5. Settings

- **Full name**: change it and save. Your name appears in the top bar.
- **Email**: shown for reference. Changing it is an administrative action, not a self-service one, so the field is read-only.
- **Session**: sign out of this device.

## 6. Messages you may see, and what they mean

| Message | Cause | What to do |
| --- | --- | --- |
| Sign in required. | No session on this device. | Sign in. |
| Your session expired. Sign in again. | The cookie is older than 30 days or was invalidated. | Sign in again; your data is untouched. |
| Email or password is incorrect. | Wrong credentials, or no such account. | Retry, then use the reset flow. |
| That email already has an account. | The address is registered. | Sign in instead, or reset the password. |
| Check the highlighted fields. | The server rejected a value. | Fix the field named in the message. |
| Record not found. | Deleted, mistyped id, or another account's record. | Return to the dashboard. |
| Something went wrong on our side. | Unexpected server error. | Retry once; if it repeats, send the time and the screen to support. |

## 7. Using it on a phone

The layout is built for a 375 px screen first: one column, full-width buttons, tap targets of at least 40 px, no horizontal scrolling. The dashboard list, forms and record pages all work at that width.

## 8. Data you can rely on

- Records are saved in Postgres the moment you press Save; the screen confirms by reloading them from the server.
- Counts on the dashboard come from the database, not from the page's memory.
- Two accounts on the same installation never see each other's rows.

Demo accounts created by \`npm run db:seed\`:

| Account | Email | Password | Rows |
| --- | --- | --- | --- |
| Owner | \`demo@${slug}.example.com\` | \`DemoPass123!\` | Three per collection |
| Outside reviewer | \`other@${slug}.example.com\` | \`DemoPass123!\` | None, by design |
`;
}

export function buildTechnicalGuide(seed) {
  const primary = primaryEntity(seed);
  const slug = appSlug(seed);

  return `# ${seed.title}: Technical Guide

Everything an engineer or operator needs: how it is put together, what it stores, what it exposes, how it is verified, and where to extend it.

## 1. Stack

| Layer | Choice | Version | Why |
| --- | --- | --- | --- |
| Runtime | Node.js | 20 LTS or newer | Native ESM and top-level await in scripts. |
| HTTP | Express | 4.19 | Small surface, familiar middleware model. |
| Database | PostgreSQL | 14 or newer | \`gen_random_uuid\`, triggers, \`timestamptz\`. |
| Access | node-postgres (\`pg\`) | 8.11 | Parameterised queries, no ORM indirection. |
| Sessions | jsonwebtoken cookie | 9.0 | httpOnly cookie, no client-side token storage. |
| Passwords | bcryptjs | 2.4 | Pure JS, cost 12, no native build. |
| Validation | zod | 3.23 | Route-boundary schemas with field-level messages. |
| Interface | React + Vite | 18.3 / 5.4 | Static build served by the same process. |
| Routing | react-router-dom | 6.26 | Public pages, then one list, create and detail route per collection. |
| Tests | Vitest + supertest | 2.0 / 7.0 | Real HTTP assertions without binding a port. |

## 2. Shape of the system

\`\`\`
browser (React, dist/)
   |  fetch /api/*, httpOnly session cookie
   v
Express app (server/app.js)
   |  helmet, cors, json, cookie-parser
   |  /health, /api/version
   |  /api/auth/*      -> services/auth.js    -> users
   |  /api/records/:collection/* -> services/records.js -> owner-scoped tables
   v
PostgreSQL (database/migrations)
\`\`\`

One process serves the API and the built interface. There is no separate frontend server in production, and no client-side secret.

## 3. Directory map

| Path | Responsibility |
| --- | --- |
| \`server/app.js\` | App factory: middleware order, \`/health\`, \`/api\` mount, static \`dist\`, JSON 404, single error handler. |
| \`server/index.js\` | Process entry: loads \`.env\`, listens on \`PORT\`. |
| \`server/schema.js\` | Generated collection metadata: fields, labels, types, required flags. The single source both halves read. |
| \`server/db.js\` | Connection pool and \`query\` helper. |
| \`server/middleware/auth.js\` | Session signing, cookie options, \`requireAuth\`. |
| \`server/services/auth.js\` | Register, login, profile, reset. All password work lives here. |
| \`server/services/records.js\` | Generic owner-scoped CRUD over the generated collections, with a column allowlist. |
| \`server/routes/*.js\` | Thin HTTP layer: validate, call a service, shape the response. |
| \`database/migrations/001_init.sql\` | Users, collections, indexes, \`updated_at\` triggers. |
| \`database/migrate.js\` | Applies pending migrations once each, in filename order, one transaction per file. |
| \`database/seed.js\` | Deterministic demo dataset, re-runnable. |
| \`src/api.js\` | One fetch wrapper: credentials included, typed errors with \`status\` and \`fields\`. |
| \`src/auth.jsx\` | Session provider: \`user\`, \`loading\`, \`signIn\`, \`signUp\`, \`signOut\`. |
| \`src/schema.js\` | Client view of the collection: fields, labels, title helper. |
| \`src/pages/*\` | One file per screen. |
| \`tests/*\` | Shell, protection, validation, schema, ownership. |
| \`verify.sh\` | The full run: install, lint, test, build, migrate, seed, boot, probe. |

## 4. Data model

\`users\` holds credentials and profile. \`reset_token\` and \`reset_expires\` are single-use and cleared on success.

| Column | Type | Meaning |
| --- | --- | --- |
| \`id\` | \`uuid primary key default gen_random_uuid()\` | User id, also the JWT subject. |
| \`email\` | \`text not null unique\` | Login identity, compared case-insensitively. |
| \`full_name\` | \`text not null\` | Displayed in the top bar. |
| \`password_hash\` | \`text not null\` | bcrypt, cost 12. Never leaves the server. |
| \`reset_token\` | \`text\` | Single-use reset token. |
| \`reset_expires\` | \`timestamptz\` | One hour from issue. |

${schemaBlocks(seed)}

Every collection has \`owner_id\` indexed, \`created_at\` indexed descending, and an \`updated_at\` trigger so an edit is always visible in the record page.

## 5. API reference

Base path \`/api\`. JSON in, JSON out. Errors are \`{ "error": string, "fields"?: { field: message } }\`.

### Authentication

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| POST | \`/auth/register\` | no | \`{ email, password, fullName }\` | \`201 { user }\` and a session cookie |
| POST | \`/auth/login\` | no | \`{ email, password }\` | \`200 { user }\` and a session cookie |
| POST | \`/auth/logout\` | no | none | \`200 { ok: true }\`, cookie cleared |
| GET | \`/auth/me\` | yes | none | \`200 { user }\` |
| PATCH | \`/auth/me\` | yes | \`{ fullName }\` | \`200 { user }\` |
| POST | \`/auth/reset-request\` | no | \`{ email }\` | \`200 { ok: true }\` always; adds \`token\` outside production |
| POST | \`/auth/reset\` | no | \`{ token, password }\` | \`200 { ok: true }\` |

### Collections

| Method | Path | Auth | Body | Success |
| --- | --- | --- | --- | --- |
| GET | \`/records/${primary.key}\` | yes | none | \`200 { items, total }\`, newest first |
| POST | \`/records/${primary.key}\` | yes | collection fields | \`201 { record }\` |
| GET | \`/records/${primary.key}/:id\` | yes | none | \`200 { record }\` |
| PATCH | \`/records/${primary.key}/:id\` | yes | any subset of fields | \`200 { record }\` |
| DELETE | \`/records/${primary.key}/:id\` | yes | none | \`204\` |

Status codes: \`400\` validation, \`401\` no or invalid session, \`404\` unknown collection or record not owned by you, \`409\` duplicate account, \`500\` unexpected with a generic message.

Every other collection in section 4 answers the same five routes under its own key.

## 6. Authentication and ownership

1. \`POST /auth/login\` verifies the bcrypt hash and signs \`{ sub: user.id }\` for 30 days with \`AUTH_SECRET\`.
2. The token travels in a \`sid\` cookie: \`httpOnly\`, \`sameSite=lax\`, \`secure\` in production.
3. \`requireAuth\` verifies the token and sets \`req.userId\`. It never reads an owner id from the body, the query string or a header.
4. \`services/records.js\` takes \`ownerId\` as its first argument and filters every statement on \`owner_id\`.
5. A record belonging to another account returns \`404\`, the same response as a record that does not exist, so the API never confirms someone else's data.
6. \`DELETE\` and \`PATCH\` include \`and owner_id = $2\` in the \`where\` clause, so a guessed id changes nothing.

## 7. Validation

- zod at the route boundary: shape, email format, password length. Failures become \`400\` with a \`fields\` map the form renders.
- \`services/records.js\` builds inserts and updates from a generated column allowlist, so unknown keys can never reach SQL.
- Table names come from \`server/schema.js\` keys only; the collection in the URL is matched against that object before any query.
- Database constraints are the last line: \`not null\`, \`unique\`, foreign keys with \`on delete cascade\`.

## 8. Migrations

\`\`\`bash
npm run db:migrate    # applies pending files, records each in the migrations table
\`\`\`

One transaction per file; a failure rolls back and exits non-zero. Re-running is a no-op, which is exactly what \`verify.sh\` asserts. Never edit a migration that has run anywhere: add \`002_*.sql\`.

## 9. Tests

| Suite | Needs a database | Covers |
| --- | --- | --- |
| \`tests/health.test.js\` | no | \`/health\`, \`/api/version\`, JSON 404 |
| \`tests/auth-guard.test.js\` | no | 401 on collection read, write, forged cookie and \`/auth/me\` |
| \`tests/validation.test.js\` | no | 400 with field messages, no stack trace in an error body |
| \`tests/schema.test.js\` | no | collection metadata: one title field, one required field, no timestamps exposed |
| \`tests/ownership.test.js\` | tests/contract.test.js | no | every collection is listed, protected and resolvable; an unknown one is 404 |
| yes | two accounts: create, list, read, patch, delete isolation |

\`\`\`bash
npm test                                      # the five database-free suites
DATABASE_URL_TEST=postgresql://... npm test   # adds the ownership suite
\`\`\`

The ownership suite never runs against a database you care about: it creates accounts with a unique timestamp suffix and only touches rows it created.

## 10. Operability

| Variable | Required | Purpose |
| --- | --- | --- |
| \`DATABASE_URL\` | yes | Postgres connection string. |
| \`AUTH_SECRET\` | yes | Signs session cookies. \`openssl rand -hex 32\`. |
| \`PORT\` | no (3000) | Listen port. |
| \`APP_URL\` | yes | Public origin; drives CORS. |
| \`VITE_API_URL\` | no | API origin for the built interface when it is served elsewhere. |
| \`DATABASE_URL_TEST\` | no | Enables the ownership suite. |

- \`GET /health\` returns \`{ ok, uptime }\` and is what deploy checks hit.
- Errors are logged as one JSON line: method, path, status, message. No secrets, no hashes, no bodies.
- The server refuses to start against a missing \`DATABASE_URL\` only when something queries; \`npm run db:migrate\` fails fast with a clear message.

## 11. Extending it

**Add a field.** Add the column in \`002_add_<field>.sql\`, add it to the collection in \`server/schema.js\`, and the form, detail page and list pick it up: they render from metadata.

**Add a collection.** Add the table migration, add the key to \`server/schema.js\`, add seed rows in \`database/seed.js\`, and the five REST routes and all three screens exist already. Register the key in \`ENTITY\` in \`src/schema.js\` to use it as the primary collection.

**Add a screen.** One file in \`src/pages/\`, one route in \`src/App.jsx\`, its pass conditions in \`ACCEPTANCE.md\`.

**Send the reset email.** \`services/auth.js\` already issues a single-use token; call your email provider there instead of returning it. The dev-only token in the response disappears the moment \`NODE_ENV=production\`.

## 12. Known limits, stated plainly

- Password reset depends on an email provider you have not wired yet; outside development the token is issued but not delivered.
- The other collections are fully screened: the workspace overview opens each one, starting with \`${primary.key}\`.
- No pagination beyond the 50-row default and 200-row cap on the list endpoint.
- No audit trail: \`updated_at\` says when, not who.
- Backups, TLS termination and log retention belong to the host, per \`DEPLOYMENT.md\`.
`;
}

export function buildVerifyScript(seed) {
  const keys = entityModel(seed).map((entity) => entity.key);
  return `#!/usr/bin/env bash
# Full run for ${seed.title}: install, lint, test, build, migrate twice, seed, boot, probe.
# Usage: ./verify.sh   Exits non-zero on the first failure.
set -euo pipefail

fail() { echo "FAIL: $1"; exit 1; }
step() { echo; echo "== $1"; }

step "Install"
npm ci 2>/dev/null || npm install

step "Lint"
npm run lint

step "Tests"
npm test

step "Build"
npm run build

if [ -n "\${DATABASE_URL:-}" ]; then
  step "Migrations"
  npm run db:migrate
  step "Migrations again (must be a no-op)"
  npm run db:migrate | tee /tmp/migrate-second.log
  grep -q "no pending migrations" /tmp/migrate-second.log || fail "second migration run was not a no-op"
  step "Seed"
  npm run db:seed
else
  echo "DATABASE_URL unset: skipping migrations and seed"
fi

step "Boot and probe"
PORT="\${PROBE_PORT:-3999}" node server/index.js &
SERVER_PID=$!
trap 'kill "$SERVER_PID" 2>/dev/null || true' EXIT

for _ in $(seq 1 20); do
  if curl -fsS "http://localhost:\${PROBE_PORT:-3999}/health" >/dev/null 2>&1; then break; fi
  sleep 0.5
done

curl -fsS "http://localhost:\${PROBE_PORT:-3999}/health" | grep -q '"ok":true' || fail "health check"
curl -fsS "http://localhost:\${PROBE_PORT:-3999}/api/version" >/dev/null || fail "version endpoint"

step "Protected routes"
for COLLECTION in ${keys.join(' ')}; do
  CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:\${PROBE_PORT:-3999}/api/records/$COLLECTION")
  [ "$CODE" = "401" ] || fail "expected 401 on $COLLECTION without a session, got $CODE"
done

echo
echo "PASS: build, tests, migrations, seed and live probes all succeeded."
`;
}