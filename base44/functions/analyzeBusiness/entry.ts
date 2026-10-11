import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const RESEARCH_SCHEMA = {
  type: "object",
  properties: {
    company_name: { type: "string" },
    industry: { type: "string" },
    value_proposition: { type: "string" },
    market_analysis: { type: "string" },
    strategic_edge: { type: "string" },
    company_radar: {
      type: "object",
      properties: {
        scores: {
          type: "array",
          items: {
            type: "object",
            properties: {
              dimension: { type: "string" },
              score: { type: "number" }
            },
            required: ["dimension", "score"]
          }
        }
      },
      required: ["scores"]
    },
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          strengths: { type: "string" },
          weaknesses: { type: "string" },
          our_advantage: { type: "string" },
          overall_score: { type: "number" },
          radar_scores: {
            type: "array",
            items: {
              type: "object",
              properties: {
                dimension: { type: "string" },
                score: { type: "number" }
              },
              required: ["dimension", "score"]
            }
          }
        },
        required: ["name", "overall_score", "radar_scores"]
      }
    },
    funding_sources: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          type: { type: "string" },
          focus_area: { type: "string" },
          alignment_rationale: { type: "string" },
          stage: { type: "string" },
          contact_info: { type: "string" }
        },
        required: ["name"]
      }
    }
  },
  required: ["company_name", "industry", "value_proposition", "market_analysis", "strategic_edge", "competitors", "company_radar", "funding_sources"]
};

const SYNTHESIS_SCHEMA = {
  type: "object",
  properties: {
    executive_summary: { type: "string" },
    financial_forecast: { type: "string" },
    forecast_years: {
      type: "array",
      items: {
        type: "object",
        properties: {
          year: { type: "number" },
          revenue: { type: "number" },
          expenses: { type: "number" },
          ebitda: { type: "number" },
          growth_rate: { type: "number" }
        }
      }
    },
    investor_narrative: { type: "string" },
    key_milestones: { type: "array", items: { type: "string" } }
  },
  required: ["executive_summary", "financial_forecast", "forecast_years", "investor_narrative", "key_milestones"]
};

export default async function(req: Request): Promise<Response> {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const input = (body?.url || '').trim();
    const companyName = (body?.companyName || '').trim();
    if (!input) return Response.json({ error: 'A company URL or business idea is required.' }, { status: 400 });
    const isIdea = !/^https?:\/\//i.test(input);

    // --- Stage 1: Intelligence Extraction + Capital Mapping (web-enabled) ---
    const researchPrompt = `You are a senior investment analyst and market researcher.${isIdea
      ? ` The user has submitted a RAW BUSINESS IDEA, not an existing company. First distill it into a well-defined venture: give it a company_name, define the core product and target customer. Then proceed with the full analysis below.`
      : ' A user has submitted a target company for analysis.'}
${isIdea ? `BUSINESS IDEA: ${input}` : `URL: ${input}`}${companyName ? `\nProvided company name: ${companyName}` : ''}

Using live web context, perform a rigorous, TRUTHFUL analysis. Do not invent facts; where information is unavailable, say so plainly rather than fabricating.

Produce all of the following:
1. company_name — the verified company name.
2. industry — the precise industry/sector and sub-sector.
3. value_proposition — the real, differentiated value the company offers, distilled to 2-3 sharp sentences. Identify the gap between what the company says it does and what the market actually needs.
4. market_analysis — market size, growth trajectory, key trends and tailwinds, and the macro forces working in this company's favor. Cite real signals where possible.
5. strategic_edge — the specific, defensible advantage this company holds (or could hold) over incumbents. Be concrete, not generic.
6. competitors — 3 to 5 REAL competitors. For each: name, strengths, weaknesses, our_advantage (how the target company beats or bypasses them), overall_score (0 to 10 overall competitiveness), and radar_scores (a 0 to 10 score for EACH of these five dimensions, named verbatim: Market Reach, Product Differentiation, Traction, Team Strength, Pricing Power).
7. company_radar — the target company scored 0 to 10 on the SAME five dimensions (Market Reach, Product Differentiation, Traction, Team Strength, Pricing Power). Score truthfully against the real competitors you identified; do not inflate.
8. funding_sources — 4 to 6 REAL funding sources whose investment thesis aligns with this business (grants, venture firms, angel groups, or loan programs). For each: name, type (one of: grant, vc, angel, loan), focus_area, alignment_rationale (why this is a fit), stage (the stage they invest at), and contact_info (website or application portal — if unknown, write "verify").

Ground everything in real data. Quality and specificity over quantity.`;

    const research = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: isIdea
        ? `${researchPrompt}\nNote: the target is a raw idea with no existing web presence, so web context is not used here. Ground market sizing, competitor scores, and funding sources in industry-standard benchmarks, and label every modeled figure as an analyst estimate with its assumption stated.`
        : researchPrompt,
      add_context_from_internet: !isIdea,
      model: isIdea ? 'automatic' : "gemini_3_8_flash",
      response_json_schema: RESEARCH_SCHEMA
    });

    // --- Stage 2: Financial Engineering + Narrative Synthesis (with critique loop) ---
    const synthesisPrompt = `You are a master investment-memo writer. Below is structured research on a company. Synthesize it into a high-conviction, INVESTOR-READY dossier that is compelling AND truthful. Do not exaggerate or fabricate; persuasion comes from specificity and grounded reasoning, not hyperbole.

RESEARCH:
${JSON.stringify(research)}

Produce all of the following:
1. executive_summary — a high-impact opening (3-4 paragraphs) that frames the opportunity with authority: the company, the wedge, the market, and why now. Make the investor feel the scale of the opportunity through concrete evidence, not adjectives.
2. financial_forecast — a 3 to 5 year forecast grounded in industry benchmarks and stated assumptions. Explain the revenue model, unit-economics assumptions, growth drivers, and the path to margin. State every major assumption explicitly so the numbers are credible, not magical.
3. forecast_years — one object per forecast year: year (integer), revenue, expenses, ebitda, growth_rate (percentage as a number, e.g. 45 for 45%). Numbers must be internally consistent and traceable to the assumptions above.
4. investor_narrative — the core narrative (4-6 paragraphs) that makes the opportunity feel inevitable through evidence: market timing, competitive position, and execution path. Honest, vivid, specific.
5. key_milestones — 4 to 6 concrete milestones (12-36 month horizon) that prove execution traction.

CRITIQUE LOOP (mandatory): Before finalizing, review each section for generic filler, vague adjectives, and templated AI phrasing ("revolutionary", "game-changing", "synergy", "disruptive", etc.). Rewrite any sentence that is not specific and grounded. The output must read like it was written by a top-tier analyst, never a template.`;

    const synthesis = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: synthesisPrompt,
      model: "claude-sonnet-5",
      response_json_schema: SYNTHESIS_SCHEMA
    });

    return Response.json({ ...research, ...synthesis });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}