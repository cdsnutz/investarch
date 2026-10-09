import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const RADAR_SCHEMA = {
  type: "object",
  properties: {
    dimensions: {
      type: "array",
      items: { type: "string" }
    },
    competitors: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
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
    company_scores: {
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
  required: ["dimensions", "competitors", "company_scores"]
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

    const competitors = await base44.entities.Competitor.filter({ project_id: projectId }, { limit: 20 });
    if (competitors.items.length === 0) {
      return Response.json({ error: 'This dossier has no competitors to score.' }, { status: 400 });
    }

    const dossier = {
      company_name: project.company_name,
      industry: project.industry,
      url: project.url,
      value_proposition: project.value_proposition,
      market_analysis: project.market_analysis,
      strategic_edge: project.strategic_edge,
      competitors: competitors.items.map(c => ({
        name: c.name,
        strengths: c.strengths,
        weaknesses: c.weaknesses,
        our_advantage: c.our_advantage
      }))
    };

    const prompt = `You are a competitive-intelligence analyst. Below is an investment dossier on a company and its named competitors. Score the competitive landscape on EXACTLY these five dimensions, named verbatim and in order: "Market Reach", "Product Differentiation", "Traction", "Team Strength", "Pricing Power".

For EVERY competitor and for the target company, assign a 0 to 10 score on each dimension. Also give each competitor an overall_score (0 to 10). Ground every score in the dossier and general market reality: an established incumbent with broad reach scores high on Market Reach; an early-stage company does not. Score the target company truthfully, not generously.

Output:
- dimensions: the five dimension names, in order.
- competitors: one entry per competitor, with name copied EXACTLY as given, overall_score, and radar_scores (one entry per dimension).
- company_scores: the target company's radar_scores (one entry per dimension).
Never use em dashes in any copy.

DOSSIER:
${JSON.stringify(dossier)}`;

    const result = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt,
      response_json_schema: RADAR_SCHEMA
    });

    const dims = (result.dimensions || []).length === 5
      ? result.dimensions
      : ['Market Reach', 'Product Differentiation', 'Traction', 'Team Strength', 'Pricing Power'];

    const byName = new Map(competitors.items.map(c => [String(c.name).trim().toLowerCase(), c]));
    const updates = [];
    for (const c of (result.competitors || [])) {
      const rec = byName.get(String(c.name).trim().toLowerCase());
      if (!rec) continue;
      updates.push({
        id: rec.id,
        overall_score: c.overall_score,
        radar_scores: c.radar_scores || []
      });
    }
    if (updates.length > 0) {
      await base44.entities.Competitor.bulkUpdate(updates);
    }

    await base44.entities.Project.update(projectId, {
      competitive_radar: {
        dimensions: dims,
        company_scores: result.company_scores || [],
        generated_date: new Date().toISOString()
      }
    });

    return Response.json({ ok: true, scored: updates.length });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}