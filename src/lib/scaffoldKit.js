// Files bundled into every IP scaffold: env template, antislop skills, devpro-deploy kit, agent roadmap.
const SKILLS = import.meta.glob('/skills/**/*', { query: '?raw', import: 'default', eager: true });

export function antislopFiles() {
  return Object.entries(SKILLS).map(([path, content]) => ({ path: `.agent${path}`, content }));
}

export function buildEnvExample(seed) {
  const extra = (seed.blueprint?.tech_stack || [])
    .filter((t) => /stripe|openai|anthropic|resend|twilio|s3|aws|supabase|redis|sendgrid|clerk|auth0/i.test(t))
    .map((t) => `# ${t}\n${t.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '')}_API_KEY=`)
    .join('\n\n');
  return `# ${seed.title}: copy to .env and fill every value. Never commit .env.

# Core
NODE_ENV=development
PORT=3000
APP_URL=http://localhost:3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/app

# Auth (32+ random bytes: openssl rand -hex 32)
AUTH_SECRET=

# Email
EMAIL_FROM=
EMAIL_API_KEY=

# devpro-deploy
DEPLOY_HOST=vercel            # vercel | render | fly
DEPLOY_TOKEN=
DEPLOY_PROJECT=
${extra ? `\n# Stack integrations\n${extra}\n` : ''}`;
}

const DEPLOY_SH = `#!/usr/bin/env bash
# devpro-deploy: verify, build and ship. Usage: ./devpro-deploy/deploy.sh [preview|production]
set -euo pipefail
TARGET="\${1:-preview}"
[ -f .env ] && set -a && . ./.env && set +a
: "\${DEPLOY_HOST:?Set DEPLOY_HOST in .env}"
: "\${DEPLOY_TOKEN:?Set DEPLOY_TOKEN in .env}"

echo "[1/5] Install";      npm ci
echo "[2/5] Lint";         npm run lint --if-present
echo "[3/5] Test";         npm test --if-present
echo "[4/5] Build";        npm run build
echo "[5/5] Deploy -> $DEPLOY_HOST ($TARGET)"
case "$DEPLOY_HOST" in
  vercel) npx --yes vercel deploy --token "$DEPLOY_TOKEN" $([ "$TARGET" = production ] && echo --prod) ;;
  render) curl -fsS -X POST "https://api.render.com/v1/services/$DEPLOY_PROJECT/deploys" -H "Authorization: Bearer $DEPLOY_TOKEN" ;;
  fly)    FLY_API_TOKEN="$DEPLOY_TOKEN" npx --yes @flydotio/flyctl deploy --app "$DEPLOY_PROJECT" ;;
  *) echo "Unsupported DEPLOY_HOST: $DEPLOY_HOST"; exit 1 ;;
esac
[ -n "\${APP_URL:-}" ] && curl -fsS "$APP_URL/health" >/dev/null && echo "Health check passed"
`;

const CI_YML = `name: ci
on: { pull_request: {}, push: { branches: [main] } }
jobs:
  verify-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }
      - run: chmod +x devpro-deploy/deploy.sh
      - run: ./devpro-deploy/deploy.sh \${{ github.ref == 'refs/heads/main' && 'production' || 'preview' }}
        env:
          DEPLOY_HOST: \${{ secrets.DEPLOY_HOST }}
          DEPLOY_TOKEN: \${{ secrets.DEPLOY_TOKEN }}
          DEPLOY_PROJECT: \${{ secrets.DEPLOY_PROJECT }}
          APP_URL: \${{ secrets.APP_URL }}
`;

export function devproDeployFiles() {
  return [
    { path: 'devpro-deploy/deploy.sh', content: DEPLOY_SH },
    { path: '.github/workflows/devpro-deploy.yml', content: CI_YML },
    { path: 'devpro-deploy/README.md', content: '# devpro-deploy\n\nOne-command verify, build and deploy.\n\n```bash\nchmod +x devpro-deploy/deploy.sh\n./devpro-deploy/deploy.sh preview\n./devpro-deploy/deploy.sh production\n```\n\nConfigure `DEPLOY_HOST`, `DEPLOY_TOKEN`, `DEPLOY_PROJECT` in `.env` locally and as repository secrets for CI. Supported hosts: vercel, render, fly.\n' }
  ];
}

export function buildRoadmap(seed) {
  return `# ${seed.title}: Agent Roadmap

Execute phases in order. Do not start a phase until every exit check of the previous one passes. Record progress by ticking boxes in this file.

## Phase 0: Orientation
- [ ] Read AGENTS.md, DEPLOYMENT.md and this file in full.
- [ ] Load every skill in \`.agent/skills/\`. Apply antislop-code to all code, antislop-ui and antislop-layoutmobile to all screens, antislop-copywriting to all user-facing text.
- [ ] Copy \`.env.example\` to \`.env\` and fill values.
Exit: \`npm install\` succeeds.

## Phase 1: Foundation
- [ ] Project structure, lint, formatter and test runner configured.
- [ ] Add \`npm\` scripts: dev, build, start, test, lint, db:migrate.
- [ ] \`GET /health\` returns 200.
Exit: \`npm run lint && npm test && npm run build\` pass.

## Phase 2: Data and Auth
- [ ] Implement every entity in AGENTS.md section 5 with migrations.
- [ ] Sign up, sign in, sign out, password reset.
- [ ] Every query scoped to the record owner.
Exit: tests prove user A cannot read or modify user B's records.

## Phase 3: Core Logic
- [ ] Implement AGENTS.md section 6 as server-side services with unit tests.
- [ ] Validate all input at API boundaries.
Exit: core logic test coverage at or above 80%.

## Phase 4: Interface
- [ ] Every flow reachable from the UI, with loading, empty and error states.
- [ ] Responsive at 375px, 768px and 1280px.
- [ ] Run the antislop-ui and antislop-copywriting checklists; fix every finding.
Exit: manual walkthrough of the primary flow succeeds with no console errors.

## Phase 5: Integrations
- [ ] Wire each service in AGENTS.md section 7 behind an env-configured client.
- [ ] Failures surface a clear error and do not crash the app.
Exit: integration tests pass against sandbox credentials.

## Phase 6: Ship
- [ ] \`./devpro-deploy/deploy.sh preview\` succeeds.
- [ ] Complete DEPLOYMENT.md section 6 checks on the preview URL.
- [ ] \`./devpro-deploy/deploy.sh production\`.
Exit: production health check returns 200 and the primary flow works end to end.

## Failure Protocol
On any failed check: read the full error, fix the root cause, re-run the check. Never skip, disable or mock a failing test to pass a phase.
`;
}