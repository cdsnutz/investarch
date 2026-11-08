export const SEED_FIELDS = [
  ['title', 'Title'],
  ['gap', 'The gap'],
  ['solution', 'The solution'],
  ['mini_plan', 'Mini-plan'],
  ['pain_signal', 'Pain signal'],
  ['source_channel', 'Source channel']
];

export function missingSeedFields(seed) {
  const bp = seed?.blueprint || {};
  const missing = SEED_FIELDS.filter(([key]) => !String(seed?.[key] || '').trim()).map(([, label]) => label);
  if (typeof seed?.asymmetric_score !== 'number') missing.push('Asymmetry score');
  if (!Array.isArray(bp.tech_stack) || !bp.tech_stack.length) missing.push('Tech stack');
  if (!String(bp.db_schema || '').trim()) missing.push('Database schema');
  if (!String(bp.core_logic || '').trim()) missing.push('Core logic');
  return missing;
}

export const seedIsComplete = (seed) => missingSeedFields(seed).length === 0;