// The database runner: applies each migration file exactly once, in filename order,
// one transaction per file, and reports a no-op run so verify.sh can assert it.
export function buildMigrateScript() {
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