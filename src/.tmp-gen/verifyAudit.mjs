import { buildKitFiles } from '../lib/buildKit.js';
import { auditKit } from '../lib/kit/audit.js';
import { entityModel } from '../lib/kit/model.js';
import { normalizeBrand } from '../lib/kit/brand.js';

const rawBrand = {
  brand_name: 'Northline Studio',
  primary_color: '#123355',
  accent_color: '#b3402f',
  surface_color: '#f7f4ee',
  ink_color: '#101418',
  logo_url: 'https://media.base44.com/images/public/example/logo.png',
  support_email: 'help@northline.example'
};

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

const brand = normalizeBrand(rawBrand, seed);
const entities = entityModel(seed);

const patch = (files, path, edit) =>
  files.map((file) => (file.path === path ? { ...file, content: edit(file.content) } : file));

const clean = buildKitFiles(seed, null, rawBrand);
const baseline = auditKit(clean, { entities, brand });
console.log('clean kit:', baseline.files, 'files, ok =', baseline.ok);

const faults = [
  ['missing required file', (files) => files.filter((f) => f.path !== 'tests/contract.test.js'), 'missing'],
  ['duplicate path', (files) => files.concat([files[0]]), 'duplicate'],
  ['unclosed brace', (files) => patch(files, 'server/app.js', (c) => c.replace('  return app;\n}', '  return app;')), 'syntax'],
  ['unclosed template', (files) => patch(files, 'src/api.js', (c) => c.replace('return body;', 'return body;\nconst bad = `never closed;')), 'syntax'],
  [
    'broken relative import',
    (files) => patch(files, 'src/App.jsx', (c) => c.replace("'./pages/RecordList'", "'./pages/RecordListx'")),
    'import'
  ],
  [
    'renamed export still imported',
    (files) =>
      files.map((file) =>
        file.path === 'server/services/records.js'
          ? { ...file, content: file.content.replace('export async function list(', 'export async function listAll(') }
          : file
      ),
    'service'
  ],
  [
    'undeclared dependency',
    (files) => patch(files, 'server/index.js', (c) => c.replace("import 'dotenv/config';", "import 'dotenv/config';\nimport leftPad from 'left-pad';")),
    'dependency'
  ],
  ['column dropped from the migration', (files) => patch(files, 'database/migrations/001_init.sql', (c) => c.replace('"amount"', '"amount_removed"')), 'column'],
  ['table dropped from the migration', (files) => patch(files, 'database/migrations/001_init.sql', (c) => c.replace('create table if not exists "clients"', 'create table if not exists "clientz"')), 'collection'],
  [
    'collection lookup weakened to a list',
    (files) => patch(files, 'server/schema.js', (c) => c.replace('export function entityOf', 'export function lookupOf')),
    'collection'
  ],
  ['link to a route that does not exist', (files) => patch(files, 'src/pages/NotFound.jsx', (c) => c.replace('to="/app"', 'to="/nowhere"')), 'route'],
  ['api method that does not exist', (files) => patch(files, 'src/pages/Settings.jsx', (c) => c.replace('api.updateProfile(', 'api.saveProfile(')), 'api'],
  ['unreplaced template token', (files) => patch(files, 'src/index.css', (c) => c + '\n.brand { color: __PRIMARY__; }\n'), 'placeholder'],
  ['leaked secret', (files) => patch(files, 'src/brand.js', (c) => c + '\nexport const KEY = "sk_live_8f2b1c9d7e";\n'), 'secret'],
  ['invalid package.json', (files) => patch(files, 'package.json', (c) => c.slice(0, -4)), 'syntax'],
  ['css variable never defined', (files) => patch(files, 'src/index.css', (c) => c + '\n.ghost { color: var(--nope); }\n'), 'syntax'],
  ['sql trailing comma', (files) => patch(files, 'database/migrations/001_init.sql', (c) => c.replace('on delete cascade,\n', 'on delete cascade,\n  ,\n')), 'syntax'],
  ['brand palette lost', (files) => patch(files, 'src/index.css', (c) => c.replace('#123355', '#000000')), 'brand']
];

let failures = 0;
for (const [label, mutate, code] of faults) {
  const report = auditKit(mutate(clean), { entities, brand });
  const hit = report.errors.some((issue) => issue.code === code);
  if (!hit) failures += 1;
  console.log((hit ? 'caught  ' : 'MISSED  ') + label + ' -> expected "' + code + '"' + (hit ? '' : ' (saw: ' + report.errors.map((e) => e.code).join(',') + ')'));
}
console.log('faults checked:', faults.length, '| missed:', failures);