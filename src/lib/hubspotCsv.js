// HubSpot import sheet: only buyers that cleared the high-conviction bar, shaped for HubSpot's
// company importer. Standard property labels are used where they exist so the columns map
// themselves; the research columns ride along as custom properties, which the importer asks
// you to create once.
const text = (value) => String(value ?? '').trim();
const squash = (value) => text(value).replace(/\r?\n+/g, '; ');

const cell = (value) => {
  const clean = squash(value);
  return /[",]/.test(clean) ? `"${clean.replace(/"/g, '""')}"` : clean;
};

// Directory and news hosts describe a company but are not that company's own domain, so they
// never become its HubSpot domain name.
const NOT_A_DOMAIN = [
  'linkedin.com', 'crunchbase.com', 'pitchbook.com', 'tracxn.com', 'g2.com', 'capterra.com',
  'glassdoor.com', 'wikipedia.org', 'twitter.com', 'x.com', 'facebook.com', 'youtube.com',
  'bloomberg.com', 'reuters.com', 'techcrunch.com', 'medium.com', 'substack.com', 'reddit.com'
];

function domainOf(row) {
  for (const url of row?.sources || []) {
    try {
      const host = new URL(text(url)).hostname.replace(/^www\./, '').toLowerCase();
      if (host && !NOT_A_DOMAIN.some((blocked) => host === blocked || host.endsWith(`.${blocked}`))) {
        return host;
      }
    } catch {
      continue;
    }
  }
  return '';
}

const HEADER = [
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

export function buildHubspotCsv(ranked) {
  const high = (ranked || []).filter((entry) => entry.tier === 'high');

  const rows = high.map(({ buyer, row, score }) => {
    const domain = domainOf(row);
    return [
      buyer.company,
      domain,
      domain ? `https://${domain}` : '',
      row?.snapshot || buyer.why_fit,
      'InvestArch IP Factory',
      buyer.category,
      score,
      row?.confidence || 'unresearched',
      row?.buying_trigger,
      row?.unique_insight,
      (row?.recent_moves || []).filter(Boolean).join('; '),
      (row?.sources || []).filter(Boolean).join('; '),
      row?.osint_angle,
      buyer.seeds.join('; '),
      buyer.contact_role,
      buyer.approach,
      buyer.evidence_to_lead_with,
      buyer.subject,
      buyer.pitch
    ];
  });

  const csv = [HEADER, ...rows].map((line) => line.map(cell).join(',')).join('\n');

  return {
    csv: `${csv}\n`,
    count: high.length,
    companies: high.map((entry) => entry.buyer.company)
  };
}