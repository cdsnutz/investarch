import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { PLAN_SCHEMA, PLAN_POINTS, loadPipelineContext } from "../../shared/planPipeline.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = (body?.projectId || '').trim();
    if (!projectId) return Response.json({ error: 'A project id is required.' }, { status: 400 });

    const { dossier } = await loadPipelineContext(base44, projectId);

    const planPrompt = `You are a senior strategy consultant and business plan architect. Below is a completed investment dossier on a company. Produce a complete 20-point business plan using EXACTLY these 20 points in this order:

${PLAN_POINTS}

For each point: title (the point name) and content (2 to 4 dense paragraphs or a tight structured breakdown, grounded ONLY in the dossier. Where the dossier lacks information, write the most defensible position possible and state the assumption explicitly instead of inventing facts).

SELF-OPTIMIZATION LOOP (mandatory, run it in this order):
Pass 1: draft all 20 points.
Pass 2: score each point 0-10 on specificity, evidence, and investor readability.
Pass 3: rewrite every point that scored below 8. Push it to concrete numbers, named mechanisms, and falsifiable claims. Record what changed in revision_note. Points that scored 8 or higher keep the pass-1 text with an empty revision_note.
Output only the final optimized 20 points, each with its final score, plus the count of points you rewrote as revisions.
Truthful, grounded, specific. Never use em dashes in any copy. No filler adjectives.

DOSSIER:
${JSON.stringify(dossier)}`;

    const plan = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: planPrompt,
      response_json_schema: PLAN_SCHEMA
    });

    await base44.entities.Project.update(projectId, {
      plan_points: (plan.points || []).map(p => ({
        index: p.index,
        title: p.title,
        content: p.content,
        score: p.score,
        revision_note: p.revision_note || ''
      })),
      plan_revisions: plan.revisions || 0
    });

    return Response.json({ ok: true, points: (plan.points || []).length, revisions: plan.revisions || 0 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}