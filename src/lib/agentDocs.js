// Deterministic build documents for an AI coding agent, generated from the seed blueprint and scaffold.
const list = (arr) => (arr || []).map((x) => `- ${x}`).join('\n') || '- Not specified; choose a mainstream, well-documented stack.';

export function buildAgentReadme(seed, codebase) {
  const bp = seed.blueprint || {};
  const tree = (codebase?.files || []).map((f) => `- \`${f.path}\``).join('\n') || '- No scaffold files exported. Create the project from scratch using the stack below.';
  return `# ${seed.title}: Build Brief for an AI Coding Agent

Read this file in full before writing code. It is the single source of truth for scope. Build the complete, working application described here on top of the scaffold in \`Codebase/\`. Do not stop at stubs.

## 1. Problem
${seed.gap || ''}
${seed.pain_signal ? `\nObserved pain signal: ${seed.pain_signal}` : ''}

## 2. Solution
${seed.solution || ''}

## 3. Execution Plan
${seed.mini_plan || 'Derive milestones from sections 2 and 5.'}

## 4. Tech Stack
${list(bp.tech_stack)}

## 5. Data Model
\`\`\`
${bp.db_schema || 'Derive entities from the core logic below. Every table needs id, created_at, updated_at and an owner reference.'}
\`\`\`

## 6. Core Logic
${bp.core_logic || 'Implement the solution in section 2 as the primary user flow.'}
${seed.ecosystem_interlocks ? `\n## 7. Integrations\n${seed.ecosystem_interlocks}\n` : ''}
## Scaffold Contents
${tree}

## Agent Operating Rules
1. Inspect every scaffold file first. Extend it; do not rewrite working parts without cause.
2. Implement every entity in section 5 with create, read, update and delete paths, plus input validation at API boundaries.
3. Implement authentication and owner-scoped data access before any feature screen.
4. Build every flow end to end: UI, API, persistence, loading, empty and error states.
5. Keep secrets in environment variables. Commit a \`.env.example\` listing every key with a one-line purpose.
6. Write tests for the core logic in section 6. All tests must pass before deployment.
7. Follow \`DEPLOYMENT.md\` to ship. Update this file if scope changes.

## Definition of Done
- The app installs with one command and starts with one command.
- Every feature in sections 2 and 6 is reachable from the UI and persists data.
- Lint, type checks and tests pass.
- The app is deployed per \`DEPLOYMENT.md\` and the health check returns 200.
`;
}

export function buildDeploymentGuide(seed) {
  const stack = (seed.blueprint?.tech_stack || []).join(', ') || 'the stack named in AGENTS.md';
  return `# ${seed.title}: Deployment Guide

Target stack: ${stack}.

## 1. Prerequisites
- Node.js 20 LTS or the runtime required by the stack
- Git, and an account on the chosen host (Vercel, Render, Fly.io or Railway)
- A managed Postgres instance (Neon, Supabase or the host's own) unless the stack specifies otherwise

## 2. Environment
1. Copy \`.env.example\` to \`.env\`.
2. Set \`DATABASE_URL\`, \`AUTH_SECRET\` (32+ random bytes) and \`APP_URL\`.
3. Set every third-party key named in AGENTS.md section 7.
4. Mirror the same variables in the host's environment settings. Never commit \`.env\`.

## 3. Local Verification
\`\`\`bash
npm install
npm run db:migrate   # or the stack's migration command
npm test
npm run build
npm start
\`\`\`
Confirm \`GET /health\` returns 200 before deploying.

## 4. Production Deploy
1. Push the repository to GitHub.
2. Connect the repository to the host and select the production branch.
3. Build command: \`npm run build\`. Start command: \`npm start\`.
4. Run migrations against the production database as a release step.
5. Attach the custom domain and enforce HTTPS.

## 5. CI
Add a pipeline that runs install, lint, test and build on every pull request, and deploys on merge to the production branch.

## 6. Post-Deploy Checks
- Health check returns 200.
- Sign up, sign in and complete the primary flow from AGENTS.md section 6.
- Error logging and uptime monitoring are active.
- Database backups are scheduled daily.

## 7. Rollback
Redeploy the previous successful build from the host dashboard. Reverse the latest migration only if it is backward-incompatible.
`;
}