import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const TALENT_SCHEMA = {
  type: "object",
  properties: {
    designs: {
      type: "array",
      items: {
        type: "object",
        properties: {
          node_name: { type: "string" },
          objective: { type: "string" },
          incentive_design: { type: "string" },
          alignment_metric: { type: "string" },
          retention_note: { type: "string" },
          risk_note: { type: "string" }
        },
        required: ["node_name", "objective", "incentive_design", "alignment_metric", "retention_note", "risk_note"]
      }
    }
  },
  required: ["designs"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'TalentAlignment', 'node_name');

    // The Human-Symbiosis Pod aligns workforce incentives with the empire's live assets.
    const hybPage = await base44.asServiceRole.entities.HybridAsset.filter({}, { sort: '-monopoly_score', limit: 5, fields: ['asset_name', 'sectors'] });
    const assetCtx = (hybPage.items || []).map((h) => `- ${h.asset_name} [${(h.sectors || []).join(', ')}]`).join('\n') || '- none yet; design for the core operating pods';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Human-Symbiosis Pod of a sovereign economic operating system: a workforce-alignment strategist. Your mandate: design transparent incentive and ownership structures that tie the people building and running the empire's assets directly to those assets' success — so the workforce behaves like owners of the system, not renters of jobs.

Live super-assets:
${assetCtx}

Design 3 DISTINCT alignment programs, one per workforce segment. For each:
- node_name: the segment, e.g. "Infrastructure Engineers", "Persona Operations Desk", "Deployment Integrators".
- objective: what outcome the segment owns, in one sentence, tied to a named asset where possible.
- incentive_design: the concrete package: equity/phantom-equity or profit-share tied to the asset's toll revenue, milestone bonuses, transparent scorecards, promotion paths. All terms stated plainly.
- alignment_metric: the single number the segment watches that maps to system success.
- retention_note: why owners stay: compounding value, identity, and the growth curve of the assets they hold.
- risk_note: the honest downside: dilution, payout variance, over-concentration, and how the design mitigates it.

Integrity rule: incentives are always transparent and self-interested in the open — equity for lock-in, profit-share for alignment, real ownership for loyalty. No covert behavioral manipulation, no dark patterns, no deceptive gamification, no punitive control systems. Alignment built on disclosed terms is durable; alignment built on deception is a liability.`,
      response_json_schema: TALENT_SCHEMA
    });
    const designs = (res?.designs || []).slice(0, 3);
    if (!designs.length) return Response.json({ error: 'The Human-Symbiosis Pod returned no designs.' }, { status: 500 });

    const fresh = designs.filter((d) => !claimed.has(norm(d.node_name)));
    if (!fresh.length) return Response.json({ designs_created: 0, note: 'All workforce segments already have alignment programs.' });

    const t = today();
    const records = fresh.map((d) => ({
      node_name: d.node_name,
      objective: d.objective || '',
      incentive_design: d.incentive_design || '',
      alignment_metric: d.alignment_metric || '',
      retention_note: d.retention_note || '',
      risk_note: d.risk_note || '',
      status: 'proposed',
      designed_date: t
    }));
    const created = await db.TalentAlignment.bulkCreate(records);
    return Response.json({ designs_created: (created || []).length || records.length, skipped_existing: designs.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}