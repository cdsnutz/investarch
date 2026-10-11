import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { DRAFTS_SCHEMA, loadPipelineContext } from "../../shared/planPipeline.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = (body?.projectId || '').trim();
    if (!projectId) return Response.json({ error: 'A project id is required.' }, { status: 400 });

    const { project, funding } = await loadPipelineContext(base44, projectId);
    if (!Array.isArray(project.plan_points) || project.plan_points.length === 0) {
      return Response.json({ error: 'Run the business plan stage first.' }, { status: 400 });
    }
    if (funding.length === 0) {
      return Response.json({ error: 'This project has no funding sources to draft for.' }, { status: 400 });
    }

    const draftsPrompt = `You are a grant-writing specialist and investor-relations lead. Using the 20-point business plan and dossier below, produce tailored drafts for EVERY funding source listed.

For each funding source produce:
- funding_source_id: copy the source's id EXACTLY.
- application: for grants, a full application narrative structured for pasting into a portal (need statement, objectives, approach, budget framing, impact and measurement). For vc, angel, or loan: a tailored pitch letter. 250 to 400 words, grounded only in the plan.
- outreach_subject: one specific subject line, no clickbait.
- outreach_email: 150 to 250 words, one clear ask, grounded in the plan, addressed to the source's focus area. No flattery filler.
Never use em dashes in any copy.

BUSINESS PLAN:
${JSON.stringify(project.plan_points)}

FUNDING SOURCES (JSON):
${JSON.stringify(funding.map(f => ({ id: f.id, name: f.name, type: f.type, focus_area: f.focus_area, alignment_rationale: f.alignment_rationale, stage: f.stage, contact_info: f.contact_info })))}`;

    const drafts = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: draftsPrompt,
      response_json_schema: DRAFTS_SCHEMA
    });

    const validIds = new Set(funding.map(f => f.id));
    const matched = (drafts.drafts || []).filter(d => validIds.has(d.funding_source_id));

    if (matched.length > 0) {
      await base44.entities.FundingSource.bulkUpdate(matched.map(d => ({
        id: d.funding_source_id,
        application_draft: d.application,
        outreach_subject: d.outreach_subject,
        outreach_email: d.outreach_email
      })));
    }

    return Response.json({ ok: true, drafts_saved: matched.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}