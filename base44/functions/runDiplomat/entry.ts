import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const LEVER_SCHEMA = {
  type: "object",
  properties: {
    levers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lever_name: { type: "string" },
          jurisdiction: { type: "string" },
          framework: { type: "string" },
          positioning_rationale: { type: "string" },
          compliance_path: { type: "string" },
          moat_strength: { type: "number" }
        },
        required: ["lever_name", "jurisdiction", "framework", "positioning_rationale", "compliance_path", "moat_strength"]
      }
    }
  },
  required: ["levers"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'RegulatoryLever', 'lever_name');

    // The Sovereign Diplomat reads the regulatory terrain so the empire positions inside it, lawfully.
    const layerPage = await base44.asServiceRole.entities.InfrastructureLayer.filter({}, { sort: '-projected_monthly_toll', limit: 10, fields: ['layer_name', 'category'] });
    const layerCtx = (layerPage.items || []).map((l) => `- ${l.layer_name} (${l.category})`).join('\n') || '- none forged';

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Sovereign Diplomat of a sovereign economic operating system: a regulatory-strategy analyst. Your mandate: map the regulatory terrain around the empire's assets and identify LAWFUL positioning moves that turn compliance into competitive advantage.

The empire's infrastructure layers:
${layerCtx}

Scan CURRENT regulatory reality (use web search): proposed rules, open public-comment periods, standards-body working groups, licensing regimes, data-residency and AI regulations in the US, EU, UK and major APAC markets.

Output 3 DISTINCT regulatory positions. For each:
- lever_name: specific, e.g. "EU AI Act transparency classes as a procurement moat".
- jurisdiction: country/market and the specific regulator or standards body.
- framework: the named regulation, rule, or standard, with its status (proposed/final/in force).
- positioning_rationale: 2-3 sentences on how being ahead of this framework makes the empire's assets the safe default for buyers, while laggards face re-engineering costs.
- compliance_path: the concrete lawful route: certifications, standards participation, public comments, audit readiness, published compliance documentation. Strictly lawful influence only.
- moat_strength: 1-10, your honest read of how durable the advantage is if the empire complies first.

Truth rule: cite the real framework names and statuses you found. Never suggest lobbying schemes, rule manipulation, or anything designed to make a competitor's business illegal. The moat comes from complying FIRST, not from changing the rules for others.`,
      response_json_schema: LEVER_SCHEMA,
      add_context_from_internet: true
    });
    const levers = (res?.levers || []).slice(0, 3);
    if (!levers.length) return Response.json({ error: 'The Sovereign Diplomat returned no levers.' }, { status: 500 });

    const fresh = levers.filter((l) => !claimed.has(norm(l.lever_name)));
    if (!fresh.length) return Response.json({ levers_created: 0, note: 'All regulatory positions are already in the Influence Ledger.' });

    const t = today();
    const records = fresh.map((l) => ({
      lever_name: l.lever_name,
      jurisdiction: l.jurisdiction || '',
      framework: l.framework || '',
      positioning_rationale: l.positioning_rationale || '',
      compliance_path: l.compliance_path || '',
      moat_strength: typeof l.moat_strength === 'number' ? l.moat_strength : 5,
      status: 'identified',
      analyzed_date: t
    }));
    const created = await db.RegulatoryLever.bulkCreate(records);
    return Response.json({ levers_created: (created || []).length || records.length, skipped_existing: levers.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}