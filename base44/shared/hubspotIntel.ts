// The buyer's own record, read from the operator's HubSpot portal.
//
// This is the intel layer, not an evidence layer: a HubSpot company tells the desk which segment,
// size, headquarters and lifecycle stage the buyer is in, which aims the public-source read. It
// never substitutes for a source a buyer could be shown, so nothing here is ever promoted into a
// profile's sources or its confidence grade.

const HUBSPOT = 'https://api.hubapi.com';
const DESCRIPTION_LIMIT = 1500;

// Company properties that exist on every portal; a narrower set avoids a 400 on accounts that
// have not enabled a given property.
export const COMPANY_PROPERTIES = [
  'name',
  'domain',
  'website',
  'industry',
  'numberofemployees',
  'annualrevenue',
  'city',
  'country',
  'description',
  'lifecyclestage',
  'hs_lastmodifieddate'
];

export type HubspotIntel = {
  company: string;
  company_name: string;
  hubspot_id: string;
  portal_id: string;
  domain: string;
  industry: string;
  employees: number | null;
  annual_revenue: number | null;
  city: string;
  country: string;
  description: string;
  lifecycle_stage: string;
  last_activity: string;
};

const text = (value: unknown) => String(value ?? '').trim();
const key = (value: unknown) => text(value).toLowerCase();
const num = (value: unknown) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
};

// HubSpot allows only a handful of calls per second; a 429 backs off and retries rather than
// dropping the company.
let lastCallAt = 0;

async function hs(token: string, path: string, init: RequestInit = {}, attempt = 0): Promise<any> {
  const gap = Math.max(0, 340 - (Date.now() - lastCallAt));
  if (gap) await new Promise((resolve) => setTimeout(resolve, gap));
  lastCallAt = Date.now();

  const response = await fetch(`${HUBSPOT}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {})
    },
    signal: AbortSignal.timeout(15000)
  });
  const body = await response.json().catch(() => ({}));

  if (response.status === 429 && attempt < 3) {
    await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
    return hs(token, path, init, attempt + 1);
  }

  if (!response.ok) {
    throw new Error(`HubSpot ${path} failed (${response.status}): ${JSON.stringify(body).slice(0, 200)}`);
  }
  return body;
}

async function findCompany(token: string, name: string) {
  const search = async (operator: string) => {
    const body = await hs(token, '/crm/v3/objects/companies/search', {
      method: 'POST',
      body: JSON.stringify({
        filterGroups: [{ filters: [{ propertyName: 'name', operator, value: name }] }],
        properties: COMPANY_PROPERTIES,
        limit: 1
      })
    }).catch(() => null);
    return body?.results?.[0] || null;
  };

  const exact = await search('EQ');
  if (exact) return { record: exact, matched_by: 'name' };
  if (name.length < 2) return { record: null, matched_by: '' };
  const partial = await search('CONTAINS_TOKEN');
  return { record: partial, matched_by: partial ? 'name contains' : '' };
}

function toIntel(record: any, named: string, portalId: string): HubspotIntel | null {
  const props = record?.properties || {};
  const company = text(props.name) || named;
  if (!company) return null;
  const domain = text(props.domain) || text(props.website).replace(/^https?:\/\//i, '').replace(/\/.*$/, '');

  return {
    company: key(company),
    company_name: company,
    hubspot_id: text(record?.id),
    portal_id: portalId,
    domain,
    industry: text(props.industry),
    employees: num(props.numberofemployees),
    annual_revenue: num(props.annualrevenue),
    city: text(props.city),
    country: text(props.country),
    description: text(props.description).slice(0, DESCRIPTION_LIMIT),
    lifecycle_stage: text(props.lifecyclestage),
    last_activity: text(props.hs_lastmodifieddate)
  };
}

// Reads every named company from HubSpot, in name order, one call at a time.
export async function pullCompanyIntel(
  token: string,
  names: string[],
  portalId = ''
): Promise<{ rows: HubspotIntel[]; missed: string[] }> {
  const rows: HubspotIntel[] = [];
  const missed: string[] = [];
  const seen = new Set<string>();

  for (const name of names) {
    const clean = text(name);
    if (!clean || seen.has(key(clean))) continue;
    seen.add(key(clean));
    try {
      const { record } = await findCompany(token, clean);
      const intel = record ? toIntel(record, clean, portalId) : null;
      if (intel) rows.push(intel);
      else missed.push(clean);
    } catch (error: any) {
      console.error('[hubspotIntel] lookup failed', clean, error?.message);
      missed.push(clean);
    }
  }

  return { rows, missed };
}

// One stored record per HubSpot company, so a buyer researched through two seeds reads one intel row.
export async function storeIntel(base44: any, rows: HubspotIntel[], seedId: string): Promise<number> {
  let stored = 0;
  for (const row of rows) {
    const payload = { ...row, synced_date: new Date().toISOString() };
    try {
      const { items } = await base44.entities.HubspotCompany.filter({ company: row.company }, { limit: 1 });
      const existing = items?.[0];
      if (existing) {
        const seedIds = Array.from(new Set([...(existing.seed_ids || []), seedId].filter(Boolean)));
        await base44.entities.HubspotCompany.update(existing.id, { ...payload, seed_ids: seedIds });
      } else {
        await base44.entities.HubspotCompany.create({ ...payload, seed_ids: seedId ? [seedId] : [] });
      }
      stored += 1;
    } catch (error: any) {
      console.error('[hubspotIntel] could not store intel', row.company, error?.message);
    }
  }
  return stored;
}

// The one-line read the buyer panel shows: what the record says, and how fresh it is.
export function intelLine(row: any): string {
  const parts = [
    text(row?.industry),
    row?.employees ? `${Number(row.employees).toLocaleString('en-US')} staff` : '',
    [text(row?.city), text(row?.country)].filter(Boolean).join(', '),
    text(row?.domain),
    text(row?.lifecycle_stage)
  ].filter(Boolean);
  return parts.join(' · ');
}

// The block the research prompt receives. Kept compact and labelled so the model knows these are
// the operator's own CRM fields, not public evidence.
export function intelBrief(row: any): string {
  const lines = [
    `HubSpot company: ${text(row?.company_name)}`,
    text(row?.domain) ? `Domain: ${text(row.domain)}` : '',
    text(row?.industry) ? `Industry: ${text(row.industry)}` : '',
    row?.employees ? `Headcount: ${Number(row.employees)}` : '',
    row?.annual_revenue ? `Annual revenue: ${Number(row.annual_revenue)}` : '',
    [text(row?.city), text(row?.country)].filter(Boolean).length
      ? `Headquarters: ${[text(row.city), text(row.country)].filter(Boolean).join(', ')}` : '',
    text(row?.lifecycle_stage) ? `Lifecycle stage: ${text(row.lifecycle_stage)}` : '',
    text(row?.last_activity) ? `CRM record last updated: ${text(row.last_activity)}` : '',
    text(row?.description) ? `CRM description: ${text(row.description)}` : ''
  ].filter(Boolean);
  return lines.join('\n');
}