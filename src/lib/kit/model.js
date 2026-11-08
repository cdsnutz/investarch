// Single source of truth for the generated app's data model. Every generator module reads this,
// so the SQL, the server validation and the React screens can never disagree.
import { parseTables } from '@/lib/scaffoldKit';

const ENTITY_CAP = 4;

export function toLabel(name) {
  return String(name)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
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
  const parsed = parseTables(seed.blueprint?.db_schema);
  const raw = parsed.length ? parsed : [{ name: 'items', cols: ['title', 'description', 'status'] }];

  return raw.slice(0, ENTITY_CAP).map((table) => {
    const names = table.cols
      .filter((c) => !/^(id|created_at|updated_at|owner_id|user_id|deleted_at)$/i.test(c))
      .slice(0, 10);
    const cols = names.length ? names : ['title', 'description'];
    const titleCol = cols.find((c) => /title|name|label|subject/i.test(c)) || cols[0];

    return {
      key: table.name,
      label: toLabel(table.name.replace(/s$/, '')),
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