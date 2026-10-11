// Shared context loader and schemas for the staged value-engine pipeline:
// buildPlanPoints -> runValueScan -> draftFundingLetters

export const PLAN_SCHEMA = {
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

export const SCAN_SCHEMA = {
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

export const DRAFTS_SCHEMA = {
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

export const PLAN_POINTS = `1. Executive Summary
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

export async function loadPipelineContext(base44, projectId) {
  let project;
  try {
    project = await base44.entities.Project.get(projectId);
  } catch {
    project = null;
  }
  if (!project) throw new Error('Project not found.');
  if (project.status !== 'complete') {
    throw new Error('The base dossier analysis must finish first.');
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

  return { project, funding: funding.items, competitors, dossier };
}