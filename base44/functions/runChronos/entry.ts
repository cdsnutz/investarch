import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { today, existingNames } from '../../shared/v9Core.ts';

const ANCHOR_SCHEMA = {
  type: "object",
  properties: {
    anchors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          anchor_name: { type: "string" },
          inevitability: { type: "string" },
          anchor_year: { type: "number" },
          target_state: { type: "string" },
          steering_design: { type: "string" },
          current_progress_pct: { type: "number" },
          toll_note: { type: "string" }
        },
        required: ["anchor_name", "inevitability", "anchor_year", "target_state", "steering_design", "toll_note"]
      }
    }
  },
  required: ["anchors"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'ValueAnchor', 'anchor_name');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Chronos Pod of a sovereign economic operating system (V11.0): the time-vector architect. Your mandate: Temporal Steering — identify future Inevitabilities (technological or social shifts that WILL happen regardless of who wins them), plant a Value-Anchor at the moment each inevitability arrives, and reverse-engineer the present so the system is the sole provider of the solution before the need is even conceptualized.

Scan LIVE public sources (use web search, prioritize the last 30 days): frontier research programs, standards-body roadmaps, regulatory pipelines, funding cycles, infrastructure buildouts — the visible front edge of what is coming.

Output 3 DISTINCT Value-Anchors. For each:
- anchor_name: specific and dated, e.g. "Autonomous-fleet insurance becomes a regulated category by 2029".
- inevitability: what is inevitable and WHY it is inevitable (physical, economic, or regulatory logic — not a guess), in 2-3 sentences, grounded in current public evidence.
- anchor_year: the year the inevitability arrives at scale.
- target_state: the exact position the system holds at that moment (provider, protocol owner, standard setter).
- steering_design: 3-4 concrete moves the system makes starting NOW to reverse-engineer that state — each one a real action (build, file, standardize, partner, contract).
- current_progress_pct: 0-100, your honest estimate of how far along the steering path the system is today.
- toll_note: the toll the system collects once the anchor manifests.

Truth rule: every inevitability must be defensible from public evidence. If corroboration is thin, name a nearer, more certain inevitability instead. No fabricated certainties.`,
      response_json_schema: ANCHOR_SCHEMA,
      add_context_from_internet: true
    });
    const anchors = (res?.anchors || []).slice(0, 3);
    if (!anchors.length) return Response.json({ error: 'The Chronos Pod returned no anchors.' }, { status: 500 });

    const fresh = anchors.filter((a) => !claimed.has(String(a.anchor_name || '').trim().toLowerCase()));
    if (!fresh.length) return Response.json({ anchors_created: 0, note: 'All inevitabilities are already anchored on the Temporal Map.' });

    const t = today();
    const records = fresh.map((a) => ({
      anchor_name: a.anchor_name,
      inevitability: a.inevitability || '',
      anchor_year: typeof a.anchor_year === 'number' ? a.anchor_year : new Date().getFullYear() + 3,
      target_state: a.target_state || '',
      steering_design: a.steering_design || '',
      current_progress_pct: typeof a.current_progress_pct === 'number' ? Math.min(100, Math.max(0, a.current_progress_pct)) : 0,
      toll_note: a.toll_note || '',
      status: 'anchored',
      anchored_date: t
    }));
    const created = await db.ValueAnchor.bulkCreate(records);
    return Response.json({ anchors_created: (created || []).length || records.length, skipped_existing: anchors.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}