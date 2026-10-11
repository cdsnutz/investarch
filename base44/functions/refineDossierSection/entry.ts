import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const SECTIONS = [
  'executive_summary',
  'value_proposition',
  'market_analysis',
  'strategic_edge',
  'financial_forecast',
  'investor_narrative'
];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const projectId = body.projectId;
    const section = body.section;
    const guidance = String(body.guidance || '').slice(0, 2000);
    if (!projectId || !SECTIONS.includes(section)) {
      return Response.json({ error: 'Invalid project or section' }, { status: 400 });
    }

    const project = await base44.entities.Project.get(projectId);
    if (!project) return Response.json({ error: 'Dossier not found' }, { status: 404 });

    const current = project[section] || '';
    const llm = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: `You are an institutional-grade investment analyst refining one section of an investment dossier for "${project.company_name || project.url}".

Section to rewrite: "${section}".
Current section content:
${current}

Dossier context (use for consistency, do not pad):
- Value proposition: ${project.value_proposition || 'n/a'}
- Market analysis: ${(project.market_analysis || 'n/a').slice(0, 800)}
- Strategic edge: ${(project.strategic_edge || 'n/a').slice(0, 800)}
- Financial forecast: ${(project.financial_forecast || 'n/a').slice(0, 800)}
- Industry: ${project.industry || 'n/a'}

Framing directive from the analyst: ${guidance || 'Preserve the substance; tighten the language and strengthen the psychological framing toward institutional investors.'}

Rewrite ONLY the "${section}" section. Be objective, data-grounded and specific. Never invent numbers, metrics or facts that are not in the context. No hype words, no filler, no meta commentary. 120-250 words of clean prose.`,
      response_json_schema: {
        type: 'object',
        properties: { text: { type: 'string' } },
        required: ['text']
      }
    });

    const text = llm && llm.text;
    if (!text) return Response.json({ error: 'Generation failed' }, { status: 500 });

    await base44.entities.Project.update(projectId, { [section]: text });
    return Response.json({ text });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}