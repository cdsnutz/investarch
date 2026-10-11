// Shared helpers for the intelligence engines.
export const norm = (s) => String(s || '').trim().toLowerCase();
export const today = () => new Date().toISOString().slice(0, 10);

// Loads the existing values of one field across an entity so engines never repeat a claim.
export async function existingNames(base44, entity, field) {
  const page = await base44.entities[entity].filter({}, { limit: 300, fields: [field] });
  return new Set((page.items || []).map((r) => norm(r[field])));
}