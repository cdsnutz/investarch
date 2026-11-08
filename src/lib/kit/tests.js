// Test suite for the generated application. Three suites run with no database; the ownership
// suite runs only when DATABASE_URL_TEST points at a disposable database.
import { entityModel } from '@/lib/kit/model';

const SETUP = `process.env.NODE_ENV = 'test';
process.env.APP_URL = process.env.APP_URL || 'http://localhost:3000';
process.env.AUTH_SECRET = process.env.AUTH_SECRET || 'test-secret-not-for-production';
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://unused:unused@127.0.0.1:5432/unused';
`;

const HEALTH = `import { describe, expect, it } from 'vitest';
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
  const key = entityModel(seed)[0].key;
  return `import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../server/app.js';

const app = createApp();
const COLLECTION = '/api/records/${key}';

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

const VALIDATION = `import { describe, expect, it } from 'vitest';
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

export function buildTestFiles(seed) {
  return [
    { path: 'tests/setup.js', content: SETUP },
    { path: 'tests/health.test.js', content: HEALTH },
    { path: 'tests/auth-guard.test.js', content: buildGuardTest(seed) },
    { path: 'tests/validation.test.js', content: VALIDATION },
    { path: 'tests/schema.test.js', content: buildModelTest(seed) },
    { path: 'tests/ownership.test.js', content: buildOwnershipTest(seed) }
  ];
}