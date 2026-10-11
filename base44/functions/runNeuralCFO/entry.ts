import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    const [ledgerPage, decisionPage, seedPage, filingPage, valPage] = await Promise.all([
      base44.entities.LedgerEntry.filter({}, { limit: 500, fields: ['entry_type', 'amount'] }),
      base44.entities.ReinvestmentDecision.filter({}, { limit: 500, fields: ['allocation'] }),
      base44.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 300, fields: ['title', 'asymmetric_score', 'status', 'strategy'] }),
      base44.entities.IpFiling.filter({}, { limit: 500, fields: ['seed_id'] }),
      base44.entities.GhostValidation.filter({}, { limit: 500, fields: ['seed_id', 'demand_score'] })
    ]);

    const entries = ledgerPage.items || [];
    const revenue = entries.filter((e) => e.entry_type === 'revenue').reduce((s, e) => s + (e.amount || 0), 0);
    const spent = entries.filter((e) => e.entry_type !== 'revenue').reduce((s, e) => s + (e.amount || 0), 0);
    const previouslyAllocated = (decisionPage.items || []).reduce((s, d) => s + (d.allocation || 0), 0);
    const available = revenue - spent - previouslyAllocated;

    const seeds = seedPage.items || [];
    const hardened = new Set((filingPage.items || []).map((f) => f.seed_id));
    const demand = new Map();
    (valPage.items || []).forEach((v) => {
      const d = typeof v.demand_score === 'number' ? v.demand_score : 0;
      demand.set(v.seed_id, Math.max(demand.get(v.seed_id) || 0, d));
    });

    const today = new Date().toISOString().slice(0, 10);
    const decisions = [];

    if (available <= 0) {
      decisions.push({
        decision: 'hold',
        target_title: 'Corporate Treasury',
        allocation: 0,
        rationale: `No unallocated capital: revenue ${Math.round(revenue)} against ${Math.round(spent)} spent and ${Math.round(previouslyAllocated)} already committed. The portfolio holds until live assets produce revenue.`,
        decision_date: today
      });
    } else {
      // Option A: scale the winning live asset (raise ad spend where demand is proven).
      const winner = seeds
        .filter((s) => s.status === 'built')
        .sort((a, b) => (demand.get(b.id) || 0) - (demand.get(a.id) || 0))[0];
      if (winner) {
        decisions.push({
          decision: 'scale',
          target_title: winner.title,
          allocation: Math.round(available * 0.4),
          rationale: `Winning live asset with demand ${demand.get(winner.id) || 0}/10. Route 40% of free capital into its traffic kit to compound revenue.`,
          decision_date: today
        });
      }
      // Option B: fund legal hardening of the strongest unprotected IP.
      const unprotected = seeds
        .filter((s) => !hardened.has(s.id) && (s.asymmetric_score || 0) >= 7)
        .sort((a, b) => (b.asymmetric_score || 0) - (a.asymmetric_score || 0))[0];
      if (unprotected) {
        decisions.push({
          decision: 'patent',
          target_title: unprotected.title,
          allocation: Math.round(available * 0.35),
          rationale: `Highest-value unhardened IP (asymmetric ${unprotected.asymmetric_score}/10). Allocate 35% of free capital to filing fees and claims drafting to block fast followers.`,
          decision_date: today
        });
      }
      // Option C: absorb a smaller adjacent player's user base.
      decisions.push({
        decision: 'acquire',
        target_title: 'Adjacent micro-asset acquisition',
        allocation: available - decisions.reduce((s, d) => s + d.allocation, 0),
        rationale: 'Residual capital held ready to absorb a smaller competitor asset and fold its user base into the ecosystem.',
        decision_date: today
      });
    }

    const createdDecisions = await db.ReinvestmentDecision.bulkCreate(decisions);
    return Response.json({
      decisions_created: (createdDecisions || []).length || decisions.length,
      revenue: Math.round(revenue),
      spent: Math.round(spent),
      available: Math.round(available)
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}