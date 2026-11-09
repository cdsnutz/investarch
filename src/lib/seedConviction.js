// Conviction for a seed: does the public-source record we already collected actually support
// building it? Only research on file counts, so a seed never qualifies on its own prose.
import { base44 } from '@/api/base44Client';
import { scoreBuyer } from '@/lib/buyerScore';

const key = (value) => String(value ?? '').trim().toLowerCase();

export const HIGH_CONVICTION = 70;

const GRADE_WORD = { verified: 'Verified', likely: 'Likely', thin: 'Thin' };

// Seed-level conviction: the strongest graded profile sets the ceiling, and the number of
// independently graded profiles decides how much of that ceiling the seed has actually earned.
// Breadth is capped so a tenth duplicate profile cannot lift a single thin read above the band.
export function seedConvictionScore({ best = 0, verified = 0, likely = 0, total = 0 }) {
  if (!total) {
    return {
      score: 0,
      label: 'Unresearched',
      grade: 'none',
      why: 'No buyer research on file. The score reads evidence, and there is none.'
    };
  }

  const thin = Math.max(0, total - verified - likely);
  const breadth = Math.min(20, verified * 6 + likely * 3 + thin);
  const score = Math.max(0, Math.min(100, Math.round(best * 0.8 + breadth)));
  const grade = verified ? 'verified' : likely ? 'likely' : 'thin';

  return {
    score,
    label: score >= HIGH_CONVICTION ? 'High' : score >= 45 ? 'Watch' : 'Low',
    grade,
    why: `${GRADE_WORD[grade]} evidence · ${verified} verified, ${likely} likely, ${thin} thin · best buyer ${best}/100`
  };
}

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

    const verified = rows.filter((row) => row.confidence === 'verified').length;
    const likely = rows.filter((row) => row.confidence === 'likely').length;
    const scored = seedConvictionScore({ best: best?.score || 0, verified, likely, total: rows.length });

    verdict[seed.id] = {
      tier: best && best.score >= HIGH_CONVICTION ? 'high' : rows.length ? 'watch' : 'none',
      best: best?.score || 0,
      score: scored.score,
      label: scored.label,
      grade: scored.grade,
      why: scored.why,
      verified,
      likely,
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