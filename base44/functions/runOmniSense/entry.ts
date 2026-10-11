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

    // Correlation pass: prior signals + already-staked vectors + seeded narratives, so new
    // signals extend known intelligence instead of restating it.
    const [priorPage, vectorPage, narrativePage] = await Promise.all([
      base44.asServiceRole.entities.LiveSignal.filter({}, { sort: '-observed_date', limit: 12, fields: ['signal_name', 'domain', 'observation'] }),
      base44.asServiceRole.entities.MarketVector.filter({}, { sort: '-conviction_score', limit: 12, fields: ['vector_name', 'sector'] }),
      base44.asServiceRole.entities.NarrativeVector.filter({}, { sort: '-created_date', limit: 8, fields: ['narrative_name', 'target_market'] })
    ]);
    const priorCtx = (priorPage.items || []).map((s) => `- ${s.signal_name} [${s.domain}]`).join('\n');
    const vectorCtx = (vectorPage.items || []).map((v) => `- ${v.vector_name} [${v.sector}]`).join('\n');
    const narrativeCtx = (narrativePage.items || []).map((n) => `- ${n.narrative_name} [${n.target_market || ''}]`).join('\n');

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the Omni-Sense Pod of a sovereign economic operating system: a real-time intelligence feed. Your mandate: surface what is happening RIGHT NOW in open markets — signals manifesting this week, not long-horizon predictions — and name the pre-emptive gap each one exposes.

Scan LIVE public sources (use web search, prioritize the last 7-14 days): market moves, funding rounds announced this week, product launches, standards-body updates, policy dockets, developer-platform changelogs, shipping/port and commodity data that is public, job-posting surges by named companies.

${priorCtx ? `ALREADY ON THE VALUE-STREAM (do not re-report these; a new signal must add a genuinely new dimension, a different domain, or a materially tighter pre-emptive gap):\n${priorCtx}\n\n` : ''}${vectorCtx ? `VECTORS ALREADY STAKED (correlate against these: report only the live confirmation or the divergence since staking, never the vector itself):\n${vectorCtx}\n\n` : ''}${narrativeCtx ? `NARRATIVES ALREADY SEEDED:\n${narrativeCtx}\n\n` : ''}
Correlation rules (deep-scan pass):
- Each signal must be corroborated by at least 2 independent public sources; set confidence strictly in proportion to corroboration count and recency (5 = two sources, 10 = four or more across distinct outlets).
- Where two candidate events are the same underlying story, MERGE them into one stronger signal rather than reporting duplicates.
- If a live event confirms or contradicts an already-staked vector above, report only what is NEW since that vector was staked.

Output 4 DISTINCT live signals, each from a different domain. For each:
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

    // Accuracy pass: every stored signal must carry at least 2 named corroborating sources,
    // and no near-duplicate of a prior signal (token overlap over the last recorded names).
    const overlap = (a, b) => {
      const at = new Set(norm(a).split(/\s+/).filter((w) => w.length > 3));
      const bt = new Set(norm(b).split(/\s+/).filter((w) => w.length > 3));
      if (!at.size || !bt.size) return 0;
      let shared = 0;
      for (const w of at) if (bt.has(w)) shared++;
      return shared / Math.min(at.size, bt.size);
    };
    const fresh = signals.filter((s) =>
      !claimed.has(norm(s.signal_name)) &&
      Array.isArray(s.signal_sources) && s.signal_sources.filter(Boolean).length >= 2 &&
      !(priorPage.items || []).some((p) => overlap(s.signal_name, p.signal_name) >= 0.6)
    );
    if (!fresh.length) return Response.json({ signals_created: 0, note: 'No signals cleared the corroboration and novelty bar.' });

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