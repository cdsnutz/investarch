import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const DOC_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          body: { type: "string" }
        },
        required: ["heading", "body"]
      }
    }
  },
  required: ["title", "sections"]
};

const AUDIT_SCHEMA = {
  type: "object",
  properties: {
    total: { type: "number" },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          dimension: { type: "string" },
          score: { type: "number" },
          max: { type: "number" },
          note: { type: "string" }
        },
        required: ["dimension", "score", "max", "note"]
      }
    },
    enhancements: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          action: { type: "string" }
        },
        required: ["title", "action"]
      }
    }
  },
  required: ["total", "dimensions", "enhancements"]
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

    const [competitors, funding] = await Promise.all([
      base44.entities.Competitor.filter({ project_id: projectId }, { limit: 20 }),
      base44.entities.FundingSource.filter({ project_id: projectId }, { limit: 20 })
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
      competitors: competitors.items.map(c => ({ name: c.name, strengths: c.strengths, weaknesses: c.weaknesses, our_advantage: c.our_advantage })),
      funding_sources: funding.items.map(f => ({ name: f.name, type: f.type, focus_area: f.focus_area, stage: f.stage }))
    };

    const rules = `\nDOSSIER:\n${JSON.stringify(dossier)}\nRules: ground every claim in the dossier; where data is missing, state the assumption explicitly instead of inventing facts. Plain text only, no markdown syntax. No em dashes. No filler adjectives. Every sentence must carry information.`;

    const prdPrompt = `You are a principal product architect (SPEC POD). Convert the business dossier into a formal Product Requirements Document for the company's core product, answering "what" is being built and "why".

Produce 6 to 9 sections covering, at minimum, in this order:
1. Product Vision and Problem Statement
2. Goals and Non-Goals
3. Target Users and Personas
4. Functional Requirements (numbered FR-1, FR-2, ... each with a one-line acceptance criterion)
5. Non-Functional Requirements (performance, security, reliability)
6. Success Metrics
7. Release Scope and Definition of Done (a numbered checklist a reviewer can verify)
Each section: heading plus a body of 1 to 3 tight paragraphs or numbered plain-text lines.${rules}`;

    const specPrompt = `You are a staff software architect (SPEC POD). Convert the business dossier into a full Technical Specification answering "how": the exact architecture, stack, and logic flow a development team can execute.

Produce 6 to 8 sections covering, at minimum, in this order:
1. System Architecture Overview (components and how they communicate)
2. Recommended Stack and Rationale
3. Data Schemas (main entities with their fields, plain text)
4. API Surface (endpoints: method, path, purpose, request and response shape)
5. Core Logic Flows (step-by-step, numbered)
6. Integrations and Third-Party Dependencies
7. Scalability and Failure Modes
8. Definition of Done per Major Feature (numbered, verifiable)
Ground the architecture in what this business actually needs; no fantasy platform.
${rules}`;

    const legalPrompt = `You are a legal drafting architect (LEGAL POD) trained on institutional drafting conventions drawn from Black's Law Dictionary. Convert the dossier into a Legal Framework document that replaces entrepreneurial language with high-authority legal terminology.

Substitution directives (apply consistently): owner becomes proprietor or title-holder; agreement becomes covenant or indenture; contract becomes instrument; partner becomes co-venturer; investor becomes capital contributor; business becomes enterprise or entity; plan becomes protocol; where supported by the dossier, intellectual property becomes proprietary intellectual property easements and assets are described as collateralized.

Produce exactly 5 sections, in this order:
1. Position of the Entity
2. Proprietary Rights and Intellectual Property
3. Risk-Mitigation Posture
4. Material Covenants and Obligations
5. Compliance and Governance
Each section 1 to 3 dense paragraphs. Where the dossier does not establish a fact (entity type, registrations, patents, filings), phrase it as a recommendation or state the assumption explicitly; never assert an invented legal fact. The final section's body must end with this exact sentence: "This framework is institutional drafting language; it is not a substitute for advice from qualified counsel."
${rules}`;

    const auditPrompt = `You are a rigorous investment readiness auditor (SCORING POD). Score the dossier's Investment Readiness (IRS) out of 100 using exactly four dimensions, 25 points each, in this order: Market Size (quality of the TAM/SAM/SOM analysis), Defensibility Moat, Scalability Vector (growth potential), Legal Hardness (compliance posture and IP protection).

Score truthfully, not generously: a dossier without quantified market sizing loses points on Market Size; an entity without registrations, IP protection, or compliance posture loses points on Legal Hardness. Each dimension gets note: one specific sentence naming what earned or lost points. Then produce 4 to 6 enhancements: surgical, concrete moves that raise the score, each with title and action describing exactly what to change and the expected score lift (for example, from 65 to 78).
${rules}`;

    const [prd, spec, legal, audit] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: prdPrompt, response_json_schema: DOC_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: specPrompt, response_json_schema: DOC_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: legalPrompt, response_json_schema: DOC_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: auditPrompt, response_json_schema: AUDIT_SCHEMA })
    ]);

    return Response.json({ prd, spec, legal, irs: audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}