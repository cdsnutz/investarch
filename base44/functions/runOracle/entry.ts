import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { IP_VECTORS } from '../../shared/ipVectors.ts';

// The Oracle stakes forecasts, so it is graded later on whether the vector arrived.
// Everything here exists to keep it honest: ledger memory so it cannot repeat a claim,
// a falsifier it must write before it is allowed to predict, and hard validation that
// rejects thin or placeholder output rather than storing it.

const FORECASTS_PER_RUN = 5;
const MIN_ACCEPTABLE = 3;
const LEDGER_MEMORY = 200;
const SEED_MEMORY = 80;

const VECTOR_SCHEMA = {
  type: 'object',
  properties: {
    vectors: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          vector_name: { type: 'string' },
          sector: { type: 'string' },
          gold_rush_thesis: { type: 'string' },
          why_now: { type: 'string' },
          falsifier: { type: 'string' },
          signal_grade: { type: 'string', enum: ['strong', 'moderate', 'weak'] },
          leading_indicators: { type: 'array', items: { type: 'string' } },
          horizon_months: { type: 'number' },
          arrival_probability: { type: 'number' },
          conviction_score: { type: 'number' },
          staked_assets: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                type: { type: 'string' },
                detail: { type: 'string' }
              },
              required: ['type', 'detail']
            }
          }
        },
        required: [
          'vector_name',
          'sector',
          'gold_rush_thesis',
          'why_now',
          'falsifier',
          'signal_grade',
          'leading_indicators',
          'horizon_months',
          'arrival_probability',
          'conviction_score',
          'staked_assets'
        ]
      }
    }
  },
  required: ['vectors']
};

const ASSET_TYPES = ['patent', 'domain', 'api', 'brand', 'protocol'];
const PLACEHOLDER = /\b(lorem|todo|tbd|example vector|placeholder|n\/a)\b/i;

const norm = (value) => String(value || '').trim().toLowerCase();

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'into', 'from', 'that', 'this', 'their', 'its', 'are', 'will',
  'a', 'an', 'of', 'in', 'on', 'to', 'as', 'by', 'at', 'or', 'be', 'is', 'it', 'new', 'next'
]);

function tokens(text) {
  return new Set(
    norm(text)
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((word) => word.length > 2 && !STOPWORDS.has(word))
  );
}

function overlap(a, b) {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const token of a) if (b.has(token)) shared += 1;
  return shared / (a.size + b.size - shared);
}

const clamp = (value, fallback, low, high) => {
  const number = typeof value === 'number' && Number.isFinite(value) ? value : fallback;
  return Math.min(high, Math.max(low, number));
};

const round = (value, places = 0) => Number(value.toFixed(places));

function addMonths(date, months) {
  const next = new Date(date.getTime());
  next.setMonth(next.getMonth() + months);
  return next.toISOString().slice(0, 10);
}

// Rejects rather than repairs: a forecast is either grounded or it is not stored.
function critique(vector) {
  const problems = [];
  const name = String(vector?.vector_name || '').trim();
  const thesis = String(vector?.gold_rush_thesis || '').trim();
  const whyNow = String(vector?.why_now || '').trim();
  const falsifier = String(vector?.falsifier || '').trim();
  const indicators = Array.isArray(vector?.leading_indicators) ? vector.leading_indicators : [];
  const assets = Array.isArray(vector?.staked_assets) ? vector.staked_assets : [];

  if (name.length < 8 || name.length > 140) problems.push('name too thin');
  if (thesis.length < 120) problems.push('thesis under 120 characters');
  if (whyNow.length < 60) problems.push('why_now under 60 characters');
  if (falsifier.length < 60) problems.push('falsifier under 60 characters');
  if (indicators.filter((item) => String(item || '').trim().length >= 16).length < 3) {
    problems.push('fewer than 3 named indicators');
  }
  const validAssets = assets.filter(
    (asset) => asset && ASSET_TYPES.includes(norm(asset.type)) && String(asset.detail || '').trim().length >= 12
  );
  if (validAssets.length < 2) problems.push('fewer than 2 actionable claims');

  if ([name, thesis, whyNow, falsifier, ...indicators.map((i) => String(i))].some((text) => PLACEHOLDER.test(text))) {
    problems.push('placeholder text');
  }

  return { problems, validAssets };
}

function ledgerBlock(vectors, seeds) {
  const claims = vectors
    .map((vector) => `- ${vector.vector_name} (${vector.sector || 'unspecified'}, ${vector.status || 'predicted'})`)
    .join('\n');
  const held = seeds.map((seed) => `- ${seed.title}`).join('\n');

  return `CLAIMED ALREADY — do not repeat, rename, split or restate any of these. A near-duplicate is a wasted prediction:
${claims || '- Nothing claimed yet.'}

THE OPERATOR ALREADY HOLDS THESE ASSETS — a vector that just restates one of them is not a forecast:
${held || '- No assets held yet.'}

MARKET TAXONOMY — align to a vector below or depart from it deliberately, and say in the thesis why the departure is where the money moves:
${IP_VECTORS.map((vector) => `- ${vector.label}: ${vector.brief}`).join('\n')}`;
}

function promptFor(ledger, forbidden) {
  const avoid = forbidden.length
    ? `\n\nFORBIDDEN — these were already produced and rejected or claimed. Do not return them or anything close to them:\n${forbidden
        .map((name) => `- ${name}`)
        .join('\n')}`
    : '';

  return `You are the Oracle inside InvestArch: a foresight engine that stakes intellectual-property claims 6-18 months BEFORE a market arrives. You are graded later on whether the vector actually arrived. Overclaiming is a failed forecast, not an impressive one.

Search the web for CURRENT leading indicators and reason only from what you find: fresh patent filings and classes, VC fund deployments and thesis pages, arXiv and conference papers, developer-tool adoption, procurement notices, regulatory dockets, geopolitical supply-chain moves, job postings at a specific company. Mainstream and crowded markets are dead claims — if everyone already knows, it is too late.

${ledger}${avoid}

Return exactly ${FORECASTS_PER_RUN} distinct vectors, each 6-18 months out:
- vector_name: sharp and specific ("Agentic Compliance Layers for Cross-Border Payroll"), never a generic trend label.
- sector: the market it sits in.
- gold_rush_thesis: 2-3 sentences on why a land-grab erupts here, citing the indicators you found. State what the winner owns.
- why_now: the single trigger that opens the window in the next two quarters — a filing, a rule, a price move, a fund, a launch. Not "AI is growing".
- falsifier: the concrete observation that would prove this wrong, and how you would see it. If you cannot name one, the vector is a belief, not a forecast — do not return it.
- signal_grade: strong, moderate or weak — your honest grade of the evidence actually found. Most vectors are moderate; use weak when search was thin and say so in the thesis.
- leading_indicators: 3-5 signals, each naming the source or fact (patent class, fund, paper title, docket, company), not a paraphrase.
- horizon_months: 6-18. arrival_probability: 0-100. conviction_score: 1-10, weighted by indicator strength, never by narrative appeal.
- staked_assets: 3-5 claims to secure FIRST, each {type: "patent"|"domain"|"api"|"brand"|"protocol", detail: the specific thing to file, register or build before the market arrives}. A claim must be specific enough to execute this quarter.

Truth rule: weak evidence gets a weak grade and a lower conviction. Never inflate to look prescient.`;
}

function recordFor(vector, validAssets, runId, today) {
  const horizon = round(clamp(vector.horizon_months, 12, 3, 24));
  const grade = ['strong', 'moderate', 'weak'].includes(norm(vector.signal_grade)) ? norm(vector.signal_grade) : 'moderate';
  const ceiling = grade === 'strong' ? 10 : grade === 'moderate' ? 7 : 4;

  return {
    vector_name: String(vector.vector_name).trim(),
    sector: String(vector.sector || '').trim(),
    gold_rush_thesis: String(vector.gold_rush_thesis).trim(),
    why_now: String(vector.why_now).trim(),
    falsifier: String(vector.falsifier).trim(),
    signal_grade: grade,
    leading_indicators: vector.leading_indicators.map((item) => String(item).trim()).filter(Boolean),
    horizon_months: horizon,
    arrival_probability: round(clamp(vector.arrival_probability, 50, 0, 100)),
    // Conviction is capped by the evidence grade, so a thin search cannot claim certainty.
    conviction_score: round(Math.min(clamp(vector.conviction_score, 5, 1, 10), ceiling), 1),
    staked_assets: validAssets.map((asset) => ({ type: norm(asset.type), detail: String(asset.detail).trim() })),
    status: 'predicted',
    predicted_date: today,
    kill_date: addMonths(new Date(today), horizon),
    oracle_run: runId
  };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const ledger = await base44.entities.MarketVector.filter(
      {},
      { limit: LEDGER_MEMORY, fields: ['vector_name', 'sector', 'status'] }
    );
    const seeds = await base44.entities.IpSeed.filter({}, { limit: SEED_MEMORY, fields: ['title'] });
    const claimedVectors = ledger.items || [];
    const claimed = claimedVectors.map((vector) => ({
      tokens: tokens(`${vector.vector_name} ${vector.sector || ''}`),
      name: vector.vector_name
    }));

    const today = new Date().toISOString().slice(0, 10);
    const runId = `${today}-${Math.random().toString(36).slice(2, 8)}`;
    const ledgerText = ledgerBlock(claimedVectors, seeds.items || []);

    // Two passes at most: the second is told exactly what was already refused or claimed.
    const forbidden = claimed.map((entry) => entry.name);
    const accepted = [];
    let rejected = 0;

    for (let pass = 0; pass < 2 && accepted.length < MIN_ACCEPTABLE; pass += 1) {
      const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: promptFor(ledgerText, forbidden),
        response_json_schema: VECTOR_SCHEMA,
        add_context_from_internet: true
      });
      const vectors = (res?.vectors || []).slice(0, FORECASTS_PER_RUN);

      for (const vector of vectors) {
        const { problems, validAssets } = critique(vector);
        const vectorTokens = tokens(`${vector?.vector_name || ''} ${vector?.sector || ''}`);

        if (problems.length) {
          rejected += 1;
          forbidden.push(String(vector?.vector_name || 'unnamed'));
          console.log(`runOracle: rejected "${vector?.vector_name}" — ${problems.join('; ')}`);
          continue;
        }
        const duplicate = claimed.find((entry) => overlap(entry.tokens, vectorTokens) >= 0.55);
        if (duplicate) {
          forbidden.push(String(vector.vector_name));
          console.log(`runOracle: "${vector.vector_name}" overlaps existing claim "${duplicate.name}"`);
          continue;
        }
        claimed.push({ tokens: vectorTokens, name: vector.vector_name });
        forbidden.push(String(vector.vector_name));
        accepted.push(recordFor(vector, validAssets, runId, today));
      }

      if (!accepted.length) {
        console.log(`runOracle: pass ${pass + 1} produced no acceptable vectors`);
      }
    }

    if (!accepted.length) {
      const error = 'The Oracle produced no vector that passed its own evidence test. Nothing was stored.';
      console.error(`runOracle: ${error}`);
      return Response.json({ error }, { status: 502 });
    }

    const created = await base44.entities.MarketVector.bulkCreate(accepted);
    const stored = (created || []).length || accepted.length;

    await base44.entities.ActivityEvent.create({
      action: 'oracle_run',
      detail: `Oracle forecast ${stored} vector${stored === 1 ? '' : 's'} (run ${runId}), rejected ${rejected} for thin or duplicate evidence.`,
      timestamp: new Date().toISOString()
    }).catch((auditError) => console.warn('runOracle: activity write failed:', auditError?.message));

    return Response.json({
      vectors_created: stored,
      rejected,
      skipped_existing: claimed.length - accepted.length - rejected,
      strongest: accepted.slice().sort((a, b) => b.conviction_score - a.conviction_score)[0]?.vector_name || null,
      grades: accepted.reduce((tally, vector) => {
        tally[vector.signal_grade] = (tally[vector.signal_grade] || 0) + 1;
        return tally;
      }, {}),
      oracle_run: runId
    });
  } catch (error) {
    console.error('runOracle failed:', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}