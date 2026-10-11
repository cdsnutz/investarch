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

const VALUATION_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    multiple: { type: "number" },
    dcf_low: { type: "number" },
    dcf_high: { type: "number" },
    cca_low: { type: "number" },
    cca_high: { type: "number" },
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
  required: ["title", "multiple", "dcf_low", "dcf_high", "cca_low", "cca_high", "sections"]
};

const MOAT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    moat_score: { type: "number" },
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
  required: ["title", "moat_score", "sections"]
};

const EXIT_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    acquirers: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          synergy: { type: "string" }
        },
        required: ["name", "synergy"]
      }
    },
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
  required: ["title", "acquirers", "sections"]
};

const CREDIT_SCHEMA = {
  type: "object",
  properties: {
    loan_request: { type: "number" },
    dscr: { type: "number" },
    collateral_basis: { type: "string" },
    calculation_sections: {
      type: "array",
      items: {
        type: "object",
        properties: {
          heading: { type: "string" },
          body: { type: "string" }
        },
        required: ["heading", "body"]
      }
    },
    application_sections: {
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
  required: ["loan_request", "dscr", "collateral_basis", "calculation_sections", "application_sections"]
};

const DAYDREAM_SCHEMA = {
  type: "object",
  properties: {
    ideas: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          thesis: { type: "string" },
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
        required: ["name", "thesis", "sections"]
      }
    }
  },
  required: ["ideas"]
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
    },
    growth_blueprint: {
      type: "array",
      items: {
        type: "object",
        properties: {
          lever: { type: "string" },
          title: { type: "string" },
          action: { type: "string" }
        },
        required: ["lever", "title", "action"]
      }
    }
  },
  required: ["total", "dimensions", "enhancements", "growth_blueprint"]
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

    const rules = `\nDOSSIER:\n${JSON.stringify(dossier)}\nRules: ground every claim in the dossier; where data is missing, state the assumption explicitly instead of inventing facts. Never present a modeled number as verified; label every modeled figure with its assumption. Plain text only, no markdown syntax unless the output is code. No em dashes. No filler adjectives. Every sentence must carry information.`;

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

    const legalPrompt = `You are a legal drafting architect (LEGAL COUNCIL POD) trained on institutional drafting conventions drawn from Black's Law Dictionary. Convert the dossier into a Corporate Governance Framework document that replaces entrepreneurial language with high-authority legal terminology, presenting the entity as a professionally governed enterprise.

Substitution directives (apply consistently): owner becomes proprietor or title-holder; agreement becomes covenant or indenture; contract becomes instrument; partner becomes co-venturer; investor becomes capital contributor; business becomes enterprise or entity; plan becomes protocol; where supported by the dossier, intellectual property becomes proprietary intellectual property easements and assets are described as collateralized. Weave in fiduciary stewardship, indemnification, and estoppel language where contextually defensible.

Produce exactly 5 sections, in this order:
1. Position of the Entity and Fiduciary Stewardship
2. Proprietary Rights and Intellectual Property
3. Risk-Mitigation Posture and Indemnification
4. Material Covenants and Obligations
5. Compliance and Governance
Each section 1 to 3 dense paragraphs. Where the dossier does not establish a fact (entity type, registrations, patents, filings), phrase it as a recommendation or state the assumption explicitly; never assert an invented legal fact. The final section's body must end with this exact sentence: "This framework is institutional drafting language; it is not a substitute for advice from qualified counsel."
${rules}`;

    const valuationPrompt = `You are a senior M&A valuation analyst (VALUATION POD). Build an Enterprise Value Appraisal for the company: the mathematical case for a premium, forward-looking valuation anchored to projected market dominance rather than current revenue.

Run both methods and output numeric ranges in USD:
- Simulated Discounted Cash Flow: project 5 years from the dossier's forecast and financial model (state every growth and margin assumption), apply a terminal value, and discount at a stated rate appropriate to the industry and stage. Output dcf_low and dcf_high.
- Comparable Company Analysis: use multiples standard for this industry and stage (name the typical multiple ranges you apply as stated assumptions). Output cca_low and cca_high.
- Output multiple: the headline valuation multiple (for example EV/Revenue or EV/EBITDA, such as 12 for a 12x) the Future-State framing rests on, with the reasoning for that multiple in the first section.

Produce 6 to 8 sections, in this order: Methodology and Assumption Register; Discounted Cash Flow Analysis; Comparable Company Analysis; Future-State Valuation (value anchored to projected market position and dominance trajectory); Value Drivers (the levers that move the multiple); Valuation Risks and Sensitivities (what shrinks the number and by how much).
Every modeled figure must be labeled as modeled with its assumptions. Do not present ranges as verified market data.
${rules}`;

    const moatPrompt = `You are a competitive strategy architect (MOAT POD). Build the Moat and Defensibility Report: the case that this company's position compounds while competitors cannot replicate it.

Output moat_score: 0 to 10, scored truthfully on the dossier's evidence of defensibility.

Produce 6 to 8 sections, in this order:
1. Moat Overview and Rating (the moat_score and what earns it)
2. Network Effects (where each new user makes the product more valuable; if not yet present, state the mechanism to construct it)
3. High Switching Costs (what it costs a customer to leave, in time, money, and data)
4. Proprietary Data Loops (what data the business uniquely accumulates and how it compounds the product)
5. Cost and Brand Advantages
6. Defensibility Timeline (how the moat deepens over 1, 3, and 5 years)
7. Why Competitors Cannot Close the Gap (grounded in the dossier's competitor analysis)
Distinguish clearly between moats that exist today and moats the plan constructs; never claim an unearned moat as current fact.
${rules}`;

    const exitPrompt = `You are an M&A exit strategist (EXIT POD). Build the Strategic Exit Roadmap: the liquidity path that answers an investor's question "how do I get my money back, and how does it grow?"

Output acquirers: 4 to 6 named real companies that are plausible strategic acquirers for this business given its industry, product, and data position. For each, synergy: one specific sentence on why acquiring this entity advances that company's strategy (product gap closed, data acquired, market entered, threat neutralized). Frame these as strategic rationale, not as commitments from those companies.

Produce 6 to 8 sections, in this order:
1. Exit Thesis (why this asset exits at a premium)
2. Strategic Acquirer Map (the acquirers and their acquisition logic)
3. Synergy Narratives (the two or three strongest acquisition cases told in detail)
4. Path to Premium (the milestones over 3 to 5 years that raise the exit price: revenue, moat depth, IP position)
5. Alternative Exit Paths (IPO, secondary sale, recapitalization, and what each requires)
6. Exit Timeline (a 3 to 5 year schedule from now to liquidity)
Every synergy and milestone must be grounded in the dossier; assumptions stated explicitly.
${rules}`;

    const creditPrompt = `You are a commercial credit architect (CREDIT-SENTY POD). Engineer the maximum justifiable loan request from projected cash flow and asset-based lending, not personal credit history. Commercial underwriting keys on Debt Service Coverage Ratio (DSCR) and collateral, not FICO.

Compute from the dossier's forecast, stating every assumption (rate, amortization term, margin):
- Annual debt service at a stated commercial rate and amortization.
- DSCR per projected year: net operating income (EBITDA) divided by annual debt service. Output dscr as the tightest coverage across the forecast window.
- loan_request: the maximum principal in USD such that the tightest-year DSCR stays at or above 1.25. Justify the math in the first calculation section.
- collateral_basis: one dense paragraph framing the collateral: projected revenue, contractual receivables, and proprietary IP. Label modeled IP values as modeled and note explicitly that unregistered IP frames as value, not as a perfected security interest, until registered and pledged.

calculation_sections: 4 to 6 sections, in this order: Loan Request Summary; Debt Service and DSCR Calculation; Asset-Based Lending Analysis; Collateral Basis; Assumption Register.
application_sections: 4 to 6 sections written for commercial bank underwriters, formal and authoritative, using Black's Law terminology where defensible (covenant, instrument, indemnification, fiduciary stewardship), in this order: Position of the Applicant; Purpose of the Financing; Projected Cash Flow and Debt Service; Collateral and Security; Requested Terms and Covenants. Do not assert existing credit history, existing registrations, or perfected liens; state what the applicant commits to.
${rules}`;

    const daydreamPrompt = `You are a strategic innovation architect (DAYDREAM POD). Run recursive future-state generation: analyze the current business and produce exactly 3 adjacent, revolutionary IP ideas that expand its moat. These are the next logical monopolies in this space, built on the current business's own data, users, or workflows.

Each idea: name (a product-like name), thesis (2 sentences on the gap it closes), sections: 5 sections in this order: Market Gap; The Innovation; Monetization Strategy; Moat Expansion; 18-Month Roadmap. Each section 1 to 2 tight paragraphs. Ground every idea in the current business's assets and market; label speculative assumptions explicitly.
${rules}`;

    const auditPrompt = `You are a rigorous institutional readiness auditor (SCORING POD). Score the dossier's Investment Readiness (IRS) out of 100 using exactly four dimensions, 25 points each, in this order: Market Size (quality of the TAM/SAM/SOM analysis), Defensibility Moat, Scalability Vector (growth potential), Legal Hardness (compliance posture and IP protection).

Score truthfully, not generously: a dossier without quantified market sizing loses points on Market Size; an entity without registrations, IP protection, or compliance posture loses points on Legal Hardness. Each dimension gets note: one specific sentence naming what earned or lost points. Then produce 4 to 6 enhancements: surgical, concrete moves that raise the score, each with title and action describing exactly what to change and the expected score lift (for example, from 65 to 78).

Then produce a Growth Blueprint of 6 items, two per lever, each with title and action (a concrete change and the valuation effect):
- lever "LTV/CAC Optimization": how to lower acquisition cost and raise lifetime value.
- lever "Revenue Diversification": how to add recurring tiers or new revenue lines that raise the valuation multiple.
- lever "IP Fortressing": which assets to patent, trademark, or otherwise protect to raise Legal Hardness and enterprise value.
${rules}`;

    const [prd, legal, valuation, moat, exit] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: prdPrompt, response_json_schema: DOC_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: legalPrompt, response_json_schema: DOC_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: valuationPrompt, response_json_schema: VALUATION_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: moatPrompt, response_json_schema: MOAT_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: exitPrompt, response_json_schema: EXIT_SCHEMA })
    ]);

    const [spec, audit, credit, daydream] = await Promise.all([
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: specPrompt, response_json_schema: DOC_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: auditPrompt, response_json_schema: AUDIT_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: creditPrompt, response_json_schema: CREDIT_SCHEMA }),
      base44.asServiceRole.integrations.Core.InvokeLLM({ prompt: daydreamPrompt, response_json_schema: DAYDREAM_SCHEMA })
    ]);

    return Response.json({ prd, spec, legal, valuation, moat, exit, credit, daydream, irs: audit });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}