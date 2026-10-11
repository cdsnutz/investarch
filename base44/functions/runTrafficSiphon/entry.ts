import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { pickSeedTargets, normTitle } from "../../shared/seedTargets.ts";

const GROWTH_SCHEMA = {
  type: "object",
  properties: {
    kits: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seed_title: { type: "string" },
          ad_copy: {
            type: "array",
            items: {
              type: "object",
              properties: { channel: { type: "string" }, copy: { type: "string" } },
              required: ["channel", "copy"]
            }
          },
          seo_title: { type: "string" },
          seo_meta: { type: "string" },
          keywords: { type: "array", items: { type: "string" } },
          outreach: {
            type: "array",
            items: {
              type: "object",
              properties: { platform: { type: "string" }, post: { type: "string" } },
              required: ["platform", "post"]
            }
          },
          traffic_forecast: { type: "number" },
          compliance_note: { type: "string" }
        },
        required: ["seed_title", "ad_copy", "seo_title", "seo_meta", "keywords", "outreach", "traffic_forecast", "compliance_note"]
      }
    }
  },
  required: ["kits"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    const db = user ? base44.entities : base44.asServiceRole.entities;

    const body = await req.json().catch(() => ({}));
    const targets = await pickSeedTargets(base44, 'GrowthKit', (body?.seedId || '').trim(), 3, { status: 'built' });
    if (!targets.length) return Response.json({ kits_created: 0, note: 'No deployed assets awaiting a traffic kit.' });

    const prompt = `You are the Traffic-Siphon Pod of a sovereign IP conglomerate: the revenue generator. For each live asset below, produce an AGGRESSIVE DISTRIBUTION KIT that drives targeted traffic without human marketing effort.

For EACH asset:
1. seed_title — copy the asset's title exactly.
2. ad_copy — 3 ad variants for distinct channels (search, social, native), each {channel, copy}: headline plus 1-2 lines of body, conversion-grade.
3. seo_title — the SEO-optimized landing page title (60 chars max).
4. seo_meta — the meta description (155 chars max).
5. keywords — 5 to 8 commercial-intent keywords this asset should own.
6. outreach — 3 community posts (X, LinkedIn, Reddit), each {platform, post}: platform-native tone, value-first, with the asset's positioning. Reddit must read as genuine participation, not an ad.
7. traffic_forecast — realistic monthly visitor projection for an organic-plus-paid launch of this kit (number).
8. compliance_note — one sentence on the platform rules that govern this outreach (disclosures, self-promotion limits, subreddit rules) so the operator stays within policy.

ASSETS:
${JSON.stringify(targets.map((s) => ({ id: s.id, title: s.title, gap: s.gap, solution: s.solution, mini_plan: s.mini_plan })))}

Use live market context where it sharpens the copy. Zero filler; every sentence converts or informs.`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      model: 'gemini_3_8_flash',
      response_json_schema: GROWTH_SCHEMA
    });
    const kits = (res?.kits || []).slice(0, targets.length);
    if (!kits.length) return Response.json({ error: 'Traffic-Siphon returned no kits.' }, { status: 502 });

    const byTitle = new Map(targets.map((t) => [normTitle(t.title), t.id]));
    const records = kits
      .map((k) => ({
        seed_id: byTitle.get(normTitle(k.seed_title)) || '',
        ad_copy: Array.isArray(k.ad_copy) ? k.ad_copy.slice(0, 3) : [],
        seo_title: k.seo_title || '',
        seo_meta: k.seo_meta || '',
        keywords: Array.isArray(k.keywords) ? k.keywords.slice(0, 8) : [],
        outreach: Array.isArray(k.outreach) ? k.outreach.slice(0, 3) : [],
        traffic_forecast: typeof k.traffic_forecast === 'number' ? k.traffic_forecast : 0,
        compliance_note: k.compliance_note || '',
        generated_date: new Date().toISOString().slice(0, 10)
      }))
      .filter((r) => r.seed_id);
    if (!records.length) return Response.json({ error: 'Traffic kits did not match any asset.' }, { status: 502 });

    const created = await db.GrowthKit.bulkCreate(records);
    return Response.json({ kits_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}