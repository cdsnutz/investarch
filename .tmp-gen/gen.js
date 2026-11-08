import { buildKitFiles } from '../src/lib/buildKit.js';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';

const seed = {
  title: 'Ledgerline Reconciliation',
  gap: 'Finance teams reconcile payments by hand across three systems at every month end.',
  solution: 'A continuous reconciliation engine that matches payment events to ledger entries in seconds.',
  pain_signal: 'Operators report forty hours a month of manual matching work.',
  mini_plan: 'Ship the matching engine\nAdd the exception queue\nLaunch the audit trail',
  blueprint: {
    tech_stack: ['React', 'Node', 'Postgres'],
    db_schema: 'create table invoices (\n  title text,\n  amount numeric,\n  status text,\n  due_date timestamptz\n);\n\ncreate table exceptions (\n  title text,\n  description text,\n  is_resolved boolean\n);'
  }
};

const files = buildKitFiles(seed, { repo_name: 'ledgerline' });
for (const f of files) {
  const target = join('/tmp/kit', f.path);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, f.content);
}
console.log(files.map((f) => f.path).join('\n'));