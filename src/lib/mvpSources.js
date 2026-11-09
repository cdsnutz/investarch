// Every market claim in a forged app carries the page it was read from. The register is built once
// at forge time and rendered here, so each exported document can end with the URLs and evidence
// behind its claims instead of an assertions-only summary.
const text = (value) => String(value ?? '').trim();

const cell = (value) => text(value).replace(/\|/g, '\\|').replace(/\s+/g, ' ').slice(0, 240) || 'not stated';

function derivedClaims(spec) {
  return (Array.isArray(spec?.competitors) ? spec.competitors : []).map((row) => ({
    claim: `${text(row.name)}: ${text(row.weakness)}`,
    kind: 'competitor',
    source_url: text(row.url),
    evidence: '',
    verified: Boolean(text(row.url))
  }));
}

export function verificationOf(spec) {
  const stored = spec?.source_verification || null;
  const fallback = derivedClaims(spec);
  const rawClaims = Array.isArray(stored?.claims) && stored.claims.length ? stored.claims : fallback;

  const claims = rawClaims
    .filter((row) => text(row?.claim))
    .slice(0, 16)
    .map((row) => {
      const sourceUrl = text(row?.source_url);
      return {
        claim: text(row.claim),
        kind: text(row.kind) || 'competitor',
        source_url: sourceUrl,
        evidence: text(row.evidence),
        verified: row?.verified !== false && Boolean(sourceUrl)
      };
    });

  const urls = new Map();
  (Array.isArray(stored?.sources) ? stored.sources : []).forEach((row) => {
    if (text(row?.url)) urls.set(text(row.url), text(row?.title));
  });
  (Array.isArray(spec?.sources) ? spec.sources : []).forEach((url) => {
    if (text(url) && !urls.has(text(url))) urls.set(text(url), '');
  });
  claims.forEach((row) => {
    if (row.source_url && !urls.has(row.source_url)) urls.set(row.source_url, '');
  });

  const traced = claims.filter((row) => row.verified).length;
  return {
    summary:
      text(stored?.summary) ||
      `${traced} of ${claims.length} market claim${claims.length === 1 ? '' : 's'} trace${claims.length === 1 ? 's' : ''} to a page read for this build.`,
    checked_date: text(stored?.checked_date) || text(spec?.forged_date).slice(0, 10),
    evidence_read: Number(stored?.evidence_read) || 0,
    queries: Array.isArray(stored?.queries) ? stored.queries.map(text).filter(Boolean) : [],
    research: Array.isArray(stored?.research) ? stored.research : [],
    inferences: Array.isArray(stored?.inferences) ? stored.inferences.map(text).filter(Boolean) : [],
    claims,
    traced,
    total: claims.length,
    sources: Array.from(urls.entries()).map(([url, title]) => ({ url, title }))
  };
}

export function buildVerificationSection(spec) {
  const record = verificationOf(spec);
  const lines = ['## Source verification', ''];

  lines.push(record.checked_date ? `Checked ${record.checked_date}. ${record.summary}` : record.summary, '');
  if (record.queries.length) {
    lines.push(`Searches run: ${record.queries.map((query) => `\`${query}\``).join(' · ')}`, '');
  }

  if (record.claims.length) {
    lines.push('| Claim | Kind | Source | Evidence read |', '| --- | --- | --- | --- |');
    record.claims.forEach((row) => {
      lines.push(
        `| ${cell(row.claim)} | ${cell(row.kind)} | ${row.source_url ? `[page](${row.source_url})` : 'not traced'} | ${cell(row.evidence)} |`
      );
    });
    lines.push('');
  }

  if (record.sources.length) {
    lines.push('### Every source read', '');
    record.sources.forEach((row) => lines.push(`- ${row.url}${row.title ? ` · ${row.title}` : ''}`));
    lines.push('');
  }

  if (record.research.length) {
    lines.push('### Buyer research on file', '');
    record.research.forEach((row) => {
      const urls = (Array.isArray(row?.sources) ? row.sources : []).map(text).filter(Boolean);
      lines.push(
        `- ${text(row?.company) || 'unnamed buyer'} (${text(row?.confidence) || 'unrated'}): ${urls.length ? urls.join(', ') : 'no source url recorded'}`
      );
    });
    lines.push('');
  }

  if (record.inferences.length) {
    lines.push('### Product decisions, not market claims', '');
    record.inferences.forEach((row) => lines.push(`- ${row}`));
    lines.push('');
  }

  lines.push(
    'A claim that has no page above is not made in this document. Do not add a competitor, a price, a metric or a date that is not in this register.'
  );
  return lines.join('\n');
}

export function buildSourceFooter(spec) {
  const record = verificationOf(spec);
  const lines = ['## Sources behind this document', '', record.summary, ''];

  if (record.claims.length) {
    record.claims.forEach((row) => {
      const source = row.source_url ? row.source_url : 'no page traced, treat as an assumption';
      lines.push(`- ${text(row.claim)} · ${source}`);
      if (row.evidence) lines.push(`  Evidence: ${row.evidence}`);
    });
    lines.push('');
  }

  if (record.sources.length && !record.claims.length) {
    record.sources.forEach((row) => lines.push(`- ${row.url}${row.title ? ` · ${row.title}` : ''}`));
    lines.push('');
  }

  if (!record.claims.length && !record.sources.length) {
    lines.push('- No public source was captured for this build. Every market statement in this document is an assumption.');
    lines.push('');
  }

  lines.push('The full register, including the buyer research URLs, is in `MVP_BRIEF.md`.');
  return lines.join('\n');
}

export function verificationSummary(spec) {
  const record = verificationOf(spec);
  return `${record.traced}/${record.total} claims traced`;
}

export function summarizeVerification(specs) {
  const records = (Array.isArray(specs) ? specs : []).map(verificationOf);
  const urls = new Set();
  records.forEach((record) => record.sources.forEach((row) => urls.add(row.url)));
  return {
    apps: records.length,
    traced: records.reduce((total, record) => total + record.traced, 0),
    claims: records.reduce((total, record) => total + record.total, 0),
    sources: urls.size
  };
}