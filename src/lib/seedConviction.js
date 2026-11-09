// Conviction for a seed: does the public-source record we already collected actually support
// building it? Only research on file counts, so a seed never qualifies on its own prose.
import { base44 } from '@/api/base44Client';
import { scoreBuyer } from '@/lib/buyerScore';

const key = (value) => String(value ?? '').trim().toLowerCase();

export const HIGH_CONVICTION = 70;

export async function loadSeedConviction(seeds) {
  const list = seeds || [];
  if (!list.length) return {};

  const { items } = await base44.entities.BuyerResearch.list({ sort: '-researched_date', limit: 400 });
  const byCompany = new Map();
  (items || []).forEach((row) => {
    [row?.company, row?.company_name].forEach((name) => {
      if (key(name)) byCompany.set(key(name), row);
    });
  });

  const verdict = {};
  list.forEach((seed) => {
    const matched = new Map();
    (seed.buyer_leads || []).forEach((lead) => {
      const row = byCompany.get(key(lead?.company));
      if (row) matched.set(row.id || key(lead.company), row);
    });
    (items || []).forEach((row) => {
      if ((row.seed_ids || []).includes(seed.id)) matched.set(row.id || key(row.company), row);
    });

    const rows = Array.from(matched.values());
    const best = rows
      .map((row) => ({ row, ...scoreBuyer({ seeds: [seed.title] }, row) }))
      .sort((a, b) => b.score - a.score)[0] || null;

    verdict[seed.id] = {
      tier: best && best.score >= HIGH_CONVICTION ? 'high' : rows.length ? 'watch' : 'none',
      best: best?.score || 0,
      verified: rows.filter((row) => row.confidence === 'verified').length,
      likely: rows.filter((row) => row.confidence === 'likely').length,
      buyers: rows.map((row) => row.company_name || row.company).filter(Boolean).slice(0, 4),
      research: rows.slice(0, 4)
    };
  });

  return verdict;
}

// Only the evidence fields the forge can use, bounded so the prompt stays lean.
export function convictionResearch(entry) {
  return (entry?.research || []).map((row) => ({
    company: row.company_name || row.company,
    confidence: row.confidence,
    snapshot: row.snapshot,
    recent_moves: (row.recent_moves || []).slice(0, 4),
    buying_trigger: row.buying_trigger,
    unique_insight: row.unique_insight,
    osint_angle: row.osint_angle,
    sources: (row.sources || []).slice(0, 4)
  }));
}