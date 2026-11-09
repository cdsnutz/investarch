import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';

const HUBSPOT = 'https://api.hubapi.com';
const MAX_COMPANIES = 50;
const DESCRIPTION_LIMIT = 60000;

const text = (value) => String(value ?? '').trim();
const line = (label, value) => (text(value) ? `${label}: ${text(value)}\n` : '');

// HubSpot allows only a handful of calls per second, so every request is spaced out and a 429
// backs off and retries rather than dropping the company from the import.
let lastCallAt = 0;

async function hs(token, path, init = {}, attempt = 0) {
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

  return { ok: response.ok, status: response.status, body };
}

function propertiesOf(row) {
  const description = [
    line('Read', row['Description']),
    line('Buying trigger', row['Buying trigger']),
    line('Unique insight', row['Unique insight']),
    line('Recent public moves', row['Recent public moves']),
    line('Conviction', row['Conviction score'] ? `${row['Conviction score']}/100 · ${text(row['Evidence grade'])}` : ''),
    line('Linked InvestArch assets', row['Linked IP assets']),
    line('Budget owner', row['Budget owner']),
    line('Opening move', row['Opening move']),
    line('Proof to lead with', row['Proof to lead with']),
    line('First-touch subject', row['First-touch subject']),
    line('First-touch email', row['First-touch email']),
    line('Where to verify', row['Where to verify']),
    line('Sources', row['Sources'])
  ].join('');

  const properties = {
    name: text(row['Company name']),
    description: description.slice(0, DESCRIPTION_LIMIT)
  };
  if (text(row['Company domain name'])) properties.domain = text(row['Company domain name']);
  if (text(row['Website URL'])) properties.website = text(row['Website URL']);
  return properties;
}

async function searchBy(token, propertyName, value) {
  const result = await hs(token, '/crm/v3/objects/companies/search', {
    method: 'POST',
    body: JSON.stringify({
      filterGroups: [{ filters: [{ propertyName, operator: 'EQ', value }] }],
      properties: ['name', 'domain'],
      limit: 1
    })
  });
  if (!result.ok) {
    throw new Error(`HubSpot search failed (${result.status}): ${JSON.stringify(result.body).slice(0, 200)}`);
  }
  return result.body?.results?.[0] || null;
}

async function upsertCompany(token, row) {
  const properties = propertiesOf(row);
  const existing = (properties.domain ? await searchBy(token, 'domain', properties.domain) : null)
    || await searchBy(token, 'name', properties.name);

  if (existing) {
    const updated = await hs(token, `/crm/v3/objects/companies/${existing.id}`, {
      method: 'PATCH',
      body: JSON.stringify({ properties })
    });
    if (!updated.ok) {
      throw new Error(`update failed (${updated.status}): ${JSON.stringify(updated.body).slice(0, 200)}`);
    }
    return { company: properties.name, id: String(updated.body.id), action: 'updated' };
  }

  const created = await hs(token, '/crm/v3/objects/companies', {
    method: 'POST',
    body: JSON.stringify({ properties })
  });
  if (!created.ok) {
    throw new Error(`create failed (${created.status}): ${JSON.stringify(created.body).slice(0, 200)}`);
  }
  return { company: properties.name, id: String(created.body.id), action: 'created' };
}

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    if (user.role !== 'admin') return Response.json({ error: 'Admin access required' }, { status: 403 });

    const { companies } = await req.json().catch(() => ({}));
    if (!Array.isArray(companies) || companies.length === 0) {
      return Response.json({ error: 'companies is required' }, { status: 400 });
    }
    if (companies.length > MAX_COMPANIES) {
      return Response.json({ error: `Up to ${MAX_COMPANIES} companies per import` }, { status: 400 });
    }

    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection('hubspot');
    if (!accessToken) return Response.json({ error: 'HubSpot is not connected' }, { status: 400 });

    const results = [];
    const failed = [];
    for (const row of companies) {
      try {
        results.push(await upsertCompany(accessToken, row));
      } catch (error) {
        console.log('hubspotImportBuyers company failed', row?.['Company name'], error?.message);
        failed.push({
          company: text(row?.['Company name']) || 'Unnamed company',
          reason: String(error?.message || 'write failed')
        });
      }
    }

    // Read every written record back so the count reflects what HubSpot actually holds.
    let landed = [];
    if (results.length) {
      const check = await hs(accessToken, '/crm/v3/objects/companies/batch/read', {
        method: 'POST',
        body: JSON.stringify({
          properties: ['name', 'domain'],
          inputs: results.map((result) => ({ id: result.id }))
        })
      });
      if (!check.ok) {
        console.log('hubspotImportBuyers verify failed', check.status, JSON.stringify(check.body).slice(0, 300));
        return Response.json({
          error: `Wrote ${results.length} companies but could not confirm them (${check.status})`,
          created: results.filter((r) => r.action === 'created').length,
          updated: results.filter((r) => r.action === 'updated').length,
          failed
        }, { status: 502 });
      }
      const stored = new Map((check.body?.results || []).map((record) => [String(record.id), record]));
      landed = results
        .filter((result) => stored.has(result.id))
        .map((result) => ({ ...result, name: stored.get(result.id)?.properties?.name || result.company }));
    }

    return Response.json({
      created: landed.filter((row) => row.action === 'created').length,
      updated: landed.filter((row) => row.action === 'updated').length,
      landed,
      failed,
      portalId: connectionConfig?.hub_id || null,
      checkedAt: new Date().toISOString()
    });
  } catch (error) {
    console.log('hubspotImportBuyers error', error?.message);
    return Response.json({ error: error?.message || 'HubSpot import failed' }, { status: 500 });
  }
}