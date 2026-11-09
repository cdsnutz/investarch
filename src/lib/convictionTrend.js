// Average conviction per cohort of seeds, so the research process itself can be read over time.
// Every seed is scored from the buyer research actually on file (never its own prose), then grouped
// by the week it was yielded: the period average shows that cohort's quality, the running average
// shows whether the whole ledger is climbing.
import { scoreBuyer } from '@/lib/buyerScore';
import { HIGH_CONVICTION, seedConvictionScore } from '@/lib/seedConviction';

const key = (value) => String(value ?? '').trim().toLowerCase();

function startOfWeek(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d;
}

const mean = (values) => (values.length ? Math.round(values.reduce((sum, v) => sum + v, 0) / values.length) : 0);

export function buildConvictionTrend({ seeds = [], research = [] }) {
  const byCompany = new Map();
  (research || []).forEach((row) => {
    [row?.company, row?.company_name].forEach((name) => {
      if (key(name)) byCompany.set(key(name), row);
    });
  });

  const scored = [];
  (seeds || []).forEach((seed) => {
    // Ecosystems are combinations of seeds already counted here.
    if ((seed.source_seed_ids || []).length || seed.source_channel === 'seed mix') return;
    const at = new Date(seed.yield_date || seed.created_date || '');
    if (Number.isNaN(at.getTime())) return;

    const matched = new Map();
    (seed.buyer_leads || []).forEach((lead) => {
      const row = byCompany.get(key(lead?.company));
      if (row) matched.set(row.id || key(lead.company), row);
    });
    (research || []).forEach((row) => {
      if ((row.seed_ids || []).includes(seed.id)) matched.set(row.id || key(row.company), row);
    });

    const rows = Array.from(matched.values());
    const best = rows
      .map((row) => scoreBuyer({ seeds: [seed.title] }, row).score)
      .sort((a, b) => b - a)[0] || 0;
    const verified = rows.filter((row) => row.confidence === 'verified').length;
    const likely = rows.filter((row) => row.confidence === 'likely').length;
    const verdict = seedConvictionScore({ best, verified, likely, total: rows.length });

    scored.push({ at, score: verdict.score, graded: rows.length, verified });
  });

  const buckets = new Map();
  scored.forEach((row) => {
    const week = startOfWeek(row.at);
    const bucket = buckets.get(week.toISOString()) || { week, scores: [], graded: 0, verified: 0 };
    bucket.scores.push(row.score);
    bucket.graded += row.graded ? 1 : 0;
    bucket.verified += row.verified ? 1 : 0;
    buckets.set(week.toISOString(), bucket);
  });

  const ordered = Array.from(buckets.values()).sort((a, b) => a.week - b.week);
  let running = 0;
  let counted = 0;
  const points = ordered.map((bucket) => {
    running += bucket.scores.reduce((sum, v) => sum + v, 0);
    counted += bucket.scores.length;
    return {
      label: bucket.week.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      avg: mean(bucket.scores),
      cumulative: Math.round(running / counted),
      seeds: bucket.scores.length,
      graded: bucket.graded,
      verified: bucket.verified
    };
  });

  const latest = points[points.length - 1] || null;
  const opening = points[0] || null;

  return {
    points,
    totals: {
      seeds: scored.length,
      overall: mean(scored.map((row) => row.score)),
      graded: scored.filter((row) => row.graded).length,
      high: scored.filter((row) => row.score >= HIGH_CONVICTION).length,
      latest: latest?.avg ?? 0,
      change: latest && opening ? latest.avg - opening.avg : 0,
      running: latest?.cumulative ?? 0
    }
  };
}