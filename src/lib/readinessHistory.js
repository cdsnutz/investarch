// Reconstructs the nexus funding-readiness total over time using nothing but
// record timestamps: at each point the graph is rebuilt from the dossiers,
// rivals, capital claims and archetypes that already existed on that date, so
// every point is the real score the network would have produced then. Weekly
// points are used for recent workspaces, monthly once the record spans longer.

import { buildNexus } from '@/lib/nexusGraph';

const DAY = 86400000;

const asDate = (value) => {
  if (!value) return null;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
};

const endOfMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);

const firstOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1);

function cutoffsFor(start, now) {
  const spanDays = (now - start) / DAY;
  if (spanDays > 150) {
    const cutoffs = [];
    const cursor = new Date(start);
    while (cursor <= now) {
      cutoffs.push(endOfMonth(cursor) > now ? now : endOfMonth(cursor));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    return { cutoffs, unit: 'month' };
  }
  const steps = Math.min(15, Math.max(0, Math.ceil(spanDays / 7)));
  const cutoffs = [];
  for (let i = steps; i >= 0; i -= 1) cutoffs.push(new Date(now.getTime() - i * 7 * DAY));
  return { cutoffs, unit: 'week' };
}

export function buildReadinessHistory({ projects = [], competitors = [], funding = [], archetypes = [] } = {}) {
  const stamps = [...projects, ...competitors, ...funding, ...archetypes]
    .map((r) => asDate(r.created_date))
    .filter(Boolean);
  if (!stamps.length || !projects.length) return [];

  const now = new Date();
  const earliest = stamps.reduce((min, d) => (d < min ? d : min), stamps[0]);
  const { cutoffs, unit } = cutoffsFor(earliest < firstOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1))
    ? firstOfMonth(new Date(now.getFullYear(), now.getMonth() - 11, 1))
    : earliest, now);

  const within = (records, cutoff) =>
    records.filter((r) => {
      const d = asDate(r.created_date);
      return !d || d <= cutoff;
    });

  return cutoffs.map((cutoff) => {
    const subset = {
      projects: within(projects, cutoff),
      competitors: within(competitors, cutoff),
      funding: within(funding, cutoff),
      archetypes: within(archetypes, cutoff)
    };

    const graph = buildNexus(subset);
    const scores = subset.projects.map((p) => graph.readiness[p.id]?.score).filter((s) => typeof s === 'number');
    const total = scores.reduce((sum, s) => sum + s, 0);

    return {
      key: cutoff.toISOString().slice(0, 10),
      label: cutoff.toLocaleDateString('en-US', unit === 'month' ? { month: 'short', year: '2-digit' } : { month: 'short', day: 'numeric' }),
      cutoff,
      total,
      average: scores.length ? Math.round(total / scores.length) : 0,
      dossiers: scores.length,
      claims: subset.funding.length,
      capitalReady: scores.filter((s) => s >= 70).length
    };
  });
}