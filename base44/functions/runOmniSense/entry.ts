import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { norm, today, existingNames } from '../../shared/v9Core.ts';

const SIGNAL_SCHEMA = {
  type: "object",
  properties: {
    signals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          signal_name: { type: "string" },
          domain: { type: "string" },
          observation: { type: "string" },
          pre_emptive_gap: { type: "string" },
          action_window_days: { type: "number" },
          confidence: { type: "number" },
          signal_sources: { type: "array", items: { type: "string" } },
          recommended_strike: { type: "string" }
        },
        required: ["signal_name", "domain", "observation", "pre_emptive_gap", "action_window_days", "confidence", "signal_sources", "recommended_strike"]
      }
    }
  },
  required: ["signals"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const claimed = await existingNames(base44, 'LiveSignal', 'signal_name');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Omni-Sense Pod of a sovereign economic operating system: a real-time intelligence feed. Your mandate: surface what is happening RIGHT NOW in open markets — signals manifesting this week, not long-horizon predictions — and name the pre-emptive gap each one exposes.

Scan LIVE public sources (use web search, prioritize the last 7-14 days): market moves, funding rounds announced this week, product launches, standards-body updates, policy dockets, developer-platform changelogs, shipping/port and commodity data that is public, job-posting surges by named companies.

Output 4 DISTINCT live signals. For each:
- signal_name: specific and dated, e.g. "Chip-leasing demand spikes after X's fab announcement".
- domain: the sector.
- observation: what is verifiably happening now, in 2-3 sentences, with named sources.
- pre_emptive_gap: the gap that exists for days or weeks before the broader market prices it in.
- action_window_days: your honest estimate of how long the window stays open.
- confidence: 1-10, weighted by how many independent sources corroborate.
- signal_sources: 3-4 named, public sources you actually found (outlets, filings, official pages).
- recommended_strike: the single fastest lawful move the empire can make inside the window (file, register, publish, ship, partner).

Truth rule: open, public data only — no surveillance, no non-public or personal data, no fabricated observations. If corroboration is thin, say so and lower the confidence.`,
      response_json_schema: SIGNAL_SCHEMA,
      add_context_from_internet: true
    });
    const signals = (res?.signals || []).slice(0, 4);
    if (!signals.length) return Response.json({ error: 'The Omni-Sense Pod returned no signals.' }, { status: 500 });

    const fresh = signals.filter((s) => !claimed.has(norm(s.signal_name)));
    if (!fresh.length) return Response.json({ signals_created: 0, note: 'All live signals are already on the value-stream.' });

    const t = today();
    const records = fresh.map((s) => ({
      signal_name: s.signal_name,
      domain: s.domain || '',
      observation: s.observation || '',
      pre_emptive_gap: s.pre_emptive_gap || '',
      action_window_days: typeof s.action_window_days === 'number' ? s.action_window_days : 14,
      confidence: typeof s.confidence === 'number' ? s.confidence : 5,
      signal_sources: Array.isArray(s.signal_sources) ? s.signal_sources : [],
      recommended_strike: s.recommended_strike || '',
      status: 'observed',
      observed_date: t
    }));
    const created = await db.LiveSignal.bulkCreate(records);
    return Response.json({ signals_created: (created || []).length || records.length, skipped_existing: signals.length - fresh.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}