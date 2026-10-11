import { createClientFromRequest } from 'npm:@base44/sdk@0.8.52';

const CODEBASE_SCHEMA = {
  type: "object",
  properties: {
    repo_name: { type: "string" },
    files: {
      type: "array",
      items: {
        type: "object",
        properties: {
          path: { type: "string" },
          content: { type: "string" }
        },
        required: ["path", "content"]
      }
    },
    user_manual: { type: "string" },
    onboarding_guide: { type: "string" }
  },
  required: ["repo_name", "files", "user_manual", "onboarding_guide"]
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

    const brief = {
      company_name: project.company_name,
      industry: project.industry,
      value_proposition: project.value_proposition,
      strategic_edge: project.strategic_edge,
      financial_forecast: project.financial_forecast,
      key_milestones: project.key_milestones
    };

    const codebasePrompt = `You are a staff full-stack engineer (BUILD POD). Below is a business brief. Generate a complete monorepo codebase for this business's core product: a working directory structure, not snippets.

Output files: 8 to 12 files covering:
- README.md (what this is, how to run it)
- Root configuration: package.json (with real dependencies), docker-compose.yml, .env.template
- frontend/: React application shell (App.jsx, main entry, one or two core pages or components, API client)
- backend/: API server (Node with Express, or Python with FastAPI), main entrypoint, routes for the core operations, one or two core service modules
- database/: schema file(s) implementing the main data entities
Every file must be complete and internally consistent: imports match real paths, endpoints match routes, schema matches models. No placeholders, no TODO, no lorem, no stub functions. Keep each file focused and under 100 lines.
Also produce:
- user_manual: a plain-text end-user manual describing how the product operates, page by page (maximum 700 words).
- onboarding_guide: a plain-text developer onboarding guide: clone, environment setup, run locally, deploy, and where each module lives (maximum 500 words).
No em dashes. No filler comments in code.

BUSINESS BRIEF:
${JSON.stringify(brief)}`;

    const codebase = await base44.asServiceRole.integrations.Core.InvokeLLM({
      prompt: codebasePrompt,
      response_json_schema: CODEBASE_SCHEMA
    });

    return Response.json(codebase);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}