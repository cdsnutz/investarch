import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today } from '../../shared/v9Core.ts';

const EPOCH_SCHEMA = {
  type: "object",
  properties: {
    epoch_name: { type: "string" },
    total_absorption_pct: { type: "number" },
    years: {
      type: "array",
      items: {
        type: "object",
        properties: { year: { type: "number" }, absorption_pct: { type: "number" }, note: { type: "string" } },
        required: ["year", "absorption_pct", "note"]
      }
    },
    verdict: { type: "string" }
  },
  required: ["epoch_name", "total_absorption_pct", "years", "verdict"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    // The Omni-Cortex fuses every V9 ledger into one recursive 10-year absorption projection.
    const [narPage, hybPage, perPage, levPage, snapPage, hegPage] = await Promise.all([
      base44.asServiceRole.entities.NarrativeVector.filter({}, { limit: 200, fields: ['narrative_name', 'adoption_forecast_pct', 'status'] }),
      base44.asServiceRole.entities.HybridAsset.filter({}, { limit: 200, fields: ['asset_name', 'monopoly_score', 'status'] }),
      base44.asServiceRole.entities.SyntheticPersona.filter({}, { limit: 200, fields: ['persona_name', 'audience_estimate', 'status'] }),
      base44.asServiceRole.entities.RegulatoryLever.filter({}, { limit: 200, fields: ['lever_name', 'moat_strength', 'status'] }),
      base44.asServiceRole.entities.EpochSnapshot.filter({}, { sort: '-projection_date', limit: 1, fields: ['epoch_name', 'total_absorption_pct'] }),
      base44.asServiceRole.entities.HegemonySnapshot.filter({}, { sort: '-snapshot_date', limit: 1, fields: ['market_grip_pct', 'hegemony_score'] })
    ]);

    const narratives = narPage.items || [];
    const hybrids = hybPage.items || [];
    const personas = perPage.items || [];
    const levers = levPage.items || [];
    const grip = hegPage.items?.[0]?.market_grip_pct ?? 0;
    const prev = snapPage.items?.[0];

    if (!narratives.length && !hybrids.length) {
      return Response.json({ error: 'The Omni-Cortex needs at least one narrative or hybrid asset before it can project an epoch.' }, { status: 400 });
    }

    const ctx = [
      `Market Grip (V8 measure): ${grip}%`,
      `Narrative positions: ${narratives.map((n) => `${n.narrative_name} (${n.status}, forecast ${n.adoption_forecast_pct}%)`).join('; ') || 'none'}`,
      `Hybrid assets: ${hybrids.map((h) => `${h.asset_name} (${h.status}, monopoly ${h.monopoly_score})`).join('; ') || 'none'}`,
      `Personas: ${personas.map((p) => `${p.persona_name} (${p.status}, ~${p.audience_estimate})`).join('; ') || 'none'}`,
      `Regulatory positions: ${levers.map((l) => `${l.lever_name} (moat ${l.moat_strength})`).join('; ') || 'none'}`,
      prev ? `Previous epoch: ${prev.epoch_name} projected ${prev.total_absorption_pct}% absorption` : 'No previous epoch; this is the founding projection.'
    ].join('\n');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Omni-Cortex: the recursive singularity core of a sovereign economic operating system. It has completed the full Singularity Cycle; your mandate is to project the empire's EPOCH: a 10-year trajectory of total economic absorption across its target sectors, named as an era of dominance.

Current state:
${ctx}

Produce the epoch projection:
- epoch_name: a commanding era name for this cycle, e.g. "Epoch of Synthetic Necessity I".
- total_absorption_pct: 0-100, your honest 10-year end-state estimate of the empire's share of the addressable spend in its target sectors.
- years: all 10 entries, year = the calendar year starting next year, absorption_pct = conservative year-by-year absorption, note = the ONE bottleneck or unlock that gates that year's number.
- verdict: 2-3 sentences of strategic verdict: the biggest constraint on the trajectory and the single lever that raises it most.

Truth rule: base the curve on the actual state above (scores, statuses, audience sizes), not on ambition. If the portfolio is thin, the curve stays flat and the verdict says what is missing. Never inflate.`,
      response_json_schema: EPOCH_SCHEMA
    });
    const epoch = res;
    if (!epoch || !Array.isArray(epoch.years) || !epoch.years.length) {
      return Response.json({ error: 'The Omni-Cortex returned no epoch projection.' }, { status: 500 });
    }

    const t = today();
    const created = await db.EpochSnapshot.create({
      epoch_name: epoch.epoch_name || `Epoch of ${t}`,
      projection_date: t,
      total_absorption_pct: typeof epoch.total_absorption_pct === 'number' ? epoch.total_absorption_pct : 0,
      narrative_count: narratives.length,
      hybrid_count: hybrids.length,
      persona_count: personas.length,
      lever_count: levers.length,
      years: epoch.years.slice(0, 10).map((y) => ({
        year: typeof y.year === 'number' ? y.year : 0,
        absorption_pct: typeof y.absorption_pct === 'number' ? y.absorption_pct : 0,
        note: y.note || ''
      })),
      verdict: epoch.verdict || ''
    });
    return Response.json({ snapshot_created: true, epoch_name: created?.epoch_name, total_absorption_pct: created?.total_absorption_pct });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}