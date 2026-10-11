import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SIGNALS_SCHEMA = {
  type: "object",
  properties: {
    signals: {
      type: "array",
      items: {
        type: "object",
        properties: {
          pain_signal: { type: "string" },
          gap_summary: { type: "string" },
          source_channel: { type: "string" }
        },
        required: ["pain_signal", "gap_summary", "source_channel"]
      }
    }
  },
  required: ["signals"]
};

const SEEDS_SCHEMA = {
  type: "object",
  properties: {
    seeds: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          gap: { type: "string" },
          pain_signal: { type: "string" },
          source_channel: { type: "string" },
          solution: { type: "string" },
          asymmetric_score: { type: "number" },
          mini_plan: { type: "string" },
          blueprint: {
            type: "object",
            properties: {
              tech_stack: { type: "array", "items": { type: "string" } },
              db_schema: { type: "string" },
              core_logic: { type: "string" }
            },
            required: ["tech_stack", "db_schema", "core_logic"]
          }
        },
        required: ["title", "gap", "pain_signal", "source_channel", "solution", "asymmetric_score", "mini_plan", "blueprint"]
      }
    }
  },
  required: ["seeds"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    // --- Stage 1: The Signal Miner — live market SIGINT for pain-signals ---
    const signalPrompt = `You are a market SIGINT operator running live reconnaissance across consumer and developer channels (Reddit threads, X posts, app-store reviews, patent filings, niche forums).

Identify 12 DISTINCT, currently-live PAIN-SIGNALS: moments where a clearly-stated or strongly-implied market demand has NO competent technical answer, or where existing solutions are thin wrappers, abandoned, or universally complained about.

For each signal return:
1. pain_signal — a verbatim-style quote or tight paraphrase of the complaint/demand, with enough context to be verifiable (name the community, product, or domain it comes from).
2. gap_summary — the precise market lacuna: what buyers want, what exists today, and why what exists fails.
3. source_channel — where this signal lives (e.g. "r/smallbusiness thread on invoicing", "1-star reviews of X on the App Store", "USPTO filings in Y class").

Rules: no invented quotes attributed to real people. If evidence is inferential rather than quoted, label it as inferred. Density over breadth: every signal must name a specific failed solution or a specific unmet demand.`;

    const signalsRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: signalPrompt,
      add_context_from_internet: true,
      response_json_schema: SIGNALS_SCHEMA
    });
    const signals = (signalsRes?.signals || []).slice(0, 12);
    if (!signals.length) return Response.json({ error: 'Signal Miner returned no signals.' }, { status: 502 });

    // --- Stage 2: The Synthesizer — asymmetric innovation into 20 IP-seeds ---
    const seedPrompt = `You are the Synthesizer of an IP Factory. Below are 12 live market pain-signals from the Signal Miner. Convert them into EXACTLY 20 IP-SEEDS by applying Asymmetric Innovation: do not merely solve the stated problem — position each solution as the category-owning answer ("Category King") that makes incumbents look obsolete.

PAIN-SIGNALS:
${JSON.stringify(signals)}

For each seed return:
1. title — a sharp asset name (product-grade, trademarkable feel).
2. gap — the market lacunae in 1-2 sentences, naming the specific failure being exploited.
3. pain_signal — the signal this seed is built from (copy or tighten from the input).
4. source_channel — where the signal was observed.
5. solution — the technical approach in 2-3 sentences. It must be implementable with a normal web stack; no hand-waving ("AI" is not an architecture).
6. asymmetric_score — 1 to 10: how hard the gap is to close for incumbents versus how valuable closing it is. Score truthfully; most seeds should land 4 to 8.
7. mini_plan — a high-density business case, 90 to 140 words: buyer, wedge, revenue mechanism, why-now, and the moat. Institutional tone. No filler adjectives.
8. blueprint — full-stack app architecture: tech_stack (4 to 6 concrete choices), db_schema (the core tables with key columns, one compact paragraph), core_logic (the hardest algorithmic piece and how it works, one compact paragraph).

Count is non-negotiable: EXACTLY 20 seeds, even where that means two or three different solutions attacking the SAME signal from different angles (different buyer, different wedge, different revenue mechanism). No two seeds in the same micro-category. Every sentence must carry utility — zero filler.`;

    const seedsRes = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: seedPrompt,
      response_json_schema: SEEDS_SCHEMA
    });
    const seeds = (seedsRes?.seeds || []).slice(0, 20);
    if (!seeds.length) return Response.json({ error: 'Synthesizer returned no seeds.' }, { status: 502 });

    const yieldDate = new Date().toISOString().slice(0, 10);
    const records = seeds.map((s) => ({
      title: s.title,
      gap: s.gap,
      pain_signal: s.pain_signal || '',
      source_channel: s.source_channel || '',
      solution: s.solution,
      asymmetric_score: typeof s.asymmetric_score === 'number' ? s.asymmetric_score : 5,
      mini_plan: s.mini_plan || '',
      blueprint: s.blueprint || { tech_stack: [], db_schema: '', core_logic: '' },
      strategy: 'hold',
      status: 'seed',
      yield_date: yieldDate
    }));
    const created = await db.IpSeed.bulkCreate(records);
    return Response.json({ signals_found: signals.length, seeds_created: (created || []).length || records.length, yield_date: yieldDate });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}