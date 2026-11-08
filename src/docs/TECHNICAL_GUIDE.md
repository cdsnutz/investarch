# InvestArch — Technical Guide

Version 1.0 · 8 November 2026 · Maintained by the Registrar.

Architecture, data model, function contracts, generation and verification gates, security posture and open items. Read alongside `FILE_MANIFEST.md`, which enumerates every file, and `USER_GUIDE.md`, which covers behaviour.

---

## 1. Stack and runtime

| Layer | Choice |
| --- | --- |
| Frontend | React 18, Vite, Tailwind with token classes, shadcn/ui primitives, React Router 7, TanStack Query, recharts, framer-motion |
| Backend | Base44 entities (schema in `base44/entities/*.jsonc`), Deno backend functions (`base44/functions/*/entry.ts`), workflows (`base44/workflows/*.jsonc`) |
| Data | Base44 entity store with row-level security per entity; Postgres exists only inside exported codebases |
| Payments | Base44 Payments: `create-checkout` and `payments-webhook` |
| PDF and ZIP | `jspdf` for documents, `jszip` for packs, both client-side |
| Auth | Platform-owned: email and password, Google, optional second factor |

There is no build step for functions; they deploy from source. The frontend is a standard Vite app.

## 2. Request lifecycle and the two-minute rule

A single function invocation is capped at roughly 120 seconds. Every expensive pipeline is therefore split into atomic, individually retryable functions rather than one long call:

- Analysis: `analyzeBusiness` writes sections and forecast; `buildPlanPoints` scores points; `runValueScan` scores each point; `scoreCompetition` builds the radar; `draftFundingLetters` drafts outreach.
- Seeds: `runIpHunt` yields records; `ipWealthStrategy` assigns strategies; `architectSeed` writes the blueprint; `draftIpFiling` writes one instrument per call; `draftCapitalPack` writes grants and the loan proposal; `liquidateIp` writes the prospectus.
- Packs are assembled client-side from those records, so the ZIP is not a server operation at all.

Consequence for maintainers: never reintroduce a combined pipeline. Earlier revisions hit the timeout exactly once, with `buildPlanAndScan`, and it is recorded as a dead end.

## 3. Source map

| Path | Responsibility | Rule |
| --- | --- | --- |
| `src/pages/` | One file per route, default export named after the file. | Pages orchestrate; they do not hold generation logic. |
| `src/components/<area>/` | Screen sections grouped by surface. | Keep components small; prefer a new file to growth. |
| `src/components/ui/` | shadcn primitives. | Vendored, not hand-edited. |
| `src/lib/` | Pure logic: scoring, packs, exports, graph, cost. | No React, no JSX. |
| `src/lib/kit/` | The codebase generator. | The single source of truth for generated apps. |
| `base44/entities/` | Schemas and row-level rules. | Full schema on every write; never a partial patch. |
| `base44/functions/` | Atomic server operations. | Authenticate, validate, write, return a small payload. |
| `base44/shared/` | Logic used by more than one function. | Extract rather than copy. |
| `src/docs/` | Documentation and the manifest verifier. | Regenerate with the verifier before shipping. |

Auth pages (`Login`, `Register`, `ForgotPassword`, `ResetPassword`, `Mfa`) and the MFA components are platform boilerplate: they carry the full flow (register, code verification, mandatory second step) and are edited only on explicit request.

## 4. Routing

Seven public routes: `/login`, `/register`, `/forgot-password`, `/reset-password`, `/mfa`, `/ThankYou`, `/oauth/consent`. Everything else is nested inside `ProtectedRoute` and the `Layout` shell, so an anonymous visitor is redirected to `/login` with the requested path preserved. Unknown paths fall to `PageNotFound`, which emits a real 404 status.

Thirty protected routes: `/`, `/new`, `/command-center`, `/connect`, `/projects/:id`, `/ip-factory`, `/simulator`, `/strategy-vault`, `/asset-management`, `/signal-monitoring`, `/account-settings`, `/synthesis-logs`, `/market-intel`, `/prospectus-manager`, `/execution-orders`, `/persona-manager`, `/investor-matchmaker`, `/synthesis-archive`, `/strategy-blueprint`, `/compliance-audit`, `/entity-nexus`, `/dossier-workshop`, `/simulation-archive`, `/intellectual-assets`, `/investor-pipeline`, `/synthesis-metrics`, `/capital-readiness`, `/market-resonance`, `/disruption-log`, `/execution-timeline`.

`/ThankYou` must stay public: the buyer returning from a payment page is frequently anonymous, and gating it strands a paid customer.

## 5. Data model

Forty-five entities. Every entity carries `id`, `created_date`, `updated_date` and `created_by_id` implicitly.

### 5.1 Dossier domain

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `Project` | The dossier. | `url`, `company_name`, `status` (captured, analyzing, complete, ready_for_review, failed), sections, `forecast_years`, `plan_points`, `value_scan`, `competitive_radar`, `scan_score` |
| `Competitor` | Competitor per project. | `strengths`, `weaknesses`, `our_advantage`, `radar_scores` |
| `FundingSource` | Matched funder. | `type` (grant, vc, angel, loan), `application_draft`, `outreach_status` |
| `TimelineMilestone` | Dated milestone. | `month`, `status` |
| `MarketSeed` | Captured market seed awaiting promotion. | `title`, `vector`, `thesis`, `signal_score`, `status` |

### 5.2 IP domain

| Entity | Purpose | Key fields |
| --- | --- | --- |
| `IpSeed` | The seed ledger. | `title`, `gap`, `pain_signal`, `solution`, `asymmetric_score`, `blueprint`, `strategy` (hold, flip, build), `status` (seed, built), `yield_date` |
| `IpFiling` | One instrument. | `filing_type` (patent, trademark, deed, copyright), `status`, instrument text fields |
| `IpProspectus` | Liquidation prospectus. | `targets[]`, `prospectus`, `offer_type`, `offer_terms` |
| `AgentDeployment` | Agent registry row. | `agent_name`, `kind`, `parent_agent`, `seed_id`, `status`, `runs`, `success_rate` |
| `Deployment` | Deployment records for generated codebases. | seed linkage, target |
| `DisruptionPlan` | War-room plan. | target competitor, kill feature, obsolescence path |
| `GhostValidation` | Synthetic validation angles. | copy per angle |
| `InfringementAlert` | Governance finding. | severity, evidence, cease-and-desist text |

### 5.3 Capital and simulation domain

`LedgerEntry`, `TreasurySnapshot`, `ReinvestmentDecision`, `ExecutionOrder`, `HegemonySnapshot`, `LogicGate`, `GateVerdict`, `LogicConstant`, `ValueAxiom`, `ValueAnchor`, `SimulationRun`, `EpochSnapshot`, `SimulatorAccess`, `Base44Purchase`.

### 5.4 Signal, narrative and market domain

`LiveSignal`, `MarketVector`, `NarrativeVector`, `ArchetypeImprint`, `SyntheticPersona`, `RegulatoryLever`, `TalentAlignment`, `Alliance`, `SynergyTrigger`, `Heuristic`, `EvolutionLog`.

### 5.5 Structural assets

`PhysicalAsset`, `HybridAsset`, `InfrastructureLayer`, `CelestialClaim`, `ActivityEvent`, `BrandKit`, `User`.

### 5.6 Row-level security

Every entity declares explicit `read`, `create`, `update` and `delete` rules. The house pattern is owner-or-admin:

```
read:   { $or: [ { created_by_id: "{{user.id}}" }, { user_condition: { role: "admin" } } ] }
create: { created_by_id: "{{user.id}}" }
update: { $or: [ { created_by_id: "{{user.id}}" }, { user_condition: { role: "admin" } } ] }
delete: same as update
```

Two deliberate deviations:

- `AgentDeployment` reads allow both `admin` and `user`, because the registry is a shared operating surface.
- `SimulatorAccess` reads on `data.app_user_id` and restricts update and delete to admins, so an entitlement cannot be granted from the client.

`ActivityEvent` is append-only for users: create only, update and delete admin-only.

Rules govern the SDK path, not intent. A function running as service role bypasses them, so every server function that writes must scope its own ownership check.

## 6. Function catalog

Every function authenticates with the caller's session unless noted. `writes` names the records it produces.

| Function | Input | Writes |
| --- | --- | --- |
| `analyzeBusiness` | `url`, `companyName`, `intensity` | `Project` (sections, forecast, milestones), `Competitor`, `FundingSource` |
| `buildPlanPoints` | `projectId` | `Project.plan_points` |
| `runValueScan` | `projectId` | `Project.value_scan` |
| `scoreCompetition` | `projectId` | `Project.competitive_radar`, `Competitor` |
| `draftFundingLetters` | `projectId` | `FundingSource` drafts and outreach |
| `refineDossierSection` | `projectId`, `section`, `guidance` | `Project` section |
| `markDossierReadyForReview` | `project_id` | `Project.status`, `ActivityEvent` |
| `generateReadinessPackage` | `projectId` | readiness package |
| `buildCodebase` | `projectId` | generated file set (returned, not stored) |
| `createMarketSeed` | `auth_key`, `title`, `thesis`, `vector`, `source`, `signal_score`, `status` | `MarketSeed`, `ActivityEvent` |
| `runIpHunt` | `preset` | `IpSeed[]` |
| `ipWealthStrategy` | none (portfolio-wide) | `IpSeed.strategy` |
| `architectSeed` | `seedId` | `IpSeed` blueprint, manual, interlocks |
| `completeIpSeed` | `seedId` | `IpSeed` blueprint fields |
| `draftIpFiling` | `seedId`, `filingType` | `IpFiling` |
| `draftCapitalPack` | `seedId` | grants and loan proposal (returned) |
| `draftSeedPlaybooks` | `seedId` | `IpSeed` funding playbook, acquisition playbook, marketing plan, research brief, buyer leads |
| `hardenCodebase` | `seedId`, or `action: "sweep"` | `IpSeed.hardening_report`, upgraded `IpSeed.blueprint`, `ActivityEvent` |
| `liquidateIp` | `seedId` | `IpProspectus` |
| `runDeploymentKit` | `seedId` | `Deployment[]` |
| `runGhostValidation` | `seedId` | `GhostValidation[]` |
| `runWarRoom` | `seedId` | `DisruptionPlan[]` |
| `runExecutionOrder` | none | `ExecutionOrder` |
| `runOmniSense` | none | `LiveSignal[]` |
| `runOracle` | none | `MarketVector[]` |
| `runQuantumSim` | none | `SimulationRun` |
| `runHegemony` | none | `HegemonySnapshot` |
| `runTreasury` | none | `TreasurySnapshot` |
| `runNeuralCFO` | none | `ReinvestmentDecision[]` |
| `runGovernanceScan` | none | `InfringementAlert[]` |
| `agentOps` | `action` (register, deploy, pause, record_run) plus agent fields | `AgentDeployment` |
| `hfInference` | `projectId`, `seedId`, `action`, `field`, `model` | none (returns text) |
| `create-checkout` | `productId`, `quantity` | Wix checkout session, returns `redirectUrl` |
| `payments-webhook` | Base44 Payments JWT events | `Base44Purchase` |

Notes that matter in maintenance:

- Portfolio-wide functions take no body. They read the whole ledger, which keeps them callable from a scheduled workflow.
- `agentOps` and `createMarketSeed` accept a keyed path for agents that have no user session: `x-agent-key` against `MARKET_HUNTER_KEY`. That key is a machine credential, not a user credential; pause stays operator-only.
- `hfInference` runs through the app-user Hugging Face connector, so it acts as the connected operator, never as the app.

## 7. Shared modules

- `base44/shared/ipVectors.ts` — the twenty-four vectors and the hunt presets. The UI imports the same taxonomy from `src/lib/ipVectors.js`; the two must stay in step.
- `base44/shared/planPipeline.ts` — loads a project with its dossier context so scan, funding and readiness functions agree on what a dossier contains.
- `base44/shared/seedTargets.ts` — resolves buyer and target candidates for liquidation work.
- `base44/shared/v9Core.ts` — scoring constants shared by the generators.

## 8. Workflows

- `Sovereign IP Hunt` — scheduled hunt: runs `runIpHunt` then `ipWealthStrategy`. Keeping it scheduled rather than on-demand is what makes the ledger compound.
- `Dossier Ready For Review` — fires on dossier promotion and runs the readiness package.

Both are versioned on save; running instances keep the version they started on.

## 9. The codebase generator

`src/lib/kit/` emits a complete application from a seed plus a brand kit. The order is fixed because each module consumes the previous one's output.

| Module | Emits |
| --- | --- |
| `model.js` | The data model: collections, fields, types, labels, primary keys. The single source of truth for SQL, server validation and screens. |
| `db.js` | Database access layer |
| `server.js` | Express app, auth middleware, owner-scoped record routes, migration |
| `client.js` | Styles, brand tokens, API client, session provider, shell, auth screens, router |
| `pagesRecords.js` | List, create and detail screens per collection |
| `tests.js` | Ownership isolation and contract tests |
| `docs.js` | Runtime documentation |
| `brand.js` | Brand module and brand documentation |
| `audit.js` | The three verification passes |
| `buildKit.js` (outside `kit/`) | Package scripts, configs, entry point, hand-off documents, assembly |
| `scaffoldKit.js` | Scaffold assets, deterministic demo data, roadmap |

`model.js` derives collections from the seed's SQL schema. It parses `CREATE TABLE` statements written either multiline or on one line, because both occur in generated blueprints; a missed parse silently degrades the codebase to a single generic table.

Generated route paths are derived from the same collection list the router uses, so a collection can never be reachable in the navigation and missing from the server.

## 10. Verification gates

Three independent gates stand between generation and a download.

**Gate 1 — codebase audit (`src/lib/kit/audit.js`).** Runs three passes over the emitted file set:

1. Structure: every required file exists.
2. Syntax: regex-level checks for balanced braces, unterminated strings and template literals.
3. Contracts: the set of file paths referenced by router imports, navigation entries and test files must all exist; a route in the navigation with no file behind it fails.

**Gate 2 — dossier audit (`src/lib/dossierAudit.js`).** Checks every expected document before it enters the pack: presence, minimum substantive length per section, no placeholder or lorem text, no unfilled template token, and a named buyer for the prospectus.

**Gate 3 — runtime proof inside the generated repository.** `./verify.sh` installs, migrates, boots, and runs the contract suite. Static analysis cannot execute Postgres, so the QA report states plainly which checks were static and which require the runtime step.

A pack or bundle that fails its gate is not produced. The UI shows the failing checks by file and reason; there is no override.

## 11. Security posture

- **Sessions** are platform-issued. The frontend never stores credentials; `ProtectedRoute` gates rendering, and functions re-authenticate on every call.
- **Second factor**: when required, sign-in returns `mfa_required` and the app runs the second step through the platform's MFA components and helpers. Do not re-implement that flow.
- **Row-level rules** are the only thing standing between one operator's records and another's; service-role writes in functions must therefore scope by owner explicitly.
- **Secrets** live in app secrets, never in source: `MARKET_HUNTER_KEY` (agent intake), `BASE44_API_KEY` and `BASE44_API_TOKEN` (platform API), `GITHUB_API_TOKEN` (repository work), `WIX_CHECKOUT_API_KEY`, `WIX_CHECKOUT_SITE_ID`, `WIX_CHECKOUT_APP_URL`, `WIX_CHECKOUT_WEBHOOK_URL`, `WIX_CHECKOUT_WEBHOOK_PUBLIC_KEY`, `WIX_PAYMENTS_API_KEY`, `WIX_PAYMENTS_SITE_ID`, `WIX_PAYMENTS_WEBHOOK_PUBLIC_KEY`.
- **Machine intake** uses a single shared key and is limited to creating a market seed or an agent registration; it can never read portfolio data.
- **Uploads** go to private storage and are read back through signed URLs.
- **No client-trusted prices.** A price sent from the browser is ignored; the function resolves it server-side.

## 12. Payments path

Intended flow:

1. The buyer calls `create-checkout` with a product identifier and a bounded quantity.
2. The function resolves the product and price server-side, constructs the Wix checkout session and returns `redirectUrl`; the client redirects.
3. Base44 Payments calls `payments-webhook` with a signed JWT. The webhook verifies the signature, checks the order is approved and paid, matches total and currency against the server-stored expectation, and writes a `Base44Purchase`.
4. The grant step creates the entitlement that unlocks the simulator.

Two steps of that flow are not finished in this build; see section 15.

## 13. Frontend conventions

- Tokens live in `src/index.css` and are mapped in `tailwind.config.js`. Use token classes (`bg-bottle`, `bg-paper`, `font-heading`), never literal colours or font names in JSX.
- Typography is editorial: serif headings, sans body. Density is deliberate; no decorative motion beyond interaction feedback.
- Mobile is a first-class target: every surface is checked at phone width, tables scroll inside their container, and action groups wrap rather than overflow.
- Content images render through the responsive image component so they are sized and encoded per container.
- Long lists page on the server with a load-more cursor; counters use server counts; per-group totals use aggregates.

## 14. Operations runbook

| Task | How |
| --- | --- |
| Verify the documentation is complete | `node src/docs/verify-manifest.mjs` from the repository root. Non-zero exit means drift. |
| Confirm the app builds | `npx vite build`. |
| Investigate a failed generation | Read the failing gate's message in the UI, then the function's log entry; the packs record their verification outcome in `QA_REPORT.md`. |
| Re-run a hunt | Run it again rather than patching records; the hunter retries incomplete seeds itself. |
| Investigate a payment | Base44 Payments dashboard: Overview, Payments, Manage. All Payments for a charge, Payouts for bank transfers. App records and provider transactions are separate ledgers and must be reconciled, not assumed equal. |

## 15. Known gaps (open items)

Documented rather than hidden, because a guide that overstates the system is worse than none.

| Item | State | Effect |
| --- | --- | --- |
| `create-checkout` price | Still the scaffold placeholder (`0.00`), with product name `Purchase`. | The amount guard rejects anything under 0.50, so checkout cannot complete. Set the real server-side price and product source before taking money. |
| Webhook grant step | The app-specific region is a commented template; nothing writes `SimulatorAccess`. | A purchase would not unlock the simulator. Implement the grant, keyed on the recorded purchase. |
| Edge deployment of generated codebases | Not implemented. | Exports are verified archives a counterparty deploys; the app does not push them to a live server. |
| Runtime verification inside the pack | `./verify.sh` runs at the destination, not here. | Static passes cannot prove the database migrations apply. The QA report states this. |
| Simulator entitlement read | Pages read `SimulatorAccess` by `status: active`. | Until the grant exists, no record exists, so the simulator stays closed. |

## 16. Documentation integrity

Three documents and one verifier:

- `USER_GUIDE.md` — behaviour, surface by surface.
- `TECHNICAL_GUIDE.md` — this document.
- `FILE_MANIFEST.md` — every file, grouped, with its role, and the counts.
- `verify-manifest.mjs` — walks the tree, compares set membership both ways, prints any file on disk the manifest omits and any entry with no file, exits non-zero on drift.

Regenerating the manifest after any structural change is not optional: it is the check that the guides still describe the code that exists. Current state: 303 files, verified clean.

These three documents describe InvestArch itself. Documentation **of a seed's generated application** is produced per seed by `src/lib/seedDocs.js` and surfaced by `src/components/docs/SeedDocsSection.jsx` inside that seed: the user guide and technical guide come from `kit/docs.js`, and the file manifest is walked from the emitted file set (`seedFileSet`) so it matches the export exactly, with `AUDIT.md` the only file added at packaging time.