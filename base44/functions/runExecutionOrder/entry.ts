import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const [seedPage, filingPage, valPage, treasPage, prospectusPage] = await Promise.all([
      base44.asServiceRole.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 300, fields: ['title', 'asymmetric_score', 'status', 'strategy'] }),
      base44.asServiceRole.entities.IpFiling.filter({}, { limit: 500, fields: ['seed_id'] }),
      base44.asServiceRole.entities.GhostValidation.filter({}, { limit: 500, fields: ['seed_id', 'demand_score'] }),
      base44.asServiceRole.entities.TreasurySnapshot.filter({}, { sort: '-created_date', limit: 1 }),
      base44.asServiceRole.entities.IpProspectus.filter({}, { limit: 500, fields: ['seed_id'] })
    ]);
    const seeds = seedPage.items || [];
    if (!seeds.length) return Response.json({ note: 'No seeds in the portfolio yet.' });

    const hardened = new Set((filingPage.items || []).map((f) => f.seed_id));
    const liquidated = new Set((prospectusPage.items || []).map((p) => p.seed_id));
    const demand = new Map();
    (valPage.items || []).forEach((v) => {
      const d = typeof v.demand_score === 'number' ? v.demand_score : 0;
      demand.set(v.seed_id, Math.max(demand.get(v.seed_id) || 0, d));
    });

    // BUILD: validated demand outruns development.
    let build = seeds
      .filter((s) => s.status !== 'built' && (demand.get(s.id) || 0) >= 7)
      .slice(0, 3)
      .map((s) => ({
        seed_id: s.id,
        title: s.title,
        rationale: `Ghost validation reads ${demand.get(s.id)}/10 demand. Move idea to full-stack app today; the wedge is proven.`
      }));
    if (!build.length) {
      build = seeds.filter((s) => s.status !== 'built').slice(0, 2).map((s) => ({
        seed_id: s.id,
        title: s.title,
        rationale: `No validated seed cleared demand 7. Build the top asymmetric asset (${s.asymmetric_score}/10) to start compounding.`
      }));
    }

    // PROTECT: block fast followers on high-score unhardened assets.
    const protect = seeds
      .filter((s) => !hardened.has(s.id) && (s.asymmetric_score || 0) >= 8)
      .slice(0, 3)
      .map((s) => ({
        seed_id: s.id,
        title: s.title,
        filing_type: 'patent',
        rationale: `Asymmetric score ${s.asymmetric_score}/10 with no legal hardness. File claims now to fence the category before a rising competitor lands.`
      }));

    // LIQUIDATE: flip-class assets not yet offered for sale.
    const liquidate = seeds
      .filter((s) => s.strategy === 'flip' && !liquidated.has(s.id))
      .slice(0, 3)
      .map((s) => ({
        seed_id: s.id,
        title: s.title,
        rationale: 'Flip-class asset. Issue the sales prospectus and liquidate the mini-plan for immediate capital.'
      }));

    // LEVERAGE: borrow against the hardest assets from the latest Treasury appraisal.
    const latest = (treasPage.items || [])[0];
    const leverage = (latest?.leverage_matrix || []).slice(0, 3).map((l) => ({
      title: l.collateral,
      rationale: `${l.name}: ${l.ltv} LTV, ${new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(l.loan_amount || 0)}. ${l.rationale || ''}`
    }));

    const order = await db.ExecutionOrder.create({
      order_date: new Date().toISOString().slice(0, 10),
      build,
      protect,
      liquidate,
      leverage,
      total_portfolio_value: latest?.total_valuation || 0
    });
    return Response.json({
      order_created: !!order,
      build: build.length,
      protect: protect.length,
      liquidate: liquidate.length,
      leverage: leverage.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}