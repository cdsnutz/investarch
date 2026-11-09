// HubSpot import sheet: only buyers that cleared the high-conviction bar, shaped once and used
// twice — as a CSV for HubSpot's importer and as the payload for the in-app company import.
const text = (value) => String(value ?? '').trim();
const squash = (value) => text(value).replace(/\r?\n+/g, '; ');

const cell = (value) => {
  const clean = squash(value);
  return /[",]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
};

const TWO_PART_SUFFIXES = ['co.uk', 'com.au', 'co.nz', 'com.br', 'co.jp', 'co.in', 'com.sg', 'co.za'];
// Words that describe what a company does rather than who it is, so they never decide a domain.
const GENERIC_TOKENS = [
  'technologies', 'systems', 'solutions', 'software', 'services', 'group', 'company', 'labs',
  'health', 'data', 'cloud', 'partners', 'global', 'digital', 'platform'
];

function registrable(host) {
  const labels = host.split('.');
  if (labels.length <= 2) return host;
  const tail = labels.slice(-2).join('.');
  return TWO_PART_SUFFIXES.includes(tail) ? labels.slice(-3).join('.') : tail;
}

// A company's own domain comes from a source host that carries its name — docebo.com for Docebo —
// never from a news story or directory that merely writes about it.
function domainOf(company, row) {
  const slug = text(company).toLowerCase().replace(/[^a-z0-9]/g, '');
  // Only the first significant word of the name decides the domain: "Oracle Hospitality" is
  // oracle.com, never a publication that happens to be about hospitality.
  const primary = text(company).toLowerCase().split(/[^a-z0-9]+/)
    .find((token) => token.length >= 4 && !GENERIC_TOKENS.includes(token)) || '';
  if (!slug) return '';

  for (const url of row?.sources || []) {
    let host = '';
    try {
      host = new URL(text(url)).hostname.replace(/^www\./, '').toLowerCase();
    } catch {
      continue;
    }
    const domain = registrable(host);
    const label = domain.split('.')[0];
    if ((primary && label === primary) || slug === label || slug.startsWith(label) || label.startsWith(slug)) {
      return domain;
    }
  }
  return '';
}

export const HUBSPOT_COLUMNS = [
  'Company name',
  'Company domain name',
  'Website URL',
  'Description',
  'Lead source',
  'Buyer category',
  'Conviction score',
  'Evidence grade',
  'Buying trigger',
  'Unique insight',
  'Recent public moves',
  'Sources',
  'Where to verify',
  'Linked IP assets',
  'Budget owner',
  'Opening move',
  'Proof to lead with',
  'First-touch subject',
  'First-touch email'
];

// One object per high-conviction buyer, keyed by the CSV column labels so the sheet and the
// API payload can never drift apart.
export function hubspotCompanies(ranked) {
  return (ranked || [])
    .filter((entry) => entry.tier === 'high')
    .map(({ buyer, row, score }) => {
      const domain = domainOf(buyer.company, row);
      return {
        'Company name': buyer.company,
        'Company domain name': domain,
        'Website URL': domain ? `https://${domain}` : '',
        'Description': row?.snapshot || buyer.why_fit,
        'Lead source': 'InvestArch IP Factory',
        'Buyer category': buyer.category,
        'Conviction score': score,
        'Evidence grade': row?.confidence || 'unresearched',
        'Buying trigger': row?.buying_trigger || '',
        'Unique insight': row?.unique_insight || '',
        'Recent public moves': (row?.recent_moves || []).filter(Boolean).join('; '),
        'Sources': (row?.sources || []).filter(Boolean).join('; '),
        'Where to verify': row?.osint_angle || '',
        'Linked IP assets': buyer.seeds.join('; '),
        'Budget owner': buyer.contact_role || '',
        'Opening move': buyer.approach || '',
        'Proof to lead with': buyer.evidence_to_lead_with || '',
        'First-touch subject': buyer.subject || '',
        'First-touch email': buyer.pitch || ''
      };
    });
}

export function buildHubspotCsv(companies) {
  const rows = companies || [];
  const csv = [HUBSPOT_COLUMNS, ...rows.map((row) => HUBSPOT_COLUMNS.map((column) => cell(row[column])))]
    .map((line) => line.join(','))
    .join('\n');

  return {
    csv: `${csv}\n`,
    count: rows.length,
    companies: rows.map((row) => row['Company name'])
  };
}