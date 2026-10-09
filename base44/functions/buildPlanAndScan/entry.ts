import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const PLAN_SCHEMA = {
  type: "object",
  properties: {
    points: {
      type: "array",
      items: {
        type: "object",
        properties: {
          index: { type: "number" },
          title: { type: "string" },
          content: { type: "string" },
          score: { type: "number" },
          revision_note: { type: "string" }
        },
        required: ["index", "title", "content", "score"]
      }
    },
    revisions: { type: "number" }
  },
  required: ["points", "revisions"]
};

const SCAN_SCHEMA = {
  type: "object",
  properties: {
    total: { type: "number" },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          category: { type: "string" },
          score: { type: "number" },
          max: { type: "number" }
        },
        required: ["category", "score", "max"]
      }
    },
    checks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          point: { type: "number" },
          category: { type: "string" },
          score: { type: "number" },
          verdict: { type: "string" },
          note: { type: "string" }
        },
        required: ["point", "category", "score", "verdict", "note"]
      }
    }
  },
  required: ["total", "dimensions", "checks"]
};

const DRAFTS_SCHEMA = {
  type: "object",
  properties: {
    drafts: {
      type: "array",
      items: {
        type: "object",
        properties: {
          funding_source_id: { type: "string" },
          application: { type: "string" },
          outreach_subject: { type: "string" },
          outreach_email: { type: "string" }
        },
        required: ["funding_source_id", "application", "outreach_subject", "outreach_email"]
      }
    }
  },
  required: ["drafts"]
};

const PLAN_POINTS = `1. Executive Summary
2. Company Overview
3. The Problem
4. The Solution (product and service detail)
5. Market Opportunity (TAM, SAM, SOM)
6. Target Customer
7. Competitive Landscape
8. Competitive Moat
9. Business Model
10. Unit Economics
11. Pricing Strategy
12. Go-to-Market Plan
13. Sales Channels and Partnerships
14. Operations Plan
15. Technology and IP
16. Team and Key Hires
17. Traction and Milestones
18. Financial Plan (3-5 year)
19. Risk Analysis and Mitigation
20. Funding Ask and Use of Funds`;

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = (body?.projectId || '').trim();
    if (!projectId) return Response.json({ error: 'A project id is required.' }, { status: 400 });

    let project;
    try {
      project = await base44.entities.Project.get(projectId);
    } catch {
      project = null;
    }
    if (!project) return Response.json({ error: 'Project not found.' }, { status: 404 });
    if (project.status !== 'complete') {
      return Response.json({ error: 'The base dossier analysis must finish first.' }, { status: 400 });
    }

    const [funding, competitors] = await Promise.all([
      base44.entities.FundingSource.filter({ project_id: projectId }, { limit: 20 }),
      base44.entities.Competitor.filter({ project_id: projectId }, { limit: 20 })
    ]);

    const dossier = {
      company_name: project.company_name,
      industry: project.industry,
      url: project.url,
      value_proposition: project.value_proposition,
      executive_summary: project.executive_summary,
      market_analysis: project.market_analysis,
      strategic_edge: project.strategic_edge,
      financial_forecast: project.financial_forecast,
      forecast_years: project.forecast_years,
      investor_narrative: project.investor_narrative,
      key_milestones: project.key_milestones,
      competitors,
      funding_sources: funding.items.map(f => ({ id: f.id, name: f.name, type: f.type, focus_area: f.focus_area, stage: f.stage }))
    };

    // --- Stage 1: 20-point business plan with self-optimization loop ---
    const planPrompt = `You are a senior strategy consultant and business plan architect. Below is a completed investment dossier on a company. Produce a complete 20-point business plan using EXACTLY these 20 points in this order:

${PLAN_POINTS}

For each point: title (the point name) and content (2 to 4 dense paragraphs or a tight structured breakdown, grounded ONLY in the dossier. Where the dossier lacks information, write the most defensible position possible and state the assumption explicitly instead of inventing facts).

SELF-OPTIMIZATION LOOP (mandatory, run it in this order):
Pass 1: draft all 20 points.
Pass 2: score each point 0-10 on specificity, evidence, and investor readability.
Pass 3: rewrite every point that scored below 8. Push it to concrete numbers, named mechanisms, and falsifiable claims. Record what changed in revision_note. Points that scored 8 or higher keep the pass-1 text with an empty revision_note.
Output only the final optimized 20 points, each with its final score, plus the count of points you rewrote as revisions.
Truthful, grounded, specific. Never use em dashes in any copy. No filler adjectives.`;

    const plan = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: planPrompt,
      model: "claude-sonnet-5",
      response_json_schema: PLAN_SCHEMA
    });

    // --- Stage 2: 100-point value scan on the optimized plan ---
    const scanPrompt = `You are a rigorous investment diligence auditor. Below are a 20-point business plan and the underlying dossier for a company. Run a 100-point value scan on the plan.

METHOD (exact):
- Exactly 10 categories, exactly 10 checks per category, 100 checks total.
- Categories, in order: Market & Timing; Product & Defensibility; Business Model; Unit Economics; Financial Plan; Traction & Execution; Go-to-Market; Risk Profile; Funding Fit; Narrative Quality.
- Each check: point (running number 1-100), category, score (0 or 1: award 1 ONLY if the plan substantiates the check with specific evidence or a clearly stated, plausible assumption; 0 if generic, unsupported, or missing), verdict ("pass" or "gap"), note (one specific sentence; for a gap, state exactly what is missing and what evidence would close it).

Score truthfully. Do not award charity points: a weak plan must scan weak, because the score is the user's map of what to fix. total = sum of all check scores, out of 100. Also output per-category subtotals as dimensions (category, score, max: 10).
Never use em dashes in any copy.

BUSINESS PLAN (20 points):
${JSON.stringify(plan.points)}

UNDERLYING DOSSIER:
${JSON.stringify(dossier)}`;

    const scan = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: scanPrompt,
      model: "claude-sonnet-5",
      response_json_schema: SCAN_SCHEMA
    });

    // --- Stage 3: grant applications and outreach drafts per funding source ---
    let matched = [];
    if (funding.items.length > 0) {
      const draftsPrompt = `You are a grant-writing specialist and investor-relations lead. Using the 20-point business plan and dossier below, produce tailored drafts for EVERY funding source listed.

For each funding source produce:
- funding_source_id: copy the source's id EXACTLY.
- application: for grants, a full application narrative structured for pasting into a portal (need statement, objectives, approach, budget framing, impact and measurement). For vc, angel, or loan: a tailored pitch letter. 250 to 400 words, grounded only in the plan.
- outreach_subject: one specific subject line, no clickbait.
- outreach_email: 150 to 250 words, one clear ask, grounded in the plan, addressed to the source's focus area. No flattery filler.
Never use em dashes in any copy.

BUSINESS PLAN:
${JSON.stringify(plan.points)}

FUNDING SOURCES (JSON):
${JSON.stringify(funding.items.map(f => ({ id: f.id, name: f.name, type: f.type, focus_area: f.focus_area, alignment_rationale: f.alignment_rationale, stage: f.stage, contact_info: f.contact_info })))}`;

      const drafts = await base44.asServiceRole.integrations.Core.InvokeLLM({
        prompt: draftsPrompt,
        response_json_schema: DRAFTS_SCHEMA
      });

      const validIds = new Set(funding.items.map(f => f.id));
      matched = (drafts.drafts || []).filter(d => validIds.has(d.funding_source_id));
    }

    // --- Persist everything ---
    await base44.entities.Project.update(projectId, {
      plan_points: (plan.points || []).map(p => ({
        index: p.index,
        title: p.title,
        content: p.content,
        score: p.score,
        revision_note: p.revision_note || ''
      })),
      plan_revisions: plan.revisions || 0,
      scan_score: scan.total,
      value_scan: {
        total: scan.total,
        generated_date: new Date().toISOString(),
        dimensions: scan.dimensions || [],
        checks: scan.checks || []
      }
    });

    if (matched.length > 0) {
      await base44.entities.FundingSource.bulkUpdate(matched.map(d => ({
        id: d.funding_source_id,
        application_draft: d.application,
        outreach_subject: d.outreach_subject,
        outreach_email: d.outreach_email
      })));
    }

    return Response.json({
      ok: true,
      scan_score: scan.total,
      plan_revisions: plan.revisions || 0,
      drafts_saved: matched.length
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}