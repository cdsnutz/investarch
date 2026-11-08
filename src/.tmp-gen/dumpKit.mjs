import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { buildKitFiles } from '../lib/buildKit.js';

const root = '/tmp/genkit';
const seed = {
  title: 'Ledgerline',
  gap: 'Finance teams reconcile revenue across six systems by hand every month, and the close slips.',
  solution: 'One owner-scoped ledger per account, with a closed period nobody can edit.',
  yield_date: '2026-11-08',
  blueprint: {
    tech_stack: ['Node', 'Postgres'],
    db_schema:
      'create table invoices (id uuid primary key, title text not null, amount numeric, status text, due_date date);\n' +
      'create table clients (id uuid primary key, name text not null, sector text, retainer numeric, is_active boolean);',
    core_logic: 'Reconcile by amount and date.'
  }
};

const brand = {
  brand_name: 'Northline Studio',
  primary_color: '#123355',
  accent_color: '#b3402f',
  surface_color: '#f7f4ee',
  ink_color: '#101418',
  logo_url: 'https://media.base44.com/images/public/example/logo.png',
  support_email: 'help@northline.example'
};

const files = buildKitFiles(seed, null, brand);
for (const file of files) {
  const target = join(root, file.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, file.content);
}
console.log('written', files.length);