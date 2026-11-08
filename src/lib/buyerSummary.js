// The buyer research summary: one report over every researched profile, stating coverage,
// the evidence grade behind each finding, and the order to approach them in.
// Everything here is derived from the profiles actually returned — nothing is added.
import { buildPdf } from '@/lib/pdfBuilder';

const text = (value) => String(value ?? '').trim();
const GRADE = { verified: 'Verified', likely: 'Likely', thin: 'Thin' };

function short(value, limit = 220) {
  const clean = text(value).replace(/\s+/g, ' ');
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit);
  const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
  return stop > 100 ? `${cut.slice(0, stop + 1)}` : `${cut.trimEnd()}…`;
}

export function researchSummary(buyers, intel = {}, { failures = [], generatedAt } = {}) {
  const rows = (buyers || []).map((buyer) => ({
    buyer,
    row: intel[text(buyer.company).toLowerCase()] || null
  }));
  const researched = rows.filter((entry) => entry.row);
  const missing = rows.filter((entry) => !entry.row);
  const grade = (name) => researched.filter((entry) => entry.row.confidence === name).length;
  const sourced = researched.filter((entry) => (entry.row.sources || []).length).length;
  const date = new Date(generatedAt || Date.now()).toISOString().slice(0, 10);
  const share = (n) => (researched.length ? `${Math.round((n / researched.length) * 100)}%` : '0%');

  const sectors = {};
  researched.forEach(({ buyer, row }) => {
    const key = text(buyer.category) || 'unclassified';
    sectors[key] = sectors[key] || { total: 0, verified: 0 };
    sectors[key].total += 1;
    if (row.confidence === 'verified') sectors[key].verified += 1;
  });

  const queue = researched
    .filter((entry) => entry.row.confidence !== 'thin')
    .sort((a, b) => (b.row.sources?.length || 0) - (a.row.sources?.length || 0)
      || (b.buyer.seeds?.length || 0) - (a.buyer.seeds?.length || 0))
    .slice(0, 15);

  const recheck = researched.filter((entry) => entry.row.confidence !== 'verified');
  const thin = researched.filter((entry) => entry.row.confidence === 'thin');

  const sections = [
    {
      heading: 'Coverage',
      body: [
        `${rows.length} named buyers across the ledger. ${researched.length} carry a fresh public-source read, ${missing.length} were not researched, and ${failures.length} batch${failures.length === 1 ? '' : 'es'} failed.`,
        `${sourced} of ${researched.length} profiles (${share(sourced)}) attach at least one source URL. A profile without a URL is an assertion, not evidence.`,
        `Generated ${date}.`
      ].join('\n\n')
    },
    {
      heading: 'Evidence grade',
      body: [
        `Verified: ${grade('verified')} (${share(grade('verified'))})`,
        `Likely: ${grade('likely')} (${share(grade('likely'))})`,
        `Thin: ${grade('thin')} (${share(grade('thin'))})`,
        'Verified means the insight rests on a named public source. Likely means it is consistent with public evidence but unconfirmed. Thin means public evidence was insufficient and the profile records what is missing instead of filling the gap.'
      ].join('\n')
    },
    {
      heading: 'Findings by category',
      body: Object.entries(sectors)
        .sort((a, b) => b[1].total - a[1].total)
        .map(([name, stats]) => `${name}: ${stats.total} buyers, ${stats.verified} verified`)
        .join('\n')
    },
    {
      heading: 'What the read found',
      body: researched.map(({ buyer, row }) => [
        `${buyer.company} — ${GRADE[row.confidence] || 'Thin'}`,
        short(row.buying_trigger || row.snapshot, 200),
        row.unique_insight ? short(row.unique_insight, 300) : ''
      ].filter(Boolean).join('\n')).join('\n\n')
    },
    {
      heading: 'Open first',
      body: queue.length
        ? queue.map(({ buyer, row }, index) => `${index + 1}. ${buyer.company} — ${GRADE[row.confidence]} · ${(row.sources || []).length} source${(row.sources || []).length === 1 ? '' : 's'} · ${short(row.buying_trigger, 160)}`).join('\n')
        : 'No profile reached likely or verified.'
    },
    {
      heading: 'Re-verify before the first send',
      body: recheck.length
        ? recheck.map(({ buyer, row }) => `${buyer.company} — ${GRADE[row.confidence]}.\n${short(row.osint_angle, 220)}`).join('\n\n')
        : 'Every researched buyer reached verified.'
    },
    {
      heading: 'Evidence gaps',
      body: thin.length
        ? thin.map(({ buyer, row }) => `${buyer.company} — ${short(row.osint_angle || row.unique_insight, 220)}`).join('\n')
        : 'No profile fell below likely.'
    },
    {
      heading: 'Failed batches',
      body: failures.length
        ? failures.map((failure) => `${(failure.buyers || []).join(', ')} — ${failure.reason}`).join('\n')
        : ''
    },
    {
      heading: 'Method and limits',
      body: [
        'Each profile is assembled from public sources at the time of the run: the company\'s own site, filings and press releases, procurement and regulatory records, documentation and changelogs, and dated trade coverage.',
        'The model is instructed to leave a field short rather than invent a round, a headcount, an executive or a contract, and to grade its own confidence down when the public record is thin. Nothing in this report is a substitute for the re-check listed against each company.'
      ].join('\n\n')
    }
  ].filter((section) => text(section.body));

  const markdown = [
    '# Buyer Research Summary',
    '',
    `_${rows.length} named buyers · ${researched.length} researched · generated ${date}_`,
    '',
    ...sections.map((section) => `## ${section.heading}\n\n${section.body}\n`)
  ].join('\n');

  const pdf = buildPdf({
    title: 'Buyer Research Summary',
    subtitle: `${rows.length} named buyers · ${researched.length} researched · generated ${date}`,
    sections,
    footer: 'InvestArch · buyer research summary'
  });

  return {
    markdown,
    pdf,
    total: rows.length,
    researched: researched.length,
    verified: grade('verified'),
    likely: grade('likely'),
    thin: grade('thin'),
    sourced
  };
}