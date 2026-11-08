// Backend half of the generated application: schema metadata, pool, auth, owner-scoped CRUD,
// routers, the Express app factory and the baseline migration.
import { entityModel, entityMap, primaryEntity, sqlColumn } from '@/lib/kit/model';

function buildSchemaModule(seed) {
  return `export const ENTITIES = ${JSON.stringify(entityMap(seed), null, 2)};

export const PRIMARY_KEY = ${JSON.stringify(primaryEntity(seed).key)};

export function entityOf(key) {
  return Object.prototype.hasOwnProperty.call(ENTITIES, key) ? ENTITIES[key] : null;
}

export function entityKeys() {
  return Object.keys(ENTITIES);
}
`;
}

const DB = `import pg from 'pg';

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10 });

export function query(text, params) {
  return pool.query(text, params);
}

export function close() {
  return pool.end();
}
`;

const WRAP = `export function wrap(handler) {
  return (req, res, next) => handler(req, res).catch(next);
}
`;

const AUTH_MW = `import jwt from 'jsonwebtoken';

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

const AUTH_SERVICE = `import bcrypt from 'bcryptjs';
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

const RECORDS_SERVICE = `import { query } from '../db.js';
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

const AUTH_ROUTES = `import { Router } from 'express';
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

const RECORDS_ROUTES = `import { Router } from 'express';
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

const ROUTER_INDEX = `import { Router } from 'express';
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

const SERVER_INDEX = `import 'dotenv/config';
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
    const lines = entity.fields.map((field) => '  "' + field.name + '" ' + sqlColumn(field)).join(',\n');
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

${blocks.join('\n\n')}

create or replace function touch_updated_at() returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

${entities
  .map(
    (entity) => `drop trigger if exists "${entity.key}_touch" on "${entity.key}";
create trigger "${entity.key}_touch" before update on "${entity.key}" for each row execute function touch_updated_at();`
  )
  .join('\n')}
`;
}

export function buildServerFiles(seed) {
  return [
    { path: 'server/schema.js', content: buildSchemaModule(seed) },
    { path: 'server/db.js', content: DB },
    { path: 'server/wrap.js', content: WRAP },
    { path: 'server/middleware/auth.js', content: AUTH_MW },
    { path: 'server/services/auth.js', content: AUTH_SERVICE },
    { path: 'server/services/records.js', content: RECORDS_SERVICE },
    { path: 'server/routes/auth.js', content: AUTH_ROUTES },
    { path: 'server/routes/records.js', content: RECORDS_ROUTES },
    { path: 'server/routes/index.js', content: ROUTER_INDEX },
    { path: 'server/app.js', content: SERVER_APP },
    { path: 'server/index.js', content: SERVER_INDEX },
    { path: 'database/migrations/001_init.sql', content: buildInitSql(seed) }
  ];
}