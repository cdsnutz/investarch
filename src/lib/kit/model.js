// Single source of truth for the generated app's data model. Every generator module reads this,
// so the SQL, the server validation and the React screens can never disagree.
import { parseTables } from '@/lib/scaffoldKit';

const ENTITY_CAP = 4;
const META_COLUMNS = /^(id|owner_id|created_at|updated_at|user_id|deleted_at)$/i;

export function toLabel(name) {
  return String(name)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

// Identifiers travel into SQL, JSON keys and JSX, so they are normalised exactly once here.
export function identifier(value, fallback) {
  const clean = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 48);
  return /^[a-z][a-z0-9_]*$/.test(clean) ? clean : fallback;
}

function fieldType(col) {
  const c = col.toLowerCase();
  if (/^(is_|has_)|_flag$|boolean|(^|_)(active|enabled)($|_)/.test(c)) return 'boolean';
  if (/amount|price|cost|revenue|budget|fee|salary|score|count|qty|quantity|percent|hours|days|month|year|rating|number/.test(c)) return 'number';
  if (/date|_at$|due|deadline|starts|ends|expires/.test(c)) return 'date';
  if (/status|state|stage|phase/.test(c)) return 'status';
  return 'text';
}

export function entityModel(seed) {
  const parsed = parseTables(seed?.blueprint?.db_schema);
  const raw = parsed.length ? parsed : [{ name: 'items', cols: ['title', 'description', 'status'] }];
  const taken = new Set();

  return raw.slice(0, ENTITY_CAP).map((table, index) => {
    let key = identifier(table.name, 'collection_' + (index + 1));
    while (taken.has(key)) key = key + '_' + (index + 1);
    taken.add(key);

    const seen = new Set();
    const names = [];
    for (const col of table.cols) {
      const name = identifier(col, '');
      if (!name || META_COLUMNS.test(name) || seen.has(name)) continue;
      seen.add(name);
      names.push(name);
    }

    const cols = names.length ? names.slice(0, 10) : ['title', 'description'];
    const titleCol = cols.find((c) => /title|name|label|subject/i.test(c)) || cols[0];

    return {
      key,
      label: toLabel(key.replace(/s$/, '')),
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

// Keyed view of the same model: what the generated server and client both read at runtime.
export function entityMap(seed) {
  const map = {};
  for (const entity of entityModel(seed)) map[entity.key] = entity;
  return map;
}

export function primaryEntity(seed) {
  return entityModel(seed)[0];
}

export function sqlColumn(field) {
  switch (field.type) {
    case 'boolean':
      return 'boolean not null default false';
    case 'number':
      return 'numeric not null default 0';
    case 'date':
      return 'timestamptz';
    case 'status':
      return "text not null default 'active'";
    default:
      return field.required ? 'text not null' : 'text';
  }
}