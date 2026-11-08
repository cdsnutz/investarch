export const DEFAULT_APP_ORIGIN = 'https://invest-arch-core.base44.app';

export function buildAgentDeployGuide({ agentName, seedTitle, repoName, parentAgent }) {
  const name = agentName || 'this agent';
  const repo = repoName || 'the exported repository';
  return `# Deploy orders: ${name}

Read this before touching code. It is the deployment contract for ${seedTitle ? `the asset "${seedTitle}"` : 'this build'}.

## 1. Take the pack
Unzip the dossier pack. Work inside \`Codebase/\`. Nothing is a stub: the server, database migrations, seed data, client, tests and hand-off documents are all present, so your job is to run and place it, not to invent it.

## 2. Prove it before you change it
\`\`\`
cd Codebase
npm ci
npm run migrate
./verify.sh
\`\`\`
If \`verify.sh\` fails on the delivered code, that failure is the first and only defect to fix.

## 3. Deploy
${repo} ships as an Express API plus a React client against Postgres. Set DATABASE_URL and SESSION_SECRET from \`.env.template\`, run the migrations, build the client, then serve the API behind TLS with the built client on the same origin. Record the live URL in the registry note.

## 4. Register yourself in the IP Factory
Every deployed agent is tracked. Post yourself once, then after each deploy run.
\`\`\`
POST ${DEFAULT_APP_ORIGIN}/functions/agentOps
x-agent-key: <the workspace agent key>
{ "action": "register", "agentName": "${name}", "kind": "external_agent"${parentAgent ? `, "parentAgent": "${parentAgent}"` : ''} }
\`\`\`

## 5. Report every run
\`\`\`
{ "action": "record_run", "agentId": "<id from the register response>", "outcome": "success", "note": "deployed to production, verify.sh green" }
\`\`\`
Outcome is \`success\` or \`failure\`. The IP Factory reads these records as the agent's performance, so report failures truthfully rather than retrying silently.

## 6. Deploy your own agents
You may spawn specialist agents. Register each one with your own name as \`parentAgent\`, so the registry shows who deployed whom:
\`\`\`
{ "action": "register", "agentName": "schema-migrator", "kind": "external_agent", "parentAgent": "${name}" }
\`\`\`
Give each child this same contract. A child reports its own runs; you never report on its behalf.
`;
}