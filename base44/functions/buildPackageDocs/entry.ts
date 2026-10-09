import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SECTION_ITEM = {
  type: "object",
  properties: {
    heading: { type: "string" },
    body: { type: "string" }
  },
  required: ["heading", "body"]
};

const SPEC_SCHEMA = {
  type: "object",
  properties: {
    prd: {
      type: "object",
      properties: {
        title: { type: "string" },
        sections: { type: "array", items: SECTION_ITEM }
      },
      required: ["title", "sections"]
    },
    spec: {
      type: "object",
      properties: {
        title: { type: "string" },
        sections: { type: "array", items: SECTION_ITEM }
      },
      required: ["title", "sections"]
    }
  },
  required: ["prd", "spec"]
};

const AUDIT_SCHEMA = {
  type: "object",
  properties: {
    legal: {
      type: "object",
      properties: {
        title: { type: "string" },
        sections: { type: "array", items: SECTION_ITEM }
      },
      required: ["title", "sections"]
    },
    irs: {
      type: "object",
      properties: {
        overall: { type: "number" },
        dimensions: {
          type: "array",
          items: {
            type: "object",
            properties: {
              name: { type: "string" },
              score: { type: "number" },
              max: { type: "number" },
              note: { type: "string" }
            },
            required: ["name", "score", "max", "note"]
          }
        },
        enhancement_ideas: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" },
              detail: { type: "string" },
              score_impact: { type: "number" }
            },
            required: ["title", "detail", "score_impact"]
          }
        }
      },
      required: ["overall", "dimensions", "enhancement_ideas"]
    }
  },
  required: ["legal", "irs"]
};

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

    const funding = await base44.entities.FundingSource.filter({ project_id: projectId }, { limit: 20 });

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
      plan_points: (project.plan_points || []).map(p => ({ title: p.title, content: p.content })),
      funding_sources: funding.items.map(f => ({ name: f.name, type: f.type, focus_area: f.focus_area, stage: f.stage }))
    };

    // --- Spec Pod: formal PRD + full technical specification ---
    const specPrompt = `You are a principal product architect writing for a funded engineering team. Below is an investment dossier on a company. Produce TWO documents grounded ONLY in this dossier.

DOCUMENT 1 (prd): a formal Product Requirements Document with sections covering, at minimum: Overview and Problem Statement; Goals and Success Metrics; Functional Requirements (each feature with an explicit "Definition of Done" line); Non-Functional Requirements (performance, security, compliance); Primary User Flows; Release Plan and Milestones.

DOCUMENT 2 (spec): a Full Technical Specification with sections covering, at minimum: System Architecture (describe components and API endpoints with method and path); Data Schemas (concrete field lists as bullet lines); Core Logic Flow (step by step); Recommended Stack and Dependencies; Operational Requirements (hosting, monitoring, backup); Definition of Done (global engineering bar).

Rules: sections is an array of {heading, body}. Use " - " dash-space for bullet lines inside body; separate paragraphs with a single newline. Where the dossier does not specify a technical detail, choose the most defensible design and state the assumption explicitly. Never use em dashes in any copy. No filler adjectives.

DOSSIER:
${JSON.stringify(dossier)}`;

    const spec = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: specPrompt,
      model: "claude-sonnet-5",
      response_json_schema: SPEC_SCHEMA
    });

    // --- Legal Pod (Black's Law hardening) + Scoring Pod (Investment Readiness Score) ---
    const auditPrompt = `You are a corporate-law prose specialist and an institutional investment readiness auditor. Below is an investment dossier on a company. Produce TWO outputs.

OUTPUT 1 (legal): a Legal Framework document that reframes the company's position in the high-authority terminology of Black's Law Dictionary and institutional finance. Replace entrepreneurial language with institutional language: "owner" becomes "proprietor / title-holder", "agreement" becomes "covenant / indenture", "revenue" may become "gross receipts", "assets" become "collateralized assets", "intellectual property" is framed as "proprietary intellectual property easements", and so on. Sections to include: Entity Position and Standing; Proprietary Rights and Title; Covenant and Indenture Posture (contracts, customers, suppliers); Collateral and Risk-Mitigation Posture; Regulatory and Compliance Alignment; Scope Note (one honest section stating this document is a stylistic repositioning of the dossier's own facts, not legal advice). CRITICAL: harden the language, never fabricate legal facts, filings, registrations, or protections the dossier does not evidence.

OUTPUT 2 (irs): an Investment Readiness audit. overall is 0 to 100. dimensions, each scored out of max: "TAM/SAM/SOM Analysis" (max 25), "Defensibility Moat" (max 25), "Scalability Vector" (max 25), "Legal Hardness" (max 25). Score truthfully against the dossier: a generic dossier must scan weak. Each dimension gets a one-sentence note grounded in the dossier. Then enhancement_ideas: 4 to 6 surgical, specific suggestions that would raise the score, each with title, detail (what to change and how, concretely), and score_impact (estimated points, e.g. 8).

Rules: sections is an array of {heading, body}; use " - " for bullet lines; separate paragraphs with a single newline. Never use em dashes in any copy. No filler.

DOSSIER:
${JSON.stringify(dossier)}`;

    const audit = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: auditPrompt,
      model: "claude-sonnet-5",
      response_json_schema: AUDIT_SCHEMA
    });

    // --- Packaging Pod: persist the four generated documents ---
    await base44.entities.PackageDocument.deleteMany({ project_id: projectId });
    await base44.entities.PackageDocument.bulkCreate([
      { project_id: projectId, kind: 'prd', title: spec.prd.title, sections: spec.prd.sections || [] },
      { project_id: projectId, kind: 'tech_spec', title: spec.spec.title, sections: spec.spec.sections || [] },
      { project_id: projectId, kind: 'legal_framework', title: audit.legal.title, sections: audit.legal.sections || [] },
      { project_id: projectId, kind: 'irs_audit', title: 'Investment Readiness Audit', audit: audit.irs }
    ]);

    return Response.json({ ok: true, irs: audit.irs.overall });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}