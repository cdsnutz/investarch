import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { clean } from '../../shared/serp.ts';
import { MAX_BUYERS, researchBuyers } from '../../shared/buyerResearch.ts';

export default async function (req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((error: any) => (error?.status === 401 ? null : Promise.reject(error)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const incoming = Array.isArray(body?.buyers) ? body.buyers.slice(0, MAX_BUYERS) : [];

    const buyers = incoming
      .map((buyer: any) => ({
        company: clean(buyer?.company).slice(0, 120),
        category: clean(buyer?.category).slice(0, 40),
        why_fit: clean(buyer?.why_fit).slice(0, 600),
        assets: Array.isArray(buyer?.assets) ? buyer.assets.map(clean).filter(Boolean).slice(0, 3) : [],
        pitch: clean(buyer?.pitch).slice(0, 700),
        seed_ids: Array.isArray(buyer?.seed_ids) ? buyer.seed_ids.map(clean).filter(Boolean).slice(0, 12) : []
      }))
      .filter((buyer: any) => buyer.company);

    if (!buyers.length) return Response.json({ error: 'buyers is required' }, { status: 400 });

    const result = await researchBuyers(base44, buyers);
    return Response.json(result);
  } catch (error: any) {
    console.error('[buyerIntel] failed', error?.message);
    return Response.json({ error: error?.message || 'Buyer research failed' }, { status: 500 });
  }
}