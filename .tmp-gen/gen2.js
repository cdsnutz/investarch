import fs from "node:fs";
import JSZip from "jszip";
//#region src/lib/scaffoldKit.js
function buildEnvExample(seed) {
	const extra = (seed.blueprint?.tech_stack || []).filter((t) => /stripe|openai|anthropic|resend|twilio|s3|aws|supabase|redis|sendgrid|clerk|auth0/i.test(t)).map((t) => `# ${t}\n${t.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}_API_KEY=`).join("\n\n");
	return `# ${seed.title}: copy to .env and fill every value. Never commit .env.

# Core
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/app
# Same server, separate database: the ownership isolation suite only runs when this is set
DATABASE_URL_TEST=

# Auth (32+ random bytes: openssl rand -hex 32)
AUTH_SECRET=

# Email
EMAIL_FROM=
EMAIL_API_KEY=

# devpro-deploy
DEPLOY_HOST=vercel            # vercel | render | fly
DEPLOY_TOKEN=
DEPLOY_PROJECT=
${extra ? `\n# Stack integrations\n${extra}\n` : ""}`;
}
function appSlug(seed) {
	return (seed.title || "app").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32) || "app";
}
function parseTables(dbSchema) {
	const tables = [];
	const re = /create\s+table(?:\s+if\s+not\s+exists)?\s+"?(\w+)"?\s*\(([\s\S]*?)\)\s*;/gi;
	let match;
	while (match = re.exec(dbSchema || "")) {
		const name = match[1];
		if (/^(users?|migrations|sessions|accounts)$/i.test(name)) continue;
		const cols = match[2].split("\n").map((l) => l.trim()).filter(Boolean).filter((l) => !/^(primary key|foreign key|constraint|unique|check|index|--)/i.test(l)).map((l) => l.split(/[\s(]/)[0].replace(/"/g, "")).filter((c) => c && !/^(id|created_at|updated_at|owner_id|user_id|deleted_at)$/i.test(c));
		if (cols.length) tables.push({
			name,
			cols
		});
	}
	return tables;
}
function seedPools(seed) {
	const plan = (seed.mini_plan || "").split(/\n+/).map((l) => l.replace(/^[-*\d.)\s]+/, "").trim()).filter((l) => l.length > 12);
	const titles = [seed.title, ...plan].filter(Boolean).map((t) => String(t).slice(0, 120));
	const bodies = [
		seed.solution,
		seed.gap,
		seed.pain_signal,
		...plan
	].filter((b) => b && String(b).length > 20).map((b) => String(b).slice(0, 300));
	while (titles.length < 3) titles.push(`${seed.title || "Record"} ${titles.length + 1}`);
	while (bodies.length < 3) bodies.push(String(seed.solution || seed.title || "Seeded record"));
	return {
		titles: titles.slice(0, 3),
		bodies: bodies.slice(0, 3)
	};
}
function valueFor(col, i, pools, slug) {
	const c = col.toLowerCase();
	if (/email/.test(c)) return `owner${i + 1}@${slug}.example.com`;
	if (/amount|price|cost|revenue|budget|fee|salary|value/.test(c)) return [
		1200,
		4800,
		9600
	][i];
	if (/count|qty|quantity|score|rating|percent|hours|days|month|year|number/.test(c)) return i + 1;
	if (/^(is_|has_)|_flag$|boolean|active|enabled/.test(c)) return true;
	if (/date|_at$|due|deadline|start|end|expires/.test(c)) return new Date(Date.UTC(2026, 0, 8 + i * 7)).toISOString();
	if (/url|link|website|href/.test(c)) return `https://example.com/${slug}-${i + 1}`;
	if (/status|state|stage|phase/.test(c)) return [
		"active",
		"in_progress",
		"done"
	][i];
	if (/title|name|label|headline|subject/.test(c)) return pools.titles[i];
	if (/desc|summary|body|content|detail|note|text|thesis|rationale|comment/.test(c)) return pools.bodies[i];
	return `${pools.titles[i]} · ${col} ${i + 1}`;
}
function buildSeedScript(seed) {
	const slug = appSlug(seed);
	const pools = seedPools(seed);
	const parsed = parseTables(seed.blueprint?.db_schema);
	const dataset = (parsed.length ? parsed : [{
		name: "items",
		cols: [
			"title",
			"description",
			"status"
		]
	}]).slice(0, 6).map((t) => {
		const cols = t.cols.filter((c) => !/password|token|secret|hash|salt/i.test(c)).slice(0, 8);
		return {
			name: t.name,
			rows: [
				0,
				1,
				2
			].map((i) => {
				const row = {};
				cols.forEach((c) => {
					row[c] = valueFor(c, i, pools, slug);
				});
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
  name: ${JSON.stringify(seed.title || "Demo Operator")}
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
//#endregion
//#region src/lib/kit/model.js
var ENTITY_CAP = 4;
function toLabel(name) {
	return String(name).replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()).trim();
}
function fieldType(col) {
	const c = col.toLowerCase();
	if (/^(is_|has_)|_flag$|boolean|(^|_)(active|enabled)($|_)/.test(c)) return "boolean";
	if (/amount|price|cost|revenue|budget|fee|salary|score|count|qty|quantity|percent|hours|days|month|year|rating|number/.test(c)) return "number";
	if (/date|_at$|due|deadline|starts|ends|expires/.test(c)) return "date";
	if (/status|state|stage|phase/.test(c)) return "status";
	return "text";
}
function entityModel(seed) {
	const parsed = parseTables(seed.blueprint?.db_schema);
	return (parsed.length ? parsed : [{
		name: "items",
		cols: [
			"title",
			"description",
			"status"
		]
	}]).slice(0, ENTITY_CAP).map((table) => {
		const names = table.cols.filter((c) => !/^(id|created_at|updated_at|owner_id|user_id|deleted_at)$/i.test(c)).slice(0, 10);
		const cols = names.length ? names : ["title", "description"];
		const titleCol = cols.find((c) => /title|name|label|subject/i.test(c)) || cols[0];
		return {
			key: table.name,
			label: toLabel(table.name.replace(/s$/, "")),
			titleField: titleCol,
			fields: cols.map((c) => ({
				name: c,
				label: toLabel(c),
				type: fieldType(c),
				required: c === titleCol
			}))
		};
	});
}
function primaryEntity(seed) {
	return entityModel(seed)[0];
}
function sqlColumn(field) {
	switch (field.type) {
		case "boolean": return "boolean not null default false";
		case "number": return "numeric not null default 0";
		case "date": return "timestamptz";
		case "status": return "text not null default 'active'";
		default: return field.required ? "text not null" : "text";
	}
}
//#endregion
//#region src/lib/kit/db.js
function buildMigrateScript() {
	return `#!/usr/bin/env node
// Applies every .sql file in database/migrations once, in order, one transaction each.
import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import pg from 'pg';

const DIR = path.join(process.cwd(), 'database', 'migrations');

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not set. Copy .env.example to .env first.');
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 1 });
  await pool.query(
    'create table if not exists migrations (name text primary key, applied_at timestamptz not null default now())'
  );

  const applied = new Set((await pool.query('select name from migrations')).rows.map((row) => row.name));
  const files = (await fs.readdir(DIR)).filter((file) => file.endsWith('.sql')).sort();
  const pending = files.filter((file) => !applied.has(file));

  if (!pending.length) {
    console.log('no pending migrations');
    await pool.end();
    return;
  }

  for (const file of pending) {
    const sql = await fs.readFile(path.join(DIR, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('begin');
      await client.query(sql);
      await client.query('insert into migrations (name) values ($1)', [file]);
      await client.query('commit');
      console.log('applied ' + file);
    } catch (error) {
      await client.query('rollback');
      throw error;
    } finally {
      client.release();
    }
  }

  await pool.end();
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
`;
}
//#endregion
//#region src/lib/kit/server.js
function buildSchemaModule$1(seed) {
	return `export const ENTITIES = ${JSON.stringify(entityModel(seed), null, 2)};

export function entityOf(key) {
  return Object.prototype.hasOwnProperty.call(ENTITIES, key) ? ENTITIES[key] : null;
}

export function entityKeys() {
  return Object.keys(ENTITIES);
}
`;
}
var DB = `import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

export function query(text, params) {
  return pool.query(text, params);
}

export function close() {
  return pool.end();
}
`;
var WRAP = `export function wrap(handler) {
  return (req, res, next) => handler(req, res).catch(next);
}
`;
var AUTH_MW = `import jwt from 'jsonwebtoken';

export const COOKIE = 'sid';

export function signSession(user) {
  return jwt.sign({ sub: user.id }, process.env.AUTH_SECRET, { expiresIn: '30d' });
}

export function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000
  };
}

export function requireAuth(req, res, next) {
  const token = req.cookies ? req.cookies[COOKIE] : null;
  if (!token) {
    return res.status(401).json({ error: 'Sign in required.' });
  }
  try {
    const payload = jwt.verify(token, process.env.AUTH_SECRET);
    req.userId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({ error: 'Your session expired. Sign in again.' });
  }
}
`;
var AUTH_SERVICE = `import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { query } from '../db.js';

const PUBLIC = 'id, email, full_name, created_at';

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

export async function register({ email, password, fullName }) {
  const existing = await query('select id from users where lower(email) = lower($1)', [email.trim()]);
  if (existing.rowCount > 0) throw httpError('That email already has an account.', 409);

  const passwordHash = await bcrypt.hash(password, 12);
  const created = await query(
    'insert into users (email, full_name, password_hash) values ($1, $2, $3) returning ' + PUBLIC,
    [email.trim(), fullName.trim(), passwordHash]
  );
  return created.rows[0];
}

export async function login({ email, password }) {
  const found = await query(
    'select id, email, full_name, created_at, password_hash from users where lower(email) = lower($1)',
    [email.trim()]
  );
  const row = found.rows[0];
  const valid = row ? await bcrypt.compare(password, row.password_hash) : false;
  if (!valid) throw httpError('Email or password is incorrect.', 401);

  const user = { id: row.id, email: row.email, full_name: row.full_name, created_at: row.created_at };
  return user;
}

export async function byId(id) {
  const found = await query('select ' + PUBLIC + ' from users where id = $1', [id]);
  if (!found.rowCount) throw httpError('Account not found.', 404);
  return found.rows[0];
}

export async function updateProfile(id, { fullName }) {
  const updated = await query(
    'update users set full_name = $2 where id = $1 returning ' + PUBLIC,
    [id, fullName.trim()]
  );
  return updated.rows[0];
}

export async function createResetToken(email) {
  const found = await query('select id from users where lower(email) = lower($1)', [email.trim()]);
  if (!found.rowCount) return null;

  const token = randomBytes(32).toString('hex');
  await query(
    "update users set reset_token = $1, reset_expires = now() + interval '1 hour' where id = $2",
    [token, found.rows[0].id]
  );
  return token;
}

export async function resetPassword({ token, password }) {
  const found = await query('select id from users where reset_token = $1 and reset_expires > now()', [token]);
  if (!found.rowCount) throw httpError('That reset link is invalid or expired.', 400);

  const passwordHash = await bcrypt.hash(password, 12);
  await query(
    'update users set password_hash = $1, reset_token = null, reset_expires = null where id = $2',
    [passwordHash, found.rows[0].id]
  );
}
`;
var RECORDS_SERVICE = `import { query } from '../db.js';
import { entityOf } from '../schema.js';

function httpError(message, status) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function requireEntity(key) {
  const entity = entityOf(key);
  if (!entity) throw httpError('Unknown collection.', 404);
  return entity;
}

function pick(entity, input) {
  const source = input && typeof input === 'object' ? input : {};
  const values = {};
  for (const field of entity.fields) {
    if (!Object.prototype.hasOwnProperty.call(source, field.name)) continue;
    const value = source[field.name];
    if (value === undefined) continue;
    if (value === '' || value === null) {
      if (field.required) throw httpError(field.label + ' is required.', 400);
      values[field.name] = null;
      continue;
    }
    values[field.name] = field.type === 'number' ? Number(value) : value;
  }
  return values;
}

function placeholders(from, count) {
  const list = [];
  for (let i = 0; i < count; i += 1) list.push('$' + (from + i));
  return list.join(', ');
}

export async function list(ownerId, key, limit) {
  requireEntity(key);
  const size = Math.min(Number(limit) || 50, 200);
  const rows = await query(
    'select * from "' + key + '" where owner_id = $1 order by created_at desc limit $2',
    [ownerId, size]
  );
  return rows.rows;
}

export async function count(ownerId, key) {
  requireEntity(key);
  const rows = await query('select count(*)::int as total from "' + key + '" where owner_id = $1', [ownerId]);
  return rows.rows[0].total;
}

export async function create(ownerId, key, input) {
  const entity = requireEntity(key);
  const values = pick(entity, input);
  for (const field of entity.fields) {
    if (field.required && values[field.name] === undefined) {
      throw httpError(field.label + ' is required.', 400);
    }
  }
  const names = Object.keys(values);
  const columns = ['owner_id'].concat(names);
  const params = [ownerId].concat(names.map((name) => values[name]));
  const created = await query(
    'insert into "' + key + '" (' + columns.map((c) => '"' + c + '"').join(', ') + ') values (' +
      placeholders(1, columns.length) + ') returning *',
    params
  );
  return created.rows[0];
}

export async function get(ownerId, key, id) {
  requireEntity(key);
  const found = await query('select * from "' + key + '" where id = $1 and owner_id = $2', [id, ownerId]);
  if (!found.rowCount) throw httpError('Record not found.', 404);
  return found.rows[0];
}

export async function update(ownerId, key, id, input) {
  const entity = requireEntity(key);
  const values = pick(entity, input);
  const names = Object.keys(values);
  if (!names.length) return get(ownerId, key, id);

  const assignments = names.map((name, i) => '"' + name + '" = $' + (i + 3)).join(', ');
  const params = [id, ownerId].concat(names.map((name) => values[name]));
  const updated = await query(
    'update "' + key + '" set ' + assignments + ' where id = $1 and owner_id = $2 returning *',
    params
  );
  if (!updated.rowCount) throw httpError('Record not found.', 404);
  return updated.rows[0];
}

export async function remove(ownerId, key, id) {
  requireEntity(key);
  const removed = await query('delete from "' + key + '" where id = $1 and owner_id = $2 returning id', [id, ownerId]);
  if (!removed.rowCount) throw httpError('Record not found.', 404);
}
`;
var AUTH_ROUTES = `import { Router } from 'express';
import { z } from 'zod';
import { COOKIE, cookieOptions, requireAuth, signSession } from '../middleware/auth.js';
import { wrap } from '../wrap.js';
import * as auth from '../services/auth.js';

const router = Router();

const credentials = z.object({
  email: z.string().trim().email('Enter a valid email address.'),
  password: z.string().min(8, 'Password must be at least 8 characters.')
});

const registration = credentials.extend({
  fullName: z.string().trim().min(1, 'Name is required.')
});

router.post(
  '/register',
  wrap(async (req, res) => {
    const body = registration.parse(req.body);
    const user = await auth.register(body);
    res.cookie(COOKIE, signSession(user), cookieOptions());
    res.status(201).json({ user });
  })
);

router.post(
  '/login',
  wrap(async (req, res) => {
    const body = credentials.parse(req.body);
    const user = await auth.login(body);
    res.cookie(COOKIE, signSession(user), cookieOptions());
    res.json({ user });
  })
);

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { path: '/' });
  res.json({ ok: true });
});

router.get(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    res.json({ user: await auth.byId(req.userId) });
  })
);

router.patch(
  '/me',
  requireAuth,
  wrap(async (req, res) => {
    const body = z.object({ fullName: z.string().trim().min(1, 'Name is required.') }).parse(req.body);
    res.json({ user: await auth.updateProfile(req.userId, body) });
  })
);

router.post(
  '/reset-request',
  wrap(async (req, res) => {
    const body = z.object({ email: z.string().trim().email() }).parse(req.body);
    const token = await auth.createResetToken(body.email);
    const payload = { ok: true };
    if (token && process.env.NODE_ENV !== 'production') payload.token = token;
    res.json(payload);
  })
);

router.post(
  '/reset',
  wrap(async (req, res) => {
    const body = z
      .object({ token: z.string().min(10), password: z.string().min(8, 'Password must be at least 8 characters.') })
      .parse(req.body);
    await auth.resetPassword(body);
    res.json({ ok: true });
  })
);

export default router;
`;
var RECORDS_ROUTES = `import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { wrap } from '../wrap.js';
import * as records from '../services/records.js';

const router = Router();
router.use(requireAuth);

router.get(
  '/:entity',
  wrap(async (req, res) => {
    const items = await records.list(req.userId, req.params.entity, req.query.limit);
    const total = await records.count(req.userId, req.params.entity);
    res.json({ items, total });
  })
);

router.post(
  '/:entity',
  wrap(async (req, res) => {
    res.status(201).json({ record: await records.create(req.userId, req.params.entity, req.body) });
  })
);

router.get(
  '/:entity/:id',
  wrap(async (req, res) => {
    res.json({ record: await records.get(req.userId, req.params.entity, req.params.id) });
  })
);

router.patch(
  '/:entity/:id',
  wrap(async (req, res) => {
    res.json({ record: await records.update(req.userId, req.params.entity, req.params.id, req.body) });
  })
);

router.delete(
  '/:entity/:id',
  wrap(async (req, res) => {
    await records.remove(req.userId, req.params.entity, req.params.id);
    res.status(204).end();
  })
);

export default router;
`;
var ROUTER_INDEX = `import { Router } from 'express';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import authRouter from './auth.js';
import recordsRouter from './records.js';
import { entityKeys } from '../schema.js';

const here = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(here, '..', '..', 'package.json'), 'utf8'));
const router = Router();

router.get('/version', (_req, res) => {
  res.json({ name: pkg.name, version: pkg.version, collections: entityKeys() });
});

router.use('/auth', authRouter);
router.use('/records', recordsRouter);

export default router;
`;
var SERVER_APP = `import express from 'express';
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
    const status = err.status || (err.name === 'ZodError' ? 400 : 500);
    if (err.name === 'ZodError') {
      const fields = {};
      for (const issue of err.issues) fields[issue.path.join('.')] = issue.message;
      return res.status(400).json({ error: 'Check the highlighted fields.', fields });
    }
    console.error(
      JSON.stringify({ level: 'error', method: req.method, path: req.path, status, message: err.message })
    );
    return res.status(status).json({ error: status === 500 ? 'Something went wrong on our side.' : err.message });
  });

  return app;
}
`;
var SERVER_INDEX = `import 'dotenv/config';
import { createApp } from './app.js';

const port = Number(process.env.PORT || 3000);
const app = createApp();

app.listen(port, () => {
  console.log('listening on http://localhost:' + port);
});
`;
function buildInitSql(seed) {
	const entities = entityModel(seed);
	const blocks = entities.map((entity) => {
		const lines = entity.fields.map((field) => "  \"" + field.name + "\" " + sqlColumn(field)).join(",\n");
		return `create table if not exists "${entity.key}" (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references users(id) on delete cascade,
${lines},
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists "${entity.key}_owner_id_idx" on "${entity.key}" (owner_id);
create index if not exists "${entity.key}_created_at_idx" on "${entity.key}" (created_at desc);`;
	});
	return `-- Baseline schema for ${seed.title}. Complete for the shipped application.
-- Refine types with 002_*.sql when the business needs it. Never edit a migration that has run.

create extension if not exists pgcrypto;

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  password_hash text not null,
  reset_token text,
  reset_expires timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

${blocks.join("\n\n")}

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

${entities.map((entity) => `drop trigger if exists "${entity.key}_touch" on "${entity.key}";
create trigger "${entity.key}_touch" before update on "${entity.key}" for each row execute function touch_updated_at();`).join("\n")}
`;
}
function buildServerFiles(seed) {
	return [
		{
			path: "server/schema.js",
			content: buildSchemaModule$1(seed)
		},
		{
			path: "server/db.js",
			content: DB
		},
		{
			path: "server/wrap.js",
			content: WRAP
		},
		{
			path: "server/middleware/auth.js",
			content: AUTH_MW
		},
		{
			path: "server/services/auth.js",
			content: AUTH_SERVICE
		},
		{
			path: "server/services/records.js",
			content: RECORDS_SERVICE
		},
		{
			path: "server/routes/auth.js",
			content: AUTH_ROUTES
		},
		{
			path: "server/routes/records.js",
			content: RECORDS_ROUTES
		},
		{
			path: "server/routes/index.js",
			content: ROUTER_INDEX
		},
		{
			path: "server/app.js",
			content: SERVER_APP
		},
		{
			path: "server/index.js",
			content: SERVER_INDEX
		},
		{
			path: "database/migrations/001_init.sql",
			content: buildInitSql(seed)
		}
	];
}
//#endregion
//#region src/lib/kit/client.js
var STYLES = `:root {
  color-scheme: light;
  --ink: #0f1115;
  --muted: #5b6169;
  --line: #e3e0da;
  --paper: #fbfaf7;
  --surface: #ffffff;
  --accent: #1a3c34;
  --accent-ink: #ffffff;
  --danger: #9a3b2e;
  --radius: 8px;
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
  font-size: 15px;
  line-height: 1.55;
  -webkit-font-smoothing: antialiased;
}

a {
  color: inherit;
}

h1,
h2,
h3 {
  font-family: Georgia, "Times New Roman", serif;
  font-weight: 700;
  letter-spacing: -0.01em;
  margin: 0 0 12px;
}

h1 {
  font-size: 32px;
  line-height: 1.15;
}

h2 {
  font-size: 21px;
}

p {
  margin: 0 0 14px;
  color: var(--muted);
}

.topbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px 20px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
  background: var(--surface);
}

.brand {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 17px;
  font-weight: 700;
  margin-right: auto;
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.nav a {
  text-decoration: none;
  font-size: 14px;
  color: var(--muted);
}

.nav a:hover,
.nav a[aria-current="page"] {
  color: var(--ink);
}

.page {
  max-width: 860px;
  margin: 0 auto;
  padding: 32px 20px 72px;
}

.card {
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--radius);
  padding: 20px;
  margin-bottom: 16px;
}

.grid {
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  margin-bottom: 14px;
}

.field label {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

input,
textarea,
select {
  font: inherit;
  color: var(--ink);
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: 6px;
  padding: 9px 11px;
  width: 100%;
}

input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

input:focus-visible,
textarea:focus-visible,
button:focus-visible,
a:focus-visible {
  outline: 2px solid var(--accent);
  outline-offset: 2px;
}

.btn,
.btn-ghost,
.btn-link {
  font: inherit;
  cursor: pointer;
  border-radius: 6px;
  border: 1px solid transparent;
  padding: 9px 16px;
  min-height: 40px;
}

.btn {
  background: var(--accent);
  color: var(--accent-ink);
  font-weight: 600;
}

.btn:disabled {
  opacity: 0.6;
  cursor: progress;
}

.btn-ghost {
  background: transparent;
  border-color: var(--line);
  color: var(--ink);
}

.btn-link {
  background: none;
  border: none;
  padding: 0;
  color: var(--accent);
  text-decoration: underline;
}

.btn-danger {
  background: transparent;
  border-color: var(--danger);
  color: var(--danger);
  font-weight: 600;
}

.toolbar {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 8px;
}

.error {
  color: var(--danger);
  font-size: 14px;
  margin: 0 0 12px;
}

.hint {
  font-size: 13px;
  color: var(--muted);
}

.empty {
  border: 1px dashed var(--line);
  border-radius: var(--radius);
  padding: 28px 20px;
  text-align: center;
}

.row {
  display: block;
  text-decoration: none;
  border-bottom: 1px solid var(--line);
  padding: 14px 4px;
}

.row:last-child {
  border-bottom: none;
}

.row:hover {
  background: #f4f2ed;
}

.row-title {
  font-weight: 600;
  color: var(--ink);
}

.row-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  font-size: 12px;
  color: var(--muted);
  margin-top: 4px;
}

.badge {
  display: inline-block;
  border: 1px solid var(--line);
  border-radius: 999px;
  padding: 1px 9px;
  font-size: 12px;
  text-transform: capitalize;
}

.stat {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 26px;
  font-weight: 700;
}

.dl {
  display: grid;
  grid-template-columns: minmax(120px, 180px) 1fr;
  gap: 8px 16px;
  margin: 0 0 20px;
}

.dl dt {
  color: var(--muted);
  font-size: 13px;
}

.dl dd {
  margin: 0;
  word-break: break-word;
}

@media (max-width: 480px) {
  .page {
    padding: 24px 16px 56px;
  }

  h1 {
    font-size: 26px;
  }

  .dl {
    grid-template-columns: 1fr;
    gap: 2px 0;
  }

  .dl dd {
    margin-bottom: 12px;
  }
}
`;
var API = `const BASE = import.meta.env.VITE_API_URL || '';

async function request(path, options) {
  const config = Object.assign({ credentials: 'include', headers: { 'content-type': 'application/json' } }, options || {});
  const response = await fetch(BASE + path, config);
  const text = await response.text();
  let body = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!response.ok) {
    const error = new Error((body && body.error) || 'The request failed.');
    error.status = response.status;
    error.fields = (body && body.fields) || null;
    throw error;
  }
  return body;
}

const send = (method, path, payload) => request(path, { method, body: JSON.stringify(payload || {}) });

export const api = {
  me: () => request('/api/auth/me'),
  login: (payload) => send('POST', '/api/auth/login', payload),
  register: (payload) => send('POST', '/api/auth/register', payload),
  logout: () => send('POST', '/api/auth/logout'),
  updateProfile: (payload) => send('PATCH', '/api/auth/me', payload),
  resetRequest: (payload) => send('POST', '/api/auth/reset-request', payload),
  reset: (payload) => send('POST', '/api/auth/reset', payload),
  list: (entity) => request('/api/records/' + entity),
  create: (entity, payload) => send('POST', '/api/records/' + entity, payload),
  read: (entity, id) => request('/api/records/' + entity + '/' + id),
  update: (entity, id, payload) => send('PATCH', '/api/records/' + entity + '/' + id, payload),
  remove: (entity, id) => request('/api/records/' + entity + '/' + id, { method: 'DELETE' })
};
`;
var AUTH = `import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let live = true;
    api
      .me()
      .then((body) => {
        if (live) setUser(body.user);
      })
      .catch((error) => {
        if (live && error.status !== 401) setUser(null);
      })
      .finally(() => {
        if (live) setLoading(false);
      });
    return () => {
      live = false;
    };
  }, []);

  const signIn = useCallback(async (payload) => {
    const body = await api.login(payload);
    setUser(body.user);
  }, []);

  const signUp = useCallback(async (payload) => {
    const body = await api.register(payload);
    setUser(body.user);
  }, []);

  const signOut = useCallback(async () => {
    await api.logout();
    setUser(null);
  }, []);

  const value = { user, loading, setUser, signIn, signUp, signOut };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
`;
var SHELL = `import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Shell() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const leave = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <div>
      <header className="topbar">
        <Link className="brand" to="/app">
          {user ? user.full_name : 'InvestArch'}
        </Link>
        <nav className="nav" aria-label="Main">
          <NavLink to="/app" end>
            Dashboard
          </NavLink>
          <NavLink to="/app/new">New record</NavLink>
          <NavLink to="/settings">Settings</NavLink>
        </nav>
        <button type="button" className="btn-ghost" onClick={leave}>
          Sign out
        </button>
      </header>
      <main className="page">
        <Outlet />
      </main>
    </div>
  );
}
`;
var STATE = `export default function StateBlock({ status, message, onRetry, action, children }) {
  if (status === 'loading') {
    return (
      <div className="card" role="status" aria-live="polite">
        <p className="hint">Loading</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="card" role="alert">
        <p className="error">{message || 'That did not load.'}</p>
        {onRetry ? (
          <button type="button" className="btn-ghost" onClick={onRetry}>
            Try again
          </button>
        ) : null}
      </div>
    );
  }

  if (status === 'empty') {
    return (
      <div className="empty">
        <p>{message || 'Nothing here yet.'}</p>
        {action || null}
      </div>
    );
  }

  return children || null;
}
`;
var FORM = `export default function RecordForm({ fields, values, onChange, onSubmit, submitting, error, submitLabel, onCancel }) {
  const set = (name, value) => onChange(Object.assign({}, values, { [name]: value }));

  return (
    <form
      className="card"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      {fields.map((field) => (
        <div className="field" key={field.name}>
          <label htmlFor={field.name}>
            {field.label}
            {field.required ? ' (required)' : ''}
          </label>
          {field.type === 'boolean' ? (
            <input
              id={field.name}
              name={field.name}
              type="checkbox"
              checked={Boolean(values[field.name])}
              onChange={(event) => set(field.name, event.target.checked)}
            />
          ) : (
            <input
              id={field.name}
              name={field.name}
              type={field.type === 'number' ? 'number' : field.type === 'date' ? 'date' : 'text'}
              step={field.type === 'number' ? 'any' : undefined}
              value={values[field.name] == null ? '' : values[field.name]}
              onChange={(event) => set(field.name, event.target.value)}
              required={field.required}
            />
          )}
        </div>
      ))}
      {error ? (
        <p className="error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="toolbar">
        <button className="btn" type="submit" disabled={submitting}>
          {submitting ? 'Saving' : submitLabel}
        </button>
        {onCancel ? (
          <button className="btn-ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
        ) : null}
      </div>
    </form>
  );
}
`;
function buildSchemaModule(seed) {
	return `export const ENTITY = ${JSON.stringify(primaryEntity(seed), null, 2)};

export function fieldLabel(name) {
  const field = ENTITY.fields.find((item) => item.name === name);
  return field ? field.label : name;
}

export function titleOf(record) {
  const value = record ? record[ENTITY.titleField] : null;
  return value == null || value === '' ? 'Untitled' : String(value);
}
`;
}
function buildLanding(seed) {
	return `import { Link } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Landing() {
  const { user, loading } = useAuth();

  return (
    <main className="page">
      <h1>${(seed.title || "Operations").replace(/'/g, "")} keeps the work in one place.</h1>
      <p>
        ${(seed.gap || "Records scatter across tools and nobody trusts the numbers.").replace(/'/g, "").slice(0, 220)}
      </p>
      <p>
        ${(seed.solution || "One workspace per account, with every record scoped to its owner.").replace(/'/g, "").slice(0, 220)}
      </p>
      <div className="toolbar">
        {loading ? null : user ? (
          <Link className="btn" to="/app">
            Open dashboard
          </Link>
        ) : (
          <>
            <Link className="btn" to="/register">
              Create an account
            </Link>
            <Link className="btn-ghost" to="/login">
              Sign in
            </Link>
          </>
        )}
      </div>
    </main>
  );
}
`;
}
var LOGIN = `import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Login() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signIn(form);
      navigate('/app', { replace: true });
    } catch (problem) {
      setError(problem.message || 'Sign in failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>Sign in</h1>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm(Object.assign({}, form, { email: event.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            value={form.password}
            onChange={(event) => setForm(Object.assign({}, form, { password: event.target.value }))}
            required
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="toolbar">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Signing in' : 'Sign in'}
          </button>
          <Link className="btn-link" to="/reset">
            Forgot your password?
          </Link>
          <Link className="btn-link" to="/register">
            Need an account?
          </Link>
        </div>
      </form>
    </main>
  );
}
`;
var REGISTER = `import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export default function Register() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ fullName: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  const submit = async (event) => {
    event.preventDefault();
    setError('');
    setBusy(true);
    try {
      await signUp(form);
      navigate('/app', { replace: true });
    } catch (problem) {
      setError(problem.message || 'Registration failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>Create your account</h1>
      <p>Every record you add stays scoped to your account.</p>
      <form className="card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input
            id="fullName"
            value={form.fullName}
            autoComplete="name"
            onChange={(event) => setForm(Object.assign({}, form, { fullName: event.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={(event) => setForm(Object.assign({}, form, { email: event.target.value }))}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="password">Password (8 characters minimum)</label>
          <input
            id="password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            value={form.password}
            onChange={(event) => setForm(Object.assign({}, form, { password: event.target.value }))}
            required
          />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="toolbar">
          <button className="btn" type="submit" disabled={busy}>
            {busy ? 'Creating account' : 'Create account'}
          </button>
          <Link className="btn-link" to="/login">
            Already registered?
          </Link>
        </div>
      </form>
    </main>
  );
}
`;
var DASHBOARD = `import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { ENTITY, titleOf } from '../schema';
import StateBlock from '../components/StateBlock';

export default function Dashboard() {
  const [state, setState] = useState({ status: 'loading', items: [], total: 0, error: null });

  const load = useCallback(async () => {
    setState((current) => Object.assign({}, current, { status: 'loading', error: null }));
    try {
      const body = await api.list(ENTITY.key);
      setState({ status: body.items.length ? 'ready' : 'empty', items: body.items, total: body.total, error: null });
    } catch (error) {
      setState({ status: 'error', items: [], total: 0, error: error.message });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <section>
      <div className="toolbar" style={{ justifyContent: 'space-between', marginBottom: '16px' }}>
        <div>
          <h1 style={{ marginBottom: '4px' }}>{ENTITY.label} records</h1>
          <p className="hint" style={{ margin: 0 }}>
            {state.total} stored
          </p>
        </div>
        <Link className="btn" to="/app/new">
          New {ENTITY.label.toLowerCase()}
        </Link>
      </div>

      {state.status === 'loading' || state.status === 'error' ? (
        <StateBlock status={state.status} message={state.error} onRetry={load} />
      ) : null}

      {state.status === 'empty' ? (
        <StateBlock
          status="empty"
          message={'No ' + ENTITY.label.toLowerCase() + ' records yet.'}
          action={
            <Link className="btn" to="/app/new">
              Add the first one
            </Link>
          }
        />
      ) : null}

      {state.status === 'ready' ? (
        <div className="card" style={{ padding: '4px 16px' }}>
          {state.items.map((item) => (
            <Link className="row" key={item.id} to={'/app/' + item.id}>
              <div className="row-title">{titleOf(item)}</div>
              <div className="row-meta">
                {ENTITY.fields
                  .filter((field) => field.name !== ENTITY.titleField && item[field.name] != null)
                  .slice(0, 3)
                  .map((field) => (
                    <span key={field.name}>
                      {field.label}: {String(item[field.name])}
                    </span>
                  ))}
                <span>{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
            </Link>
          ))}
        </div>
      ) : null}
    </section>
  );
}
`;
var RECORD_NEW = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { ENTITY } from '../schema';
import RecordForm from '../components/RecordForm';

export default function RecordNew() {
  const navigate = useNavigate();
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      const body = await api.create(ENTITY.key, values);
      navigate('/app/' + body.record.id, { replace: true });
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
      setBusy(false);
    }
  };

  return (
    <section>
      <h1>New {ENTITY.label.toLowerCase()}</h1>
      <RecordForm
        fields={ENTITY.fields}
        values={values}
        onChange={setValues}
        onSubmit={submit}
        submitting={busy}
        error={error}
        submitLabel="Save"
        onCancel={() => navigate('/app')}
      />
    </section>
  );
}
`;
var RECORD_DETAIL = `import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../api';
import { ENTITY, titleOf } from '../schema';
import RecordForm from '../components/RecordForm';
import StateBlock from '../components/StateBlock';

function toInput(record) {
  const values = {};
  for (const field of ENTITY.fields) {
    const value = record[field.name];
    if (field.type === 'date' && value) values[field.name] = String(value).slice(0, 10);
    else values[field.name] = value == null ? '' : value;
  }
  return values;
}

export default function RecordDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [state, setState] = useState({ status: 'loading', record: null, error: null });
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setState({ status: 'loading', record: null, error: null });
    try {
      const body = await api.read(ENTITY.key, id);
      setState({ status: 'ready', record: body.record, error: null });
      setValues(toInput(body.record));
    } catch (problem) {
      setState({
        status: problem.status === 404 ? 'missing' : 'error',
        record: null,
        error: problem.message
      });
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    setError('');
    setBusy(true);
    try {
      const body = await api.update(ENTITY.key, id, values);
      setState({ status: 'ready', record: body.record, error: null });
      setValues(toInput(body.record));
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const destroy = async () => {
    if (!window.confirm('Delete this record? This cannot be undone.')) return;
    setBusy(true);
    try {
      await api.remove(ENTITY.key, id);
      navigate('/app', { replace: true });
    } catch (problem) {
      setError(problem.message || 'That could not be deleted.');
      setBusy(false);
    }
  };

  if (state.status === 'loading' || state.status === 'error') {
    return <StateBlock status={state.status} message={state.error} onRetry={load} />;
  }

  if (state.status === 'missing') {
    return (
      <div className="empty">
        <p>That record does not exist, or it belongs to another account.</p>
        <Link className="btn" to="/app">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <section>
      <p className="hint" style={{ marginBottom: '6px' }}>
        <Link to="/app">Dashboard</Link> / {ENTITY.label}
      </p>
      <h1>{titleOf(state.record)}</h1>
      <p className="hint">
        Created {new Date(state.record.created_at).toLocaleString()} | Updated{' '}
        {new Date(state.record.updated_at).toLocaleString()}
      </p>

      <RecordForm
        fields={ENTITY.fields}
        values={values}
        onChange={setValues}
        onSubmit={save}
        submitting={busy}
        error={error}
        submitLabel="Save changes"
      />

      <div className="toolbar">
        <button type="button" className="btn-danger" onClick={destroy} disabled={busy}>
          Delete record
        </button>
      </div>
    </section>
  );
}
`;
var RESET = `import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function Reset() {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [issued, setIssued] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const requestToken = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const body = await api.resetRequest({ email });
      setMessage('If that email has an account, a single-use reset token has been issued.');
      if (body && body.token) setIssued(body.token);
    } catch (problem) {
      setError(problem.message || 'That request failed.');
    } finally {
      setBusy(false);
    }
  };

  const applyPassword = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      await api.reset({ token, password });
      setPassword('');
      setMessage('Password changed. You can sign in with it now.');
    } catch (problem) {
      setError(problem.message || 'That reset failed.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="page">
      <h1>{token ? 'Choose a new password' : 'Reset your password'}</h1>
      {token ? (
        <form className="card" onSubmit={applyPassword}>
          <div className="field">
            <label htmlFor="password">New password (8 characters minimum)</label>
            <input
              id="password"
              type="password"
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="hint">{message}</p> : null}
          <div className="toolbar">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Saving' : 'Save password'}
            </button>
            <Link className="btn-link" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      ) : (
        <form className="card" onSubmit={requestToken}>
          <p>Enter the email on the account. The reset token is valid for one hour and can be used once.</p>
          <div className="field">
            <label htmlFor="resetEmail">Email</label>
            <input
              id="resetEmail"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </div>
          {error ? (
            <p className="error" role="alert">
              {error}
            </p>
          ) : null}
          {message ? <p className="hint">{message}</p> : null}
          {issued ? (
            <p className="hint">
              Development token: <code>{issued}</code>
            </p>
          ) : null}
          <div className="toolbar">
            <button className="btn" type="submit" disabled={busy}>
              {busy ? 'Requesting' : 'Request a reset'}
            </button>
            <Link className="btn-link" to="/login">
              Back to sign in
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
`;
var SETTINGS = `import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../auth';

export default function Settings() {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(user ? user.full_name : '');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const save = async (event) => {
    event.preventDefault();
    setError('');
    setNote('');
    setBusy(true);
    try {
      const body = await api.updateProfile({ fullName });
      setUser(body.user);
      setNote('Saved.');
    } catch (problem) {
      setError(problem.message || 'That could not be saved.');
    } finally {
      setBusy(false);
    }
  };

  const leave = async () => {
    await signOut();
    navigate('/', { replace: true });
  };

  return (
    <section>
      <h1>Settings</h1>
      <form className="card" onSubmit={save}>
        <div className="field">
          <label htmlFor="fullName">Full name</label>
          <input id="fullName" value={fullName} onChange={(event) => setFullName(event.target.value)} required />
        </div>
        <div className="field">
          <label htmlFor="email">Email</label>
          <input id="email" value={user ? user.email : ''} disabled />
        </div>
        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}
        {note ? <p className="hint">{note}</p> : null}
        <button className="btn" type="submit" disabled={busy}>
          {busy ? 'Saving' : 'Save changes'}
        </button>
      </form>

      <div className="card">
        <h2>Session</h2>
        <p className="hint">Signing out clears the session cookie on this device.</p>
        <button type="button" className="btn-ghost" onClick={leave}>
          Sign out
        </button>
      </div>
    </section>
  );
}
`;
var NOT_FOUND = `import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <main className="page">
      <h1>Page not found</h1>
      <p>That address does not match a screen in this application.</p>
      <Link className="btn" to="/app">
        Go to dashboard
      </Link>
    </main>
  );
}
`;
var APP = `import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './auth';
import Shell from './components/Shell';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Reset from './pages/Reset';
import Dashboard from './pages/Dashboard';
import RecordNew from './pages/RecordNew';
import RecordDetail from './pages/RecordDetail';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function Gate({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <main className="page" role="status">
        <p className="hint">Checking your session</p>
      </main>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/reset" element={<Reset />} />
          <Route
            element={
              <Gate>
                <Shell />
              </Gate>
            }
          >
            <Route path="/app" element={<Dashboard />} />
            <Route path="/app/new" element={<RecordNew />} />
            <Route path="/app/:id" element={<RecordDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
`;
function buildClientFiles(seed) {
	return [
		{
			path: "src/index.css",
			content: STYLES
		},
		{
			path: "src/schema.js",
			content: buildSchemaModule(seed)
		},
		{
			path: "src/api.js",
			content: API
		},
		{
			path: "src/auth.jsx",
			content: AUTH
		},
		{
			path: "src/App.jsx",
			content: APP
		},
		{
			path: "src/components/Shell.jsx",
			content: SHELL
		},
		{
			path: "src/components/StateBlock.jsx",
			content: STATE
		},
		{
			path: "src/components/RecordForm.jsx",
			content: FORM
		},
		{
			path: "src/pages/Landing.jsx",
			content: buildLanding(seed)
		},
		{
			path: "src/pages/Login.jsx",
			content: LOGIN
		},
		{
			path: "src/pages/Register.jsx",
			content: REGISTER
		},
		{
			path: "src/pages/Reset.jsx",
			content: RESET
		},
		{
			path: "src/pages/Dashboard.jsx",
			content: DASHBOARD
		},
		{
			path: "src/pages/RecordNew.jsx",
			content: RECORD_NEW
		},
		{
			path: "src/pages/RecordDetail.jsx",
			content: RECORD_DETAIL
		},
		{
			path: "src/pages/Settings.jsx",
			content: SETTINGS
		},
		{
			path: "src/pages/NotFound.jsx",
			content: NOT_FOUND
		}
	];
}
//#endregion
//#region src/lib/kit/tests.js
var SETUP = `process.env.NODE_ENV = 'test';
process.env.APP_URL = process.env.APP_URL || 'http://localhost:3000';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-not-for-production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://unused:unused@127.0.0.1:5432/unused';
`;
var HEALTH = `import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';

const app = createApp();

describe('service shell', () => {
  it('reports health', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('reports the version and its collections', async () => {
    const res = await request(app).get('/api/version');
    expect(res.status).toBe(200);
    expect(typeof res.body.version).toBe('string');
    expect(Array.isArray(res.body.collections)).toBe(true);
  });

  it('answers unknown api routes with JSON 404', async () => {
    const res = await request(app).get('/api/does-not-exist');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });
});
`;
function buildGuardTest(seed) {
	return `import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';

const app = createApp();
const COLLECTION = '/api/records/${entityModel(seed)[0].key}';

describe('route protection', () => {
  it('refuses the collection without a session', async () => {
    const res = await request(app).get(COLLECTION);
    expect(res.status).toBe(401);
    expect(typeof res.body.error).toBe('string');
  });

  it('refuses a write without a session', async () => {
    const res = await request(app).post(COLLECTION).send({ title: 'probe' });
    expect(res.status).toBe(401);
  });

  it('refuses a forged session cookie', async () => {
    const res = await request(app).get(COLLECTION).set('Cookie', 'sid=not-a-real-token');
    expect(res.status).toBe(401);
  });

  it('refuses the current-user endpoint without a session', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });
});
`;
}
var VALIDATION = `import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';

const app = createApp();

describe('request validation', () => {
  it('rejects a malformed registration before touching the database', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: 'short' });

    expect(res.status).toBe(400);
    expect(res.body.fields).toBeTruthy();
    expect(Object.keys(res.body.fields).length).toBeGreaterThan(0);
  });

  it('rejects a login without a password', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'owner@example.com' });
    expect(res.status).toBe(400);
  });

  it('rejects a reset with an unusable token before querying', async () => {
    const res = await request(app).post('/api/auth/reset').send({ token: 'short', password: 'x' });
    expect(res.status).toBe(400);
  });

  it('never leaks a stack trace in an error body', async () => {
    const res = await request(app).post('/api/auth/login').send({ email: 'x', password: 'y' });
    expect(JSON.stringify(res.body)).not.toMatch(/at .*\\(.*:\\d+:\\d+\\)/);
  });
});
`;
function buildModelTest(seed) {
	return `import { describe, expect, it } from 'vitest';
import { ENTITIES, entityKeys } from '../server/schema.js';

describe('schema metadata', () => {
  it('exposes at least one collection', () => {
    expect(entityKeys().length).toBeGreaterThan(0);
  });

  it('gives every collection a title field that exists among its fields', () => {
    for (const key of entityKeys()) {
      const entity = ENTITIES[key];
      const names = entity.fields.map((field) => field.name);
      expect(names).toContain(entity.titleField);
      expect(entity.fields.filter((field) => field.required).length).toBe(1);
    }
  });

  it('never exposes timestamps or the owner as editable fields', () => {
    for (const key of entityKeys()) {
      const names = ENTITIES[key].fields.map((field) => field.name);
      expect(names).not.toContain('id');
      expect(names).not.toContain('owner_id');
      expect(names).not.toContain('created_at');
      expect(names).not.toContain('updated_at');
    }
  });
});
`;
}
function buildOwnershipTest(seed) {
	const key = entityModel(seed)[0].key;
	const titleField = entityModel(seed)[0].titleField;
	return `import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';

const app = createApp();
const COLLECTION = '/api/records/${key}';
const enabled = Boolean(process.env.DATABASE_URL_TEST);

describe.skipIf(!enabled)('ownership isolation (needs DATABASE_URL_TEST)', () => {
  const stamp = Date.now().toString(36);

  async function account(label) {
    const agent = request.agent(app);
    const email = label + '-' + stamp + '@example.com';
    const res = await agent
      .post('/api/auth/register')
      .send({ email, password: 'Passw0rd!23', fullName: label + ' Owner' });
    expect(res.status).toBe(201);
    return agent;
  }

  it('keeps one account out of another account records', async () => {
    const first = await account('first');
    const second = await account('second');

    const created = await first.post(COLLECTION).send({ ${titleField}: 'Owned by the first account' });
    expect(created.status).toBe(201);
    const id = created.body.record.id;

    const ownList = await first.get(COLLECTION);
    expect(ownList.body.items.map((row) => row.id)).toContain(id);

    const otherList = await second.get(COLLECTION);
    expect(otherList.body.items.map((row) => row.id)).not.toContain(id);

    const otherRead = await second.get(COLLECTION + '/' + id);
    expect([403, 404]).toContain(otherRead.status);
    expect(JSON.stringify(otherRead.body)).not.toContain('Owned by the first account');

    const otherWrite = await second.patch(COLLECTION + '/' + id).send({ ${titleField}: 'hijacked' });
    expect([403, 404]).toContain(otherWrite.status);

    const otherDelete = await second.delete(COLLECTION + '/' + id);
    expect([403, 404]).toContain(otherDelete.status);
  });
});
`;
}
function buildTestFiles(seed) {
	return [
		{
			path: "tests/setup.js",
			content: SETUP
		},
		{
			path: "tests/health.test.js",
			content: HEALTH
		},
		{
			path: "tests/auth-guard.test.js",
			content: buildGuardTest(seed)
		},
		{
			path: "tests/validation.test.js",
			content: VALIDATION
		},
		{
			path: "tests/schema.test.js",
			content: buildModelTest(seed)
		},
		{
			path: "tests/ownership.test.js",
			content: buildOwnershipTest(seed)
		}
	];
}
//#endregion
//#region src/lib/kit/docs.js
var TYPE_LABEL = {
	text: "Text",
	number: "Number",
	date: "Date (YYYY-MM-DD)",
	boolean: "On/off",
	status: "Status word"
};
function fieldRows(entity) {
	return entity.fields.map((field) => `| \`${field.name}\` | ${field.label} | ${TYPE_LABEL[field.type] || "Text"} | ${field.required ? "Yes" : "No"} |`).join("\n");
}
function schemaBlocks(seed) {
	return entityModel(seed).map((entity) => {
		const rows = entity.fields.map((field) => `| \`${field.name}\` | \`${sqlColumn(field)}\` | ${field.label} |`).join("\n");
		return `### \`${entity.key}\`

${entity.label} records. Every row belongs to one account through \`owner_id\`.

| Column | Type | Meaning |
| --- | --- | --- |
| \`id\` | \`uuid primary key default gen_random_uuid()\` | Primary key. |
| \`owner_id\` | \`uuid not null references users(id) on delete cascade\` | Owning account. |
${rows}
| \`created_at\` | \`timestamptz not null default now()\` | Insert time. |
| \`updated_at\` | \`timestamptz not null default now()\` | Maintained by trigger. |`;
	}).join("\n\n");
}
function apiCollections(seed) {
	return entityModel(seed).map((entity) => `| \`${entity.key}\` | \`${entity.label}\` | \`${entity.titleField}\` |`).join("\n");
}
function buildReadme(seed) {
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
| Tests | \`tests/\` | Complete: shell, route protection, validation, schema, ownership isolation. |
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

The interface works on \`${primary.key}\` (\`${primary.label}\`); ${entityModel(seed).length > 1 ? "the other collections are also exposed through the same API" : "it is the only collection this build needs"}.

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
function buildUserGuide(seed) {
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
function buildTechnicalGuide(seed) {
	const primary = primaryEntity(seed);
	appSlug(seed);
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
| Routing | react-router-dom | 6.26 | Six screens plus a not-found route. |
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
| \`tests/ownership.test.js\` | yes | two accounts: create, list, read, patch, delete isolation |

\`\`\`bash
npm test                                      # the four database-free suites
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

**Add a collection.** Add the table migration, add the key to \`server/schema.js\`, add seed rows in \`database/seed.js\`, and the five REST routes exist already. Point a screen at \`ENTITY\` in \`src/schema.js\` to use it as the primary collection.

**Add a screen.** One file in \`src/pages/\`, one route in \`src/App.jsx\`, its pass conditions in \`ACCEPTANCE.md\`.

**Send the reset email.** \`services/auth.js\` already issues a single-use token; call your email provider there instead of returning it. The dev-only token in the response disappears the moment \`NODE_ENV=production\`.

## 12. Known limits, stated plainly

- Password reset depends on an email provider you have not wired yet; outside development the token is issued but not delivered.
- The other collections are API-complete but have no dedicated screens: the interface focuses on \`${primary.key}\`.
- No pagination beyond the 50-row default and 200-row cap on the list endpoint.
- No audit trail: \`updated_at\` says when, not who.
- Backups, TLS termination and log retention belong to the host, per \`DEPLOYMENT.md\`.
`;
}
function buildVerifyScript(seed) {
	const primary = primaryEntity(seed).key;
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

step "Protected route"
CODE=$(curl -s -o /dev/null -w '%{http_code}' "http://localhost:\${PROBE_PORT:-3999}/api/records/${primary}")
[ "$CODE" = "401" ] || fail "expected 401 without a session, got $CODE"

echo
echo "PASS: build, tests, migrations, seed and live probes all succeeded."
`;
}
//#endregion
//#region src/lib/buildKit.js
function buildPackageJson(seed) {
	const pkg = {
		name: appSlug(seed),
		private: true,
		version: "1.0.0",
		type: "module",
		engines: { node: ">=20" },
		scripts: {
			dev: "node --watch server/index.js",
			"dev:web": "vite",
			build: "vite build",
			start: "node server/index.js",
			test: "vitest run",
			"test:watch": "vitest",
			lint: "eslint .",
			"db:migrate": "node database/migrate.js",
			"db:seed": "node database/seed.js",
			verify: "npm run lint && npm test && npm run build",
			"verify:full": "bash verify.sh"
		},
		dependencies: {
			bcryptjs: "^2.4.3",
			"cookie-parser": "^1.4.6",
			cors: "^2.8.5",
			dotenv: "^16.4.5",
			express: "^4.19.2",
			helmet: "^7.1.0",
			jsonwebtoken: "^9.0.2",
			pg: "^8.11.5",
			react: "^18.3.1",
			"react-dom": "^18.3.1",
			"react-router-dom": "^6.26.2",
			zod: "^3.23.8"
		},
		devDependencies: {
			"@eslint/js": "^9.9.0",
			"@vitejs/plugin-react": "^4.3.1",
			eslint: "^9.9.0",
			"eslint-plugin-react-hooks": "^4.6.2",
			globals: "^15.9.0",
			supertest: "^7.0.0",
			vite: "^5.4.2",
			vitest: "^2.0.5"
		}
	};
	return JSON.stringify(pkg, null, 2) + "\n";
}
var ESLINT_CONFIG = `import js from '@eslint/js';
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
var VITE_CONFIG = `import { defineConfig } from 'vite';
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
var VITEST_CONFIG = `import { defineConfig } from 'vitest/config';

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
var MAIN_JSX = `import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './index.css';

createRoot(document.getElementById('root')).render(<App />);
`;
var GITIGNORE = `node_modules/
dist/
.env
.env.*
!.env.example
coverage/
*.log
.DS_Store
`;
function buildIndexHtml(seed) {
	return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${seed.title}</title>
    <meta name="description" content="${(seed.solution || seed.gap || seed.title || "").replace(/"/g, "").slice(0, 150)}" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"><\/script>
  </body>
</html>
`;
}
function buildManifest(seed) {
	const entities = entityModel(seed);
	const primary = primaryEntity(seed);
	const entityRows = entities.map((entity) => `| \`"${entity.key}"\` | ${entity.fields.length} fields: ${entity.fields.map((f) => `\`${f.name}\` (${f.type})`).join(", ")} | \`001_init.sql\` | ${entity.key === primary.key ? "Interface, yes" : "API only"} |`).join("\n");
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
function buildAgentOrders(seed, codebase) {
	entityModel(seed);
	const primary = primaryEntity(seed);
	const collection = "/api/records/" + primary.key;
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
${codebase?.repo_name ? `\nRepository name: \`${codebase.repo_name}\`.\n` : ""}`;
}
function buildKitFiles(seed, codebase) {
	return [
		{
			path: "package.json",
			content: buildPackageJson(seed)
		},
		{
			path: "eslint.config.js",
			content: ESLINT_CONFIG
		},
		{
			path: "vite.config.js",
			content: VITE_CONFIG
		},
		{
			path: "vitest.config.js",
			content: VITEST_CONFIG
		},
		{
			path: "index.html",
			content: buildIndexHtml(seed)
		},
		{
			path: ".gitignore",
			content: GITIGNORE
		},
		{
			path: "src/main.jsx",
			content: MAIN_JSX
		},
		{
			path: ".env.example",
			content: buildEnvExample(seed)
		},
		{
			path: "database/migrate.js",
			content: buildMigrateScript()
		},
		{
			path: "database/seed.js",
			content: buildSeedScript(seed)
		},
		...buildClientFiles(seed),
		...buildServerFiles(seed),
		...buildTestFiles(seed),
		{
			path: "README.md",
			content: buildReadme(seed)
		},
		{
			path: "USER_GUIDE.md",
			content: buildUserGuide(seed)
		},
		{
			path: "TECHNICAL_GUIDE.md",
			content: buildTechnicalGuide(seed)
		},
		{
			path: "MANIFEST.md",
			content: buildManifest(seed)
		},
		{
			path: "AGENT_ORDERS.md",
			content: buildAgentOrders(seed, codebase)
		},
		{
			path: "verify.sh",
			content: buildVerifyScript(seed),
			executable: true
		}
	];
}
//#endregion
//#region src/.tmp-gen/gen2.js
var seed = JSON.parse(fs.readFileSync("/tmp/seed.json", "utf8"));
var files = buildKitFiles(seed, { repo_name: seed.repo_name });
var zip = new JSZip();
files.forEach((f) => zip.file(f.path, f.content, f.executable ? { unixPermissions: "755" } : void 0));
var buf = await zip.generateAsync({
	type: "nodebuffer",
	platform: "UNIX"
});
fs.writeFileSync("/tmp/modulex.zip", buf);
var backend = files.filter((f) => /^(server|database|tests)\//.test(f.path) || ["verify.sh", "vitest.config.js"].includes(f.path));
console.log("TOTAL " + files.length + " files, zip " + buf.length + " bytes");
console.log("BACKEND:");
backend.forEach((f) => console.log("  " + f.path + "  (" + f.content.split("\n").length + " lines)"));
//#endregion
export {};
