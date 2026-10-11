import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const HEGEMONY_SCHEMA = {
  type: "object",
  properties: {
    market_grip_pct: { type: "number" },
    verdict: { type: "string" },
    grip_levers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lever: { type: "string" },
          current: { type: "string" },
          target: { type: "string" },
          action: { type: "string" }
        },
        required: ["lever", "current", "target", "action"]
      }
    }
  },
  required: ["market_grip_pct", "verdict", "grip_levers"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    const [seedPage, filingPage, vectorPage, treasPage] = await Promise.all([
      base44.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 300, fields: ['title', 'status', 'asymmetric_score'] }),
      base44.entities.IpFiling.filter({}, { limit: 500, fields: ['seed_id'] }),
      base44.entities.MarketVector.filter({}, { limit: 100, fields: ['status'] }),
      base44.entities.TreasurySnapshot.filter({}, { sort: '-created_date', limit: 1, fields: ['total_valuation'] })
    ]);
    const seeds = seedPage.items || [];
    const vectors = vectorPage.items || [];
    if (!seeds.length && !vectors.length) return Response.json({ snapshot_created: false, note: 'No assets or market positions yet — grip cannot be measured.' });

    const built = seeds.filter((s) => s.status === 'built').length;
    const hardened = new Set((filingPage.items || []).map((f) => f.seed_id));
    const protectedCount = seeds.filter((s) => hardened.has(s.id)).length;
    const staked = vectors.filter((v) => v.status !== 'predicted').length;
    const portfolioValue = (treasPage.items || [])[0]?.total_valuation || 0;

    // Deterministic floor: verifiable structure only — built products, hardened claims, staked vectors — capped at 95.
    const floor = Math.min(95, Math.round(built * 6 + protectedCount * 10 + staked * 4));

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are the consolidation-strategy engine inside InvestArch. Compute the MARKET GRIP score: what share of a target market cannot function without this portfolio's assets.

Honesty doctrine: the number below is a floor computed from verifiable structure (built products, hardened legal claims, staked market vectors). Assess the realistic CURRENT grip and the 24-month target, name 4 grip levers with a current/target/action each, and give a 2-sentence verdict. If grip is near zero, say "the board is still being built" — never inflate.

DETERMINISTIC FLOOR: ${floor}%
Portfolio: ${seeds.length} IP assets (${built} built, ${protectedCount} legally hardened)
Staked market vectors: ${staked} of ${vectors.length} predicted
Appraised portfolio value: ${portfolioValue}`,
      response_json_schema: HEGEMONY_SCHEMA
    });
    const grip = typeof res?.market_grip_pct === 'number' ? Math.max(floor, Math.min(res.market_grip_pct, 100)) : floor;

    const snapshot = await db.HegemonySnapshot.create({
      snapshot_date: new Date().toISOString().slice(0, 10),
      market_grip_pct: grip,
      built_assets: built,
      protected_assets: protectedCount,
      vectors_staked: staked,
      portfolio_value: portfolioValue,
      grip_levers: Array.isArray(res?.grip_levers) ? res.grip_levers.slice(0, 4) : [],
      verdict: res?.verdict || ''
    });
    return Response.json({
      snapshot_created: !!snapshot,
      market_grip_pct: grip,
      built_assets: built,
      vectors_staked: staked
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}