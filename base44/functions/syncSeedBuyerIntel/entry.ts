// Pulls the buyer companies a seed names out of HubSpot, stores what the CRM holds about them, and
// re-runs the public-source read only where the intel moved after the profile was written. Runs
// automatically when a seed gains its named buyers, and on demand from the IP Factory.
//
// Nothing here treats a CRM field as evidence: the record aims the research, the research still has
// to stand on public sources.

import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clean } from '../../shared/serp.ts';
import { pullCompanyIntel, storeIntel } from '../../shared/hubspotIntel.ts';
import { MAX_BUYERS, researchBuyers } from '../../shared/buyerResearch.ts';

const MAX_SEEDS = 8;
const RECENT_SEEDS_SCANNED = 40;

function namedBuyers(seed: any): string[] {
  const names: string[] = [];
  (Array.isArray(seed?.buyer_leads) ? seed.buyer_leads : []).forEach((lead: any) => {
    const company = clean(lead?.company);
    if (!company) return;
    const key = company.toLowerCase();
    if (!names.some((name) => name.toLowerCase() === key)) names.push(company);
  });
  return names.slice(0, MAX_BUYERS);
}

const at = (value: any) => Date.parse(clean(value)) || 0;

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error: any) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const seedId = clean(body?.seed_id);

    let seeds: any[] = [];
    if (seedId) {
      const seed = await base44.entities.IpSeed.get(seedId).catch(() => null);
      if (seed?.id) seeds = [seed];
    } else {
      const limit = Math.min(Math.max(Number(body?.limit) || 6, 1), MAX_SEEDS);
      const page = await base44.entities.IpSeed.filter({}, { sort: '-created_date', limit: RECENT_SEEDS_SCANNED });
      seeds = (page.items || []).filter((seed: any) => namedBuyers(seed).length).slice(0, limit);
    }

    if (!seeds.length) {
      return Response.json({ seeds: 0, matched: 0, researched: 0, note: 'No seed has named buyers yet — draft buyer leads first.' });
    }

    const { accessToken, connectionConfig } = await base44.asServiceRole.connectors.getConnection('hubspot');
    if (!accessToken) return Response.json({ error: 'HubSpot is not connected' }, { status: 400 });
    const portalId = clean(connectionConfig?.hub_id);

    let matched = 0;
    let storedIntel = 0;
    let researched = 0;
    const missing = new Set<string>();
    const perSeed: any[] = [];

    for (const seed of seeds) {
      const named = namedBuyers(seed);
      if (!named.length) continue;

      const { rows, missed } = await pullCompanyIntel(accessToken, named, portalId);
      missed.forEach((name) => missing.add(name));
      if (rows.length) {
        storedIntel += await storeIntel(base44, rows, seed.id);
        matched += rows.length;
      }

      // Only profiles the CRM has moved past are researched again, so a seed that merely gains a
      // playbook does not re-bill the search desk for buyers it already read.
      const keys = rows.map((row) => row.company);
      const onFile = new Map<string, any>();
      if (keys.length) {
        const { items } = await base44.entities.BuyerResearch.filter({ company: { $in: keys } }, { limit: keys.length });
        (items || []).forEach((row: any) => onFile.set(row.company, row));
      }

      const due = rows.filter((row) => {
        const existing = onFile.get(row.company);
        if (!existing) return true;
        const researchedAt = at(existing.researched_date);
        const crmAt = at(row.last_activity) || at(row.synced_date);
        return crmAt > researchedAt;
      });

      if (due.length) {
        const leads = new Map<string, any>(
          (Array.isArray(seed.buyer_leads) ? seed.buyer_leads : [])
            .map((lead: any) => [clean(lead?.company).toLowerCase(), lead])
        );
        const buyers = due.map((row) => {
          const lead = leads.get(row.company) || {};
          return {
            company: row.company_name,
            category: clean(lead.category),
            why_fit: clean(lead.why_fit),
            assets: [clean(seed.title)],
            seed_ids: [seed.id]
          };
        });
        const outcome = await researchBuyers(base44, buyers);
        researched += outcome.stored;
      }

      perSeed.push({ seed_id: seed.id, title: seed.title, named: named.length, matched: rows.length, refreshed: due.length });
    }

    const missingNames = Array.from(missing).slice(0, 20);
    const note = matched
      ? `${matched} of the named buyers matched a HubSpot company · ${researched} profile${researched === 1 ? '' : 's'} rewritten on the latest intel`
      : 'No named buyer matched a company in HubSpot — import the buyers there and the intel will follow.';

    console.log(`[syncSeedBuyerIntel] ${perSeed.length} seeds · ${matched} matched · ${storedIntel} stored · ${researched} researched`);
    return Response.json({ seeds: perSeed.length, matched, stored: storedIntel, researched, note, missing: missingNames, perSeed });
  } catch (error: any) {
    console.error('[syncSeedBuyerIntel] failed', error?.message);
    return Response.json({ error: error?.message || 'The HubSpot pull failed' }, { status: 500 });
  }
}