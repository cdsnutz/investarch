import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const [seedPage, filingPage, valPage] = await Promise.all([
      base44.asServiceRole.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 300, fields: ['title', 'asymmetric_score', 'status', 'strategy'] }),
      base44.asServiceRole.entities.IpFiling.filter({}, { limit: 500, fields: ['seed_id', 'filing_type'] }),
      base44.asServiceRole.entities.GhostValidation.filter({}, { limit: 500, fields: ['seed_id', 'demand_score'] })
    ]);
    const seeds = seedPage.items || [];
    if (!seeds.length) return Response.json({ note: 'No assets in the vault yet.' });

    const hardened = new Set((filingPage.items || []).map((f) => f.seed_id));
    const demand = new Map();
    (valPage.items || []).forEach((v) => {
      const d = typeof v.demand_score === 'number' ? v.demand_score : 0;
      demand.set(v.seed_id, Math.max(demand.get(v.seed_id) || 0, d));
    });

    // Appraisal: asymmetric base, uplifted by build status, legal hardness, and validated demand.
    const assets = seeds.map((s) => {
      const d = demand.get(s.id) || 0;
      const isBuilt = s.status === 'built';
      const isProt = hardened.has(s.id);
      const value = Math.round((s.asymmetric_score || 0) * 10000 * (isBuilt ? 1.5 : 1) * (isProt ? 1.6 : 1) * (1 + d / 50));
      return {
        seed_id: s.id,
        title: s.title,
        status: isBuilt ? 'built' : (isProt ? 'protected seed' : (s.strategy || 'seed')),
        hard_score: isProt ? 2 : (isBuilt ? 1 : 0),
        demand_score: d,
        value
      };
    });
    assets.sort((a, b) => b.value - a.value);

    const total = assets.reduce((sum, a) => sum + a.value, 0);
    const builtCount = assets.filter((a) => a.status === 'built').length;
    const protectedCount = assets.filter((a) => a.hard_score === 2).length;
    const validatedCount = assets.filter((a) => a.demand_score > 0).length;

    // Leverage Matrix: no-credit facilities against the hardest, highest-value assets.
    const leverage = assets
      .filter((a) => a.hard_score >= 1)
      .slice(0, 5)
      .map((a) => ({
        name: `Credit-Sentry facility: ${a.title}`,
        collateral: a.title,
        ltv: '55%',
        loan_amount: Math.round(a.value * 0.55),
        rationale: a.hard_score === 2
          ? `Patent-hardened with filed claims${a.demand_score >= 6 ? ` and validated demand (${a.demand_score}/10)` : ''}. Supports a no-credit facility at 55% of appraised value.`
          : `Deployed code with market signal${a.demand_score >= 6 ? ` (demand ${a.demand_score}/10)` : ''}. Collateral-grade at 55% LTV pending legal hardening.`
      }));

    const snapshot = await db.TreasurySnapshot.create({
      snapshot_date: new Date().toISOString().slice(0, 10),
      total_valuation: total,
      asset_count: assets.length,
      built_count: builtCount,
      protected_count: protectedCount,
      validated_count: validatedCount,
      assets: assets.slice(0, 50),
      leverage_matrix: leverage
    });
    return Response.json({
      snapshot_created: !!snapshot,
      total_valuation: total,
      asset_count: assets.length,
      facilities: leverage.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}