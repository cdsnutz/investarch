import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';
import { SCAN_SCHEMA, loadPipelineContext } from "../../shared/planPipeline.ts";

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = (body?.projectId || '').trim();
    if (!projectId) return Response.json({ error: 'A project id is required.' }, { status: 400 });

    const { project, dossier } = await loadPipelineContext(base44, projectId);
    if (!Array.isArray(project.plan_points) || project.plan_points.length === 0) {
      return Response.json({ error: 'Run the business plan stage first.' }, { status: 400 });
    }

    const scanPrompt = `You are a rigorous investment diligence auditor. Below are a 20-point business plan and the underlying dossier for a company. Run a 100-point value scan on the plan.

METHOD (exact):
- Exactly 10 categories, exactly 10 checks per category, 100 checks total.
- Categories, in order: Market & Timing; Product & Defensibility; Business Model; Unit Economics; Financial Plan; Traction & Execution; Go-to-Market; Risk Profile; Funding Fit; Narrative Quality.
- Each check: point (running number 1-100), category, score (0 or 1: award 1 ONLY if the plan substantiates the check with specific evidence or a clearly stated, plausible assumption; 0 if generic, unsupported, or missing), verdict ("pass" or "gap"), note (one specific sentence; for a gap, state exactly what is missing and what evidence would close it).

Score truthfully. Do not award charity points: a weak plan must scan weak, because the score is the user's map of what to fix. total = sum of all check scores, out of 100. Also output per-category subtotals as dimensions (category, score, max: 10).
Never use em dashes in any copy.

BUSINESS PLAN (20 points):
${JSON.stringify(project.plan_points)}

UNDERLYING DOSSIER:
${JSON.stringify(dossier)}`;

    const scan = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: scanPrompt,
      response_json_schema: SCAN_SCHEMA
    });

    await base44.entities.Project.update(projectId, {
      scan_score: scan.total,
      value_scan: {
        total: scan.total,
        generated_date: new Date().toISOString(),
        dimensions: scan.dimensions || [],
        checks: scan.checks || []
      }
    });

    return Response.json({ ok: true, scan_score: scan.total });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}