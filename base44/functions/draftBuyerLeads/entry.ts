import { createClientFromRequest } from 'npm:@base44/sdk@0.8.54';
import { draftLeadsForSeed, leadTarget } from '../../shared/buyerLeads.ts';

const MAX_PER_SWEEP = 3;

export default async function (req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me().catch((e) => (e.status === 401 ? null : Promise.reject(e)));
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const sweep = body?.action === 'sweep';

    let targets = [];
    if (sweep) {
      const { items } = await base44.entities.IpSeed.filter({}, { sort: '-asymmetric_score', limit: 60 });
      targets = (items || []).filter(leadTarget).slice(0, MAX_PER_SWEEP);
      if (!targets.length) {
        return Response.json({ drafted: 0, attempted: 0, results: [], recipient: user.email, digest: '', note: 'Every seed already carries pitched buyer leads.' });
      }
    } else {
      const seedId = typeof body?.seedId === 'string' ? body.seedId : '';
      if (!seedId) return Response.json({ error: 'seedId is required' }, { status: 400 });
      const seed = await base44.entities.IpSeed.get(seedId).catch((e) => (e.status === 404 ? null : Promise.reject(e)));
      if (!seed) return Response.json({ error: 'Seed not found' }, { status: 404 });
      targets = [seed];
    }

    const results = [];
    const digestParts = [];
    let leadTotal = 0;
    for (const seed of targets) {
      try {
        const drafted = await draftLeadsForSeed(base44, seed);
        if (!drafted.leads.length) {
          results.push({ seed: seed.title, ok: false, error: 'No usable leads came back.' });
          continue;
        }

        await base44.entities.IpSeed.update(seed.id, {
          buyer_leads: drafted.leads,
          buyer_leads_date: drafted.date
        });

        await base44.entities.ActivityEvent.create({
          action: 'Buyer leads drafted',
          detail: `${seed.title} — ${drafted.leads.length} named buyers with written pitches${drafted.coverage_note ? ` (${drafted.coverage_note})` : ''}`,
          timestamp: new Date().toISOString()
        });

        results.push({
          seed: seed.title,
          ok: true,
          leads: drafted.leads.length,
          companies: drafted.leads.map((lead) => lead.company),
          coverage_note: drafted.coverage_note
        });

        leadTotal += drafted.leads.length;
        digestParts.push([
          seed.title.toUpperCase(),
          drafted.leads
            .map((lead) => `• ${lead.company} — ${lead.category} · ${lead.contact_role}\n  Subject: ${lead.subject}\n  Why them: ${lead.why_fit}\n  Pitch: ${lead.pitch}`)
            .join('\n\n'),
          drafted.coverage_note ? `Coverage note: ${drafted.coverage_note}` : ''
        ].filter(Boolean).join('\n'));
      } catch (error) {
        console.log('draftBuyerLeads seed failed:', seed.id, error?.message);
        results.push({ seed: seed.title, ok: false, error: error?.message });
      }
    }

    return Response.json({
      drafted: results.filter((result) => result.ok).length,
      attempted: targets.length,
      results,
      lead_total: leadTotal,
      seeds_line: results.filter((result) => result.ok).map((result) => result.seed).join(' · '),
      digest: digestParts.join('\n\n\n'),
      digest_date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      recipient: user.email
    });
  } catch (error) {
    console.log('draftBuyerLeads failed:', error?.message);
    return Response.json({ error: error.message }, { status: 500 });
  }
}