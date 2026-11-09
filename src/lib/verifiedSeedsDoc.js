// One organized document for every seed the research on file actually supports.
// A seed qualifies only when at least one buyer profile attached to it is graded "verified",
// and nothing in the document is stated as fact without the page it was read from.

const text = (value) => String(value ?? '').trim();
const flat = (value) => text(value).replace(/\s+/g, ' ');

const cell = (value) => flat(value).replace(/\|/g, '\\|');

const isUrl = (value) => /^https?:\/\/\S+$/i.test(text(value));

const day = (date) => new Date(date).toISOString().slice(0, 10);

// Every page read for a seed's buyers, with the companies it was read for.
function sourceRows(entry) {
  const seen = new Map();
  (entry?.research || []).forEach((row) => {
    const company = flat(row.company_name || row.company) || 'unnamed buyer';
    (row.sources || []).forEach((url) => {
      const link = text(url);
      if (!isUrl(link)) return;
      if (!seen.has(link)) seen.set(link, new Set());
      seen.get(link).add(company);
    });
  });
  return Array.from(seen, ([url, companies]) => ({ url, companies: Array.from(companies) }));
}

function profileBlock(row) {
  const company = flat(row.company_name || row.company) || 'unnamed buyer';
  const lines = [`### ${company} — ${flat(row.confidence) || 'thin'}`];
  if (flat(row.snapshot)) lines.push('', flat(row.snapshot));
  if (flat(row.buying_trigger)) lines.push('', `**Buying trigger.** ${flat(row.buying_trigger)}`);
  if (flat(row.unique_insight)) lines.push('', `**Why it reads as a buyer.** ${flat(row.unique_insight)}`);
  const sources = (row.sources || []).map(text).filter(isUrl);
  if (sources.length) lines.push('', '**Pages read.**', ...sources.map((url) => `- ${url}`));
  return lines.join('\n');
}

function seedSection(seed, entry, forge, index) {
  const sources = sourceRows(entry);
  const verification = forge?.source_verification || null;
  const profiles = entry.research || [];
  const leads = Array.isArray(seed.buyer_leads) ? seed.buyer_leads : [];

  const blocks = [
    `## ${index}. ${flat(seed.title)}`,
    '',
    `**Conviction.** ${entry.score}/100 · ${entry.label} — strongest graded profile ${entry.best}/100`,
    '',
    `**Evidence grade.** ${entry.why}`,
    '',
    `**Portfolio verdict.** ${flat(seed.strategy) || 'hold'}${flat(seed.strategy_note) ? ` — ${flat(seed.strategy_note)}` : ''}`,
    ''
  ];

  if (flat(seed.gap) || flat(seed.solution)) {
    blocks.push('### The asset', '');
    if (flat(seed.gap)) blocks.push(`**Gap.** ${flat(seed.gap)}`, '');
    if (flat(seed.pain_signal)) blocks.push(`**Pain signal on record.** ${flat(seed.pain_signal)}`, '');
    if (flat(seed.solution)) blocks.push(`**Solution.** ${flat(seed.solution)}`, '');
  }

  blocks.push('### Source verification', '');
  blocks.push(
    `- Verified profiles on file: ${entry.verified}`,
    `- Likely profiles on file: ${entry.likely}`,
    `- Distinct source pages read: ${sources.length}`
  );
  if (sources.length) {
    blocks.push('', '**Pages, and the buyers they support.**');
    sources.forEach((row) => blocks.push(`- ${row.url} — ${row.companies.join(', ')}`));
  } else {
    blocks.push('', 'No source URL was recorded for these profiles, so nothing here can be re-read.');
  }
  blocks.push('');
  if (verification?.summary) {
    blocks.push(`**Teardown verification.** ${flat(verification.summary)}`);
    if (verification.checked_date) blocks.push('', `Checked ${day(verification.checked_date)}.`);
    blocks.push('');
  }

  if (profiles.length) {
    blocks.push('### Verified buyer research', '', profiles.map(profileBlock).join('\n\n'), '');
  }

  if (leads.length) {
    const rows = leads.map((lead, position) => {
      const parts = [`${position + 1}. **${flat(lead.company)}**${flat(lead.category) ? ` · ${flat(lead.category)}` : ''}`];
      if (flat(lead.contact_role)) parts.push(`   Who to reach: ${flat(lead.contact_role)}`);
      if (flat(lead.evidence_to_lead_with)) parts.push(`   Lead with: ${flat(lead.evidence_to_lead_with)}`);
      if (flat(lead.approach)) parts.push(`   Opening move: ${flat(lead.approach)}`);
      return parts.join('\n');
    });
    blocks.push('### Buyer leads named for this asset', '', rows.join('\n\n'), '');
  }

  return blocks.join('\n').trim();
}

export function buildVerifiedSeedsDoc({ seeds = [], conviction = {}, forges = [], generated = new Date() }) {
  const bySeed = new Map();
  (forges || []).forEach((forge) => {
    if (forge?.seed_id) bySeed.set(forge.seed_id, forge);
  });

  const rows = (seeds || [])
    .map((seed) => ({ seed, entry: conviction[seed.id] }))
    .filter((row) => row.entry?.grade === 'verified')
    .sort((a, b) => (b.entry.score || 0) - (a.entry.score || 0));

  const allSources = new Set();
  rows.forEach((row) => sourceRows(row.entry).forEach((source) => allSources.add(source.url)));

  const header = [
    '# Verified Seeds',
    '',
    `_InvestArch · ${day(generated)} · ${rows.length} seed${rows.length === 1 ? '' : 's'} carrying verified buyer research · ${allSources.size} distinct source page${allSources.size === 1 ? '' : 's'}_`,
    '',
    '## What qualifies a seed for this document',
    '',
    'A seed appears here only when at least one buyer profile attached to it is graded verified: a page read at research time that names the company and supports the buying logic. The conviction score is read from that evidence and never from the seed\'s own prose. The strongest graded profile sets the ceiling, the number of graded profiles decides how much of that ceiling the seed has earned, and High begins at 70 of 100. Every claim about a buyer in this document carries the page it was read from.',
    '',
    '## Contents',
    '',
    '| # | Seed | Conviction | Verified profiles | Sources |',
    '| --- | --- | --- | --- | --- |',
    ...rows.map((row, index) => {
      const sources = sourceRows(row.entry).length;
      return `| ${index + 1} | ${cell(row.seed.title)} | ${row.entry.score}/100 ${row.entry.label} | ${row.entry.verified} | ${sources} |`;
    }),
    ''
  ];

  const body = rows.map((row, index) => seedSection(row.seed, row.entry, bySeed.get(row.seed.id), index + 1));

  return {
    markdown: rows.length ? `${header.join('\n')}\n${body.join('\n\n---\n\n')}\n` : header.join('\n'),
    count: rows.length,
    sources: allSources.size,
    filename: `investarch-verified-seeds-${day(generated)}.md`
  };
}