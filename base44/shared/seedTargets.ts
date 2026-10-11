export const normTitle = (t) => String(t || '').trim().toLowerCase();

// V6.0 shared pod logic: pick the top asymmetric seeds that lack coverage (plans / validations / kits).
// Explicit seedId overrides the automatic selection; statusFilter narrows the seed pool (e.g. built only).
export async function pickSeedTargets(base44, coverageEntity, seedId, max, statusFilter = {}) {
  const [seedPage, coveragePage] = await Promise.all([
    base44.asServiceRole.entities.IpSeed.filter(statusFilter, { sort: '-asymmetric_score', limit: 60 }),
    base44.asServiceRole.entities[coverageEntity].filter({}, { limit: 300, fields: ['seed_id'] })
  ]);
  const covered = new Set((coveragePage.items || []).map((r) => r.seed_id));
  let targets = (seedPage.items || []).filter((s) => !covered.has(s.id));
  if (seedId) {
    const explicit = (seedPage.items || []).find((s) => s.id === seedId);
    if (explicit) targets = [explicit];
  }
  return targets.slice(0, max);
}