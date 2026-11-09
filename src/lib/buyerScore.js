// Conviction score for a buyer lead: how deep the public-source read went, and how specific
// the opening it exposes is. Every point comes from a field the research actually returned,
// so a profile with no sources and no dated moves cannot score well however flattering its
// prose — the score measures evidence, not enthusiasm.
const text = (value) => String(value ?? '').trim();

const GRADE_POINTS = { verified: 40, likely: 22, thin: 4 };
const GRADE_WORD = { verified: 'Verified', likely: 'Likely', thin: 'Thin' };

// Depth bands: naming a topic scores little; naming the mechanism and the buyer's own
// situation scores full. 100 = evidence 40 · sources 20 · dated moves 15 · trigger 10 ·
// insight 10 · portfolio fit 5.
function depth(value, max) {
  const length = text(value).length;
  if (length >= 200) return max;
  if (length >= 110) return Math.round(max * 0.7);
  if (length >= 45) return Math.round(max * 0.4);
  return length ? Math.round(max * 0.2) : 0;
}

export const TIERS = {
  high: 'High conviction',
  watch: 'Watch',
  low: 'Low',
  thin: 'Thin evidence',
  unresearched: 'Unresearched'
};

export function scoreBuyer(lead, row) {
  const assets = (lead?.seeds || []).length || 1;

  if (!row) {
    return { score: 0, tier: 'unresearched', label: TIERS.unresearched, why: 'No public-source read yet' };
  }

  const sources = (row.sources || []).filter(Boolean).length;
  const moves = (row.recent_moves || []).filter(Boolean).length;
  const grade = row.confidence === 'verified' || row.confidence === 'likely' ? row.confidence : 'thin';

  const points = (GRADE_POINTS[grade] || 0)
    + Math.min(sources, 4) * 5
    + Math.min(moves, 3) * 5
    + depth(row.buying_trigger, 10)
    + depth(row.unique_insight, 10)
    + Math.min(assets, 5);

  // A thin profile stays below the watch band: it may still be worth a call, but the public
  // record does not support treating it as a conviction target.
  const score = grade === 'thin' ? Math.min(points, 44) : points;
  const tier = grade === 'thin' ? 'thin' : score >= 70 ? 'high' : score >= 45 ? 'watch' : 'low';

  return {
    score,
    tier,
    label: TIERS[tier],
    why: `${GRADE_WORD[grade]} · ${sources} source${sources === 1 ? '' : 's'} · ${moves} dated move${moves === 1 ? '' : 's'} · ${assets} asset${assets === 1 ? '' : 's'}`
  };
}

export function rankBuyers(buyers, intel = {}) {
  return (buyers || [])
    .map((buyer) => {
      const row = intel[text(buyer.company).toLowerCase()] || null;
      return { buyer, row, ...scoreBuyer(buyer, row) };
    })
    .sort((a, b) => b.score - a.score
      || (b.row?.sources?.length || 0) - (a.row?.sources?.length || 0)
      || a.buyer.company.localeCompare(b.buyer.company));
}