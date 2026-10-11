import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { normTitle } from "../../shared/seedTargets.ts";

const SCAN_SCHEMA = {
  type: "object",
  properties: {
    findings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          seed_title: { type: "string" },
          suspected_infringer: { type: "string" },
          evidence_note: { type: "string" },
          severity: { type: "string", enum: ["low", "medium", "high"] },
          cease_desist_text: { type: "string" }
        },
        required: ["seed_title", "suspected_infringer", "evidence_note", "severity", "cease_desist_text"]
      }
    }
  },
  required: ["findings"]
};

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    // Scheduled runs arrive without a user session; manual runs carry one.
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
    const db = base44.entities;

    const [filingPage, alertPage, seedPage] = await Promise.all([
      base44.entities.IpFiling.filter({}, { limit: 500, fields: ['seed_id', 'filing_type', 'brand_name'] }),
      base44.entities.InfringementAlert.filter({}, { limit: 300, fields: ['seed_id'] }),
      base44.entities.IpSeed.filter({}, { limit: 300, fields: ['title'] })
    ]);

    const hardened = new Set((filingPage.items || []).map((f) => f.seed_id));
    const alreadyAlerted = new Set((alertPage.items || []).map((a) => a.seed_id));
    const titleById = new Map((seedPage.items || []).map((s) => [s.id, s.title]));
    const targets = (filingPage.items || [])
      .filter((f) => hardened.has(f.seed_id) && !alreadyAlerted.has(f.seed_id))
      .slice(0, 3)
      .map((f) => ({ id: f.seed_id, title: titleById.get(f.seed_id) || 'Unnamed asset', brand_name: f.brand_name || '', filing_type: f.filing_type }));
    if (!targets.length) return Response.json({ alerts_created: 0, note: 'Every hardened asset is already under watch.' });

    const prompt = `You are the IP-protection watchdog inside InvestArch. Continuously hunt for infringement of the portfolio's protected IP and convert breaches into licensing revenue.

Below are ${targets.length} protected assets (patent drafts filed / trademarks drafted). Search the live web for infringement signals: brand or mark misuse, confusingly similar names or products, cloned core mechanics, copycat landing pages.

For EACH asset, only if you find a CONCRETE, nameable suspicion, return one finding:
1. seed_title — copy the asset's title exactly.
2. suspected_infringer — the named company/product/username and where the suspected infringement lives.
3. evidence_note — what was observed and why it likely infringes. Label anything inferred. If evidence is weak, say so here rather than inflating severity.
4. severity — low / medium / high.
5. cease_desist_text — a SURGICAL CEASE & DESIST letter (200 to 300 words) in Black's Law register: identification of the asserted rights, the infringing act, demand for immediate cessation OR a paid licensing arrangement within a stated cure period, reservation of all rights and remedies, and a line stating it is a draft for attorney review before dispatch.

If an asset shows no credible infringement signal, return NO finding for it — absence of findings is a valid result.

PROTECTED ASSETS:
${JSON.stringify(targets)}`;

    const res = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      add_context_from_internet: true,
      response_json_schema: SCAN_SCHEMA
    });
    const findings = (res?.findings || []).slice(0, targets.length);
    if (!findings.length) return Response.json({ alerts_created: 0, clean: true, note: 'No infringement signals detected across watched assets.' });

    const byTitle = new Map(targets.map((t) => [normTitle(t.title), t.id]));
    const records = findings
      .map((f) => ({
        seed_id: byTitle.get(normTitle(f.seed_title)) || '',
        suspected_infringer: f.suspected_infringer || '',
        evidence_note: f.evidence_note || '',
        severity: ['low', 'medium', 'high'].includes(f.severity) ? f.severity : 'medium',
        cease_desist_text: f.cease_desist_text || '',
        status: 'letter_drafted',
        detected_date: new Date().toISOString().slice(0, 10)
      }))
      .filter((r) => r.seed_id && r.suspected_infringer);
    if (!records.length) return Response.json({ alerts_created: 0, clean: true, note: 'No infringement signals detected across watched assets.' });

    const created = await db.InfringementAlert.bulkCreate(records);
    return Response.json({ alerts_created: (created || []).length || records.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}