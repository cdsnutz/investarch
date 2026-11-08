import { entityModel } from '../lib/kit/model.js';

const seed = {
  title: 'Ledgerline',
  blueprint: {
    db_schema:
      'create table invoices (id uuid primary key, title text not null, amount numeric, status text, due_date date);\n' +
      'create table clients (id uuid primary key, name text not null, sector text, retainer numeric, is_active boolean);'
  }
};

const entities = entityModel(seed);
console.log('count', entities.length);
for (const entity of entities) {
  console.log(entity.key, '|', entity.titleField, '|', entity.fields.map((f) => f.name + ':' + f.type).join(', '));
}