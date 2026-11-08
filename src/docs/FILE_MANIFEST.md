# InvestArch — File Manifest

Version 1.0 · 8 November 2026 · Compiled by the Registrar.

This manifest enumerates every file in the application repository, grouped by area, with the role each file plays. It is the completeness check for the Registrar's documentation: if a file is on disk and not listed here, it is undocumented; if it is listed here and not on disk, the guide describes something that no longer exists.

**Totals:** 331 files — 15 root · 94 backend · 19 skills · 203 app source.

**Verification.** Run `node src/docs/verify-manifest.mjs` from the repository root. It walks the working tree (ignoring `node_modules`, `.git`, `dist`), compares it against the entries below, prints any file missing from the manifest and any entry with no file behind it, and exits non-zero on drift. A clean run prints `OK` and the two matching counts.

---

## 1. Repository root (15)

- `.gitignore` — excludes build output, dependencies and local environment files from version control.
- `.npmrc` — npm registry configuration used for installs.
- `AGENTS.md` — standing work orders for coding agents: build contracts, verification gates, hand-off rules.
- `CLAUDE.md` — repository briefing consumed by external coding agents.
- `DESIGN.md` — design direction: editorial type scale, paper and bottle-green palette, motion limits.
- `README.md` — project overview and entry points.
- `components.json` — shadcn/ui generator configuration (style, aliases).
- `eslint.config.js` — lint rules for application source.
- `index.html` — document shell, React mount point, document metadata.
- `jsconfig.json` — path alias `@/*` to `src/*`.
- `package.json` — dependencies and scripts.
- `package-lock.json` — locked dependency graph.
- `postcss.config.js` — PostCSS and Tailwind pipeline.
- `tailwind.config.js` — token-to-class mapping, font roles, keyframes.
- `vite.config.js` — Vite build with the Base44 plugin, React, HMR and analytics hooks.

## 2. Base44 backend (95)

### 2.1 Configuration (2)

- `base44/config.jsonc` — application-level backend configuration.
- `base44/mcp/config.json` — MCP server exposure for the published app.

### 2.2 Entities (45)

- `base44/entities/ActivityEvent.jsonc` — append-only operator activity trail written by seed capture and dossier promotion.
- `base44/entities/AgentDeployment.jsonc` — registry of external and in-app agents with run counts, success rate and status.
- `base44/entities/Alliance.jsonc` — partnership and distribution alliances held in the portfolio graph.
- `base44/entities/ArchetypeImprint.jsonc` — audience archetypes with imprint thesis, channels and depth.
- `base44/entities/Base44Purchase.jsonc` — payment purchase record written by the payments webhook.
- `base44/entities/BrandKit.jsonc` — operator brand tokens (name, tagline, logo, palette, fonts) applied to exported codebases.
- `base44/entities/CelestialClaim.jsonc` — orbital and deep-space claim frameworks.
- `base44/entities/Competitor.jsonc` — competitors per project with strengths, weaknesses and radar scores.
- `base44/entities/Deployment.jsonc` — deployment records produced by the deployment kit.
- `base44/entities/DisruptionPlan.jsonc` — war-room disruption plans per seed (kill feature, obsolescence path).
- `base44/entities/EpochSnapshot.jsonc` — dated portfolio epoch snapshots.
- `base44/entities/EvolutionLog.jsonc` — model and strategy evolution entries.
- `base44/entities/ExecutionOrder.jsonc` — executable build/flip orders derived from the seed ledger.
- `base44/entities/FundingSource.jsonc` — matched funders per project with drafts, outreach and status.
- `base44/entities/GateVerdict.jsonc` — measured verdicts against logic gates.
- `base44/entities/GhostValidation.jsonc` — synthetic pre-launch validation angles and copy.
- `base44/entities/HegemonySnapshot.jsonc` — market-grip snapshots with levers and verdict.
- `base44/entities/Heuristic.jsonc` — learned heuristics retained by the system.
- `base44/entities/HybridAsset.jsonc` — hybrid physical/digital assets in the portfolio.
- `base44/entities/InfrastructureLayer.jsonc` — infrastructure layers underpinning the asset graph.
- `base44/entities/InfringementAlert.jsonc` — governance-scan infringement alerts with severity and cease-and-desist drafts.
- `base44/entities/IpFiling.jsonc` — patent, trademark, copyright and deed instruments drafted per seed.
- `base44/entities/IpProspectus.jsonc` — liquidation prospectus naming buyers, offer type and terms.
- `base44/entities/IpSeed.jsonc` — the IP seed ledger: gap, solution, blueprint, strategy, status and yield date.
- `base44/entities/LedgerEntry.jsonc` — revenue and cost ledger entries.
- `base44/entities/LiveSignal.jsonc` — live market signals with domain, window and recommended strike.
- `base44/entities/LogicConstant.jsonc` — versioned axioms the strategy layer must respect.
- `base44/entities/LogicGate.jsonc` — metric gates with comparator, threshold and enforcement action.
- `base44/entities/MarketSeed.jsonc` — captured market seeds awaiting promotion to a dossier.
- `base44/entities/MarketVector.jsonc` — the 24-vector market taxonomy with weights and thesis.
- `base44/entities/NarrativeVector.jsonc` — narrative theses pushed into the market.
- `base44/entities/PhysicalAsset.jsonc` — physical assets held or claimed.
- `base44/entities/Project.jsonc` — investment dossiers: sections, plan points, value scan, radar and forecast.
- `base44/entities/RegulatoryLever.jsonc` — regulatory levers and their status.
- `base44/entities/ReinvestmentDecision.jsonc` — capital reallocation decisions produced by the neural CFO.
- `base44/entities/SimulationRun.jsonc` — quantum-simulation runs with scenarios and optimal path.
- `base44/entities/SimulatorAccess.jsonc` — paid simulator entitlement, one record per subscriber.
- `base44/entities/SynergyTrigger.jsonc` — cross-asset synergy triggers.
- `base44/entities/SyntheticPersona.jsonc` — synthetic customer personas used for pre-launch testing.
- `base44/entities/TalentAlignment.jsonc` — talent alignment records.
- `base44/entities/TimelineMilestone.jsonc` — dated milestones per project.
- `base44/entities/TreasurySnapshot.jsonc` — treasury position snapshots.
- `base44/entities/User.jsonc` — built-in user entity, customized role values only.
- `base44/entities/ValueAnchor.jsonc` — multi-year value anchors with steering design and progress.
- `base44/entities/ValueAxiom.jsonc` — value axioms indexing assets against a defined metric.

### 2.3 Backend functions (36)

- `base44/functions/agentOps/entry.ts` — agent registrar: register, deploy, pause and record runs; app-user session or `x-agent-key`.
- `base44/functions/analyzeBusiness/entry.ts` — turns a URL and company name into a dossier: sections, forecast, milestones and funding sources.
- `base44/functions/architectSeed/entry.ts` — writes the codebase blueprint, user manual, onboarding guide and ecosystem interlocks onto a seed.
- `base44/functions/buildCodebase/entry.ts` — generates a monorepo file set for a completed dossier project.
- `base44/functions/buildPlanPoints/entry.ts` — regenerates the scored plan points of a dossier and keeps the revision notes.
- `base44/functions/completeIpSeed/entry.ts` — repairs an incomplete seed by filling tech stack, schema and core logic.
- `base44/functions/create-checkout/entry.ts` — Base44 Payments checkout session for a product id and quantity.
- `base44/functions/createMarketSeed/entry.ts` — keyed intake endpoint that captures a market seed and logs the event.
- `base44/functions/buyerIntel/entry.ts` — OSINT read of up to eight named buyers per call: snapshot, dated public moves, buying trigger, one falsifiable insight with its source, and an explicit confidence grade. The grade is enforced server-side: a profile with no source URL is graded down to thin, and a verified profile must carry at least one dated move.
- `base44/functions/draftBuyerLeads/entry.ts` — names every credible buyer for a seed and writes each company its own first-touch email; single seed or a sweep of three, returning the digest text for the nightly email.
- `base44/functions/draftCapitalPack/entry.ts` — drafts grant applications and a small-business loan proposal for a seed.
- `base44/functions/draftFundingLetters/entry.ts` — drafts outreach subject, body and application narrative per matched funder.
- `base44/functions/draftIpFiling/entry.ts` — drafts one instrument (patent, trademark, deed, copyright) for a seed.
- `base44/functions/draftSeedPlaybooks/entry.ts` — drafts the funding playbook, acquisition playbook, marketing plan, research brief and named buyer leads, grounded in live sources.
- `base44/functions/generateReadinessPackage/entry.ts` — assembles the capital-readiness package for a dossier.
- `base44/functions/hardenCodebase/entry.ts` — runs the structure, contracts, security and enhancement pods on a seed's blueprint, records the verdict and applies the upgraded model.
- `base44/functions/hfInference/entry.ts` — Hugging Face inference through the app-user connector: score, rewrite or complete a field.
- `base44/functions/ipWealthStrategy/entry.ts` — assigns hold, flip or build to every seed with a written rationale.
- `base44/functions/liquidateIp/entry.ts` — builds the liquidation prospectus, named buyers and offer terms for a seed.
- `base44/functions/markDossierReadyForReview/entry.ts` — promotes a dossier to ready-for-review and logs the event.
- `base44/functions/mixSeeds/entry.ts` — finds combinations of seeds that compound as one ecosystem, writes the chosen mix as a new seed, and in `auto` mode ranks and writes the strongest combinations without a manual pick.
- `base44/functions/payments-webhook/entry.ts` — verifies Base44 Payments JWTs, records the purchase and holds the grant hook.
- `base44/functions/refineDossierSection/entry.ts` — rewrites a single dossier section against operator guidance.
- `base44/functions/runDeploymentKit/entry.ts` — produces deployment records for a seed's codebase.
- `base44/functions/runExecutionOrder/entry.ts` — derives executable orders from the seed ledger and treasury.
- `base44/functions/runGhostValidation/entry.ts` — generates synthetic validation angles and copy per seed.
- `base44/functions/runGovernanceScan/entry.ts` — scans filings for infringement risk and drafts cease-and-desist text.
- `base44/functions/runHegemony/entry.ts` — measures market grip across levers and records a snapshot.
- `base44/functions/runIpHunt/entry.ts` — the Market Hunter: multi-batch signal sweep to a yield of complete seeds.
- `base44/functions/runNeuralCFO/entry.ts` — reallocates capital across the portfolio and records decisions.
- `base44/functions/runOmniSense/entry.ts` — sweeps for pre-emptive gaps and records live signals.
- `base44/functions/runOracle/entry.ts` — generates market vectors and their thesis.
- `base44/functions/runQuantumSim/entry.ts` — scenario simulation with probabilities and optimal path.
- `base44/functions/runTreasury/entry.ts` — snapshots the treasury position from ledger and assets.
- `base44/functions/runValueScan/entry.ts` — scores dossier plan points and records the value scan.
- `base44/functions/runWarRoom/entry.ts` — builds disruption plans against a target competitor.
- `base44/functions/scoreCompetition/entry.ts` — scores competitors on fixed dimensions and stores the radar.

### 2.4 Shared modules (5)

- `base44/shared/buyerLeads.ts` — buyer-lead schema, coverage prompt, pitch rules and the drafting call shared by the seed action and the sweep, plus the target rule the sweep uses.
- `base44/shared/ipVectors.ts` — the 96-vector taxonomy and fifteen hunt presets shared by the hunter and the UI.
- `base44/shared/planPipeline.ts` — dossier pipeline context loader shared by analysis, scan and funding functions.
- `base44/shared/seedTargets.ts` — buyer and target resolution helpers for liquidation and prospectus work.
- `base44/shared/v9Core.ts` — core scoring and strategy constants used across generators.

### 2.5 Workflows (4)

- `base44/workflows/Buyer Lead Sweep.jsonc` — nightly buyer-lead pass over the ledger, highest asymmetry first, twelve seeds per run, ending in the digest email to the operator.
- `base44/workflows/Codebase Hardening Pod.jsonc` — nightly hardening sweep over the seed ledger.
- `base44/workflows/Dossier Ready For Review.jsonc` — fires when a dossier is promoted and runs the readiness function.
- `base44/workflows/Sovereign IP Hunt.jsonc` — scheduled hunt that runs the hunter and strategy assignment.

### 2.6 Agents (1)

- `base44/agents/codebase_hardener.jsonc` — the hardening bench: reads a seed, runs the pods, rebuilds the codebase and refreshes the funding and buyer playbooks.

### 2.7 Email templates (1)

- `base44/emails/BuyerLeadDigest.html` — the nightly buyer-lead digest: seeds covered, every named buyer with its subject line and pitch, and coverage notes.

## 3. Agent skills (19)

Bundled from `antislop-skillset@3.3.4`.

- `skills/antislop/SKILL.md` — house rule against generic AI copy.
- `skills/antislop/VERSION` — skill version marker and source lineage.
- `skills/antislop/references/TAXONOMY-2.1.0-SUPERSEDED.md` — retired taxonomy kept for reference.
- `skills/antislop-code/SKILL.md` — code-specific anti-slop rules.
- `skills/antislop-copywriting/SKILL.md` — copywriting rules.
- `skills/antislop-human/SKILL.md` — human-voice rules.
- `skills/antislop-human/contrast-check.py` — contrast audit helper.
- `skills/antislop-human/contrast-mcp.py` — contrast audit over MCP.
- `skills/antislop-human/LICENSE-web-quality-skills` — upstream licence for the human-voice rules.
- `skills/antislop-human/references/WCAG.md` — accessibility conformance reference.
- `skills/antislop-human/references/A11Y-PATTERNS.md` — accessibility patterns for common controls.
- `skills/antislop-layoutmobile/SKILL.md` — mobile layout rules.
- `skills/antislop-ui/SKILL.md` — interface rules.
- `skills/antislop-ui/LICENSE-web-quality-skills` — upstream licence for the interface rules.
- `skills/antislop-ui/references/WEB-BASELINE.md` — browser baseline and support floor.
- `skills/antislop-ui/references/CORE-WEB-VITALS.md` — performance thresholds.
- `skills/pods/contracts.md` — Contracts pod: schema, logic and screens must agree.
- `skills/pods/security.md` — Security pod: isolation, trust boundaries, delete behaviour.
- `skills/pods/structure.md` — Structure pod: tables, keys, uniqueness, indexes.

## 4. App source (205)

### 4.1 Entry and shell (4)

- `src/App.jsx` — router, auth gate, protected layout, page routes.
- `src/main.jsx` — React entry point.
- `src/index.css` — design tokens for light and dark, base layer.
- `src/api/base44Client.js` — pre-initialized SDK client.

### 4.2 Shell components (10)

- `src/components/AuthLayout.jsx` — frame shared by the auth pages.
- `src/components/GoogleIcon.jsx` — provider mark for the Google button.
- `src/components/Layout.jsx` — sidebar and top-bar shell with `<Outlet />`.
- `src/components/MfaFlow.jsx` — second-factor challenge: authenticator, SMS, resend, remember device.
- `src/components/MfaManage.jsx` — enable, replace or disable a factor.
- `src/components/MfaMethodSetup.jsx` — single method setup panel.
- `src/components/MfaParts.jsx` — `MfaScreen` wrapper used by the MFA pages.
- `src/components/ProtectedRoute.jsx` — route guard, redirects anonymous visitors.
- `src/components/ScrollToTop.jsx` — resets scroll on navigation.
- `src/components/UserNotRegisteredError.jsx` — shown when a session has no app user.

### 4.3 Command surfaces (10)

- `src/components/command/BuildButton.jsx` — bulk build action on the home surface.
- `src/components/command/HunterPanel.jsx` — hunt control and last-run summary.
- `src/components/command/LedgerPanel.jsx` — portfolio ledger readout.
- `src/components/command/Panel.jsx` — numbered panel primitive.
- `src/components/command/PipelinePanel.jsx` — dossier pipeline stages.
- `src/components/command/ReadinessTrendPanel.jsx` — readiness history chart.
- `src/components/command/SeedBoardPanel.jsx` — Kanban board across active seeds.
- `src/components/command/SeedCard.jsx` — one seed on the board.
- `src/components/command/SimulatorPanel.jsx` — simulator access and run control.
- `src/components/command/StageTrack.jsx` — stage progress track.

### 4.4 Connect (2)

- `src/components/connect/ServerUrlField.jsx` — validated server URL input.
- `src/components/connect/Steps.jsx` — numbered connection steps.

### 4.5 Dashboard (3)

- `src/components/dashboard/SeedFeed.jsx` — latest seeds on the home surface.
- `src/components/dashboard/SignalFeed.jsx` — latest live signals.
- `src/components/dashboard/StatStrip.jsx` — portfolio counters.

### 4.6 Documentation (2)

- `src/components/docs/DocMarkdown.jsx` — markdown renderer used by the per-seed documentation.
- `src/components/docs/SeedDocsSection.jsx` — one seed's user guide, technical guide and file manifest, readable and downloadable.

### 4.7 Dossier (4)

- `src/components/dossier/CompetitiveChart.jsx` — radar chart of competitor scores.
- `src/components/dossier/CompetitorTable.jsx` — competitor strengths, weaknesses and edge.
- `src/components/dossier/ForecastTable.jsx` — year-by-year revenue, expense and EBITDA.
- `src/components/dossier/FundingTable.jsx` — matched funders with drafts and outreach state.

### 4.8 Hugging Face (3)

- `src/components/hf/HuggingFaceConnect.jsx` — connector status and connect action.
- `src/components/hf/RewriteSection.jsx` — rewrite a dossier section through inference.
- `src/components/hf/ScoreSeedButton.jsx` — score a seed through inference.

### 4.9 IP Factory (11)

- `src/components/ipFactory/AgentRegistryPanel.jsx` — register, deploy, pause agents and copy their contract.
- `src/components/ipFactory/BuyerLeadsPanel.jsx` — named buyers by category, each with its written pitch and a copy action.
- `src/components/ipFactory/CodebaseExportPanel.jsx` — verify and download full codebase bundles.
- `src/components/ipFactory/EcosystemRanking.jsx` — the ranked ecosystems, each with its rank, compounding score, members and full record, shown above the seed ledger.
- `src/components/ipFactory/ExportArchives.jsx` — three exports that build one archive each in the browser: all seeds, all ecosystems, all buyers, with live progress and a report of anything incomplete.
- `src/components/ipFactory/RebuildCodebasesButton.jsx` — rebuilds every codebase: hardening until it clears the 83 floor, then the antislop audit with its findings patched and re-audited.
- `src/components/ipFactory/MixComboCard.jsx` — one seed combination: thesis, shared loop, roles and merged stack.
- `src/components/ipFactory/MixSeedsDialog.jsx` — mix scan, the combination list and ecosystem creation.
- `src/components/ipFactory/PlaybookSection.jsx` — funding and acquisition playbooks, named buyer leads with pitches, marketing plan, research brief and the hardening verdict.
- `src/components/ipFactory/RunCost.jsx` — hunt cost estimate and last-run yield.
- `src/components/ipFactory/SeedDetail.jsx` — full seed body and its instrument, prospectus and pack actions.

### 4.10 Nexus (6)

- `src/components/nexus/InvestorBaseFilter.jsx` — investor-base filter: pick a tracked investor and see the seeds that name them.
- `src/components/nexus/NetworkMap.jsx` — SVG network of seeds, competitors, funders and archetypes.
- `src/components/nexus/NodeInspector.jsx` — detail panel for the selected node.
- `src/components/nexus/ReadinessPanel.jsx` — funding readiness scoring.
- `src/components/nexus/SyndicateList.jsx` — syndicate cards: shared asset, seed count, combined and average asymmetry.
- `src/components/nexus/SyndicateMap.jsx` — two-column map of shared investor bases and market vectors against the seeds that share them.

### 4.11 Brand and shared panels (3)

- `src/components/brand/BrandKitPanel.jsx` — brand name, tagline, logo, palette and fonts applied to every export.
- `src/components/packagePanel/PackagePanel.jsx` — dossier pack controls.
- `src/components/shared/PageHeader.jsx` — page title block.

### 4.12 Simulator (5)

- `src/components/simulator/GatePanel.jsx` — logic gates and verdicts.
- `src/components/simulator/MarketIntelTab.jsx` — market vectors tab.
- `src/components/simulator/VectorCard.jsx` — one forecast: evidence grade, why now, falsifier and re-check date.
- `src/components/simulator/RunButton.jsx` — simulator run control with busy state.
- `src/components/simulator/StrategyTab.jsx` — strategy output tab.

### 4.13 UI primitives (53)

- `src/components/ui/accordion.jsx` — accordion primitive.
- `src/components/ui/alert-dialog.jsx` — alert dialog primitive.
- `src/components/ui/alert.jsx` — inline alert primitive.
- `src/components/ui/aspect-ratio.jsx` — aspect ratio wrapper.
- `src/components/ui/avatar.jsx` — avatar primitive.
- `src/components/ui/badge.jsx` — badge primitive and variants.
- `src/components/ui/breadcrumb.jsx` — breadcrumb primitive.
- `src/components/ui/button.jsx` — button primitive and variants.
- `src/components/ui/calendar.jsx` — calendar primitive.
- `src/components/ui/card.jsx` — card primitive.
- `src/components/ui/carousel.jsx` — carousel primitive.
- `src/components/ui/chart.jsx` — chart container and tooltip.
- `src/components/ui/checkbox.jsx` — checkbox primitive.
- `src/components/ui/collapsible.jsx` — collapsible primitive.
- `src/components/ui/command.jsx` — command palette primitive.
- `src/components/ui/context-menu.jsx` — context menu primitive.
- `src/components/ui/dialog.jsx` — dialog primitive.
- `src/components/ui/drawer.jsx` — drawer primitive.
- `src/components/ui/dropdown-menu.jsx` — dropdown menu primitive.
- `src/components/ui/form.jsx` — form field primitives.
- `src/components/ui/hover-card.jsx` — hover card primitive.
- `src/components/ui/image-helpers.js` — URL and srcset helpers for the image component.
- `src/components/ui/image.jsx` — responsive image with fill or fit.
- `src/components/ui/input-otp.jsx` — one-time-code input.
- `src/components/ui/input.jsx` — text input primitive.
- `src/components/ui/label.jsx` — label primitive.
- `src/components/ui/menubar.jsx` — menubar primitive.
- `src/components/ui/navigation-menu.jsx` — navigation menu primitive.
- `src/components/ui/pagination.jsx` — pagination primitive.
- `src/components/ui/popover.jsx` — popover primitive.
- `src/components/ui/progress.jsx` — progress primitive.
- `src/components/ui/radio-group.jsx` — radio group primitive.
- `src/components/ui/resizable.jsx` — resizable panels primitive.
- `src/components/ui/responsive-image.jsx` — legacy responsive image wrapper.
- `src/components/ui/scroll-area.jsx` — scroll area primitive.
- `src/components/ui/select.jsx` — select primitive.
- `src/components/ui/separator.jsx` — separator primitive.
- `src/components/ui/sheet.jsx` — sheet primitive.
- `src/components/ui/sidebar.jsx` — sidebar primitives.
- `src/components/ui/skeleton.jsx` — loading placeholder.
- `src/components/ui/slider.jsx` — slider primitive.
- `src/components/ui/sonner.jsx` — toast surface.
- `src/components/ui/switch.jsx` — switch primitive.
- `src/components/ui/table.jsx` — table primitives.
- `src/components/ui/tabs.jsx` — tabs primitive.
- `src/components/ui/textarea.jsx` — textarea primitive.
- `src/components/ui/toast.jsx` — toast primitive.
- `src/components/ui/toaster.jsx` — toast host.
- `src/components/ui/toggle-group.jsx` — toggle group primitive.
- `src/components/ui/toggle.jsx` — toggle primitive.
- `src/components/ui/tooltip.jsx` — tooltip primitive.
- `src/components/ui/use-responsive-image.jsx` — responsive image hook.
- `src/components/ui/use-toast.jsx` — toast hook and reducer.

### 4.14 Value engine (4)

- `src/components/valueEngine/EngineTab.jsx` — engine tab frame.
- `src/components/valueEngine/FundingDrafts.jsx` — funder drafts and letters.
- `src/components/valueEngine/PlanList.jsx` — scored plan points list.
- `src/components/valueEngine/ScanPanel.jsx` — value-scan readout.

### 4.15 Hooks (4)

- `src/hooks/use-mobile.jsx` — viewport breakpoint hook.
- `src/hooks/use-size.jsx` — element size hook.
- `src/hooks/useDossierBuild.js` — dossier build and refinement state.
- `src/hooks/useHuggingFace.js` — connector-backed inference state.

### 4.16 Library (33)

- `src/lib/AuthContext.jsx` — auth provider, session state and public settings.
- `src/lib/PageNotFound.jsx` — 404 page with a real 404 status.
- `src/lib/activity.js` — activity event writer.
- `src/lib/agentDeploy.js` — deploy contract text for external agents.
- `src/lib/agentDocs.js` — agent hand-off documents.
- `src/lib/app-params.js` — runtime app parameters.
- `src/lib/authMfa.js` — MFA-aware email sign-in helper.
- `src/lib/authMfaFlow.js` — MFA-aware provider sign-in helper.
- `src/lib/authReturnTo.js` — safe post-login destination resolution.
- `src/lib/buildKit.js` — project configuration, hand-off docs and file assembly for generated repos.
- `src/lib/codebaseExport.js` — audits generated codebases and packages them as ZIP archives.
- `src/lib/codebaseRegen.js` — rebuilds every codebase: hardens each blueprint to the 83 floor, then runs the antislop audit, patches the source copy it flags and regenerates.
- `src/lib/dossierAudit.js` — verifies every dossier document before packaging.
- `src/lib/dossierPack.js` — assembles the dossier ZIP: PDFs, kit, codebase, QA report.
- `src/lib/exporter.js` — dossier download helpers.
- `src/lib/huntCost.js` — hunt credit estimate.
- `src/lib/ipVectors.js` — vector labels, presets and hunt scope.
- `src/lib/nexusGraph.js` — graph construction for the nexus map.
- `src/lib/noSlop.js` — copy filters applied to generated text.
- `src/lib/pdfBuilder.js` — PDF document construction.
- `src/lib/query-client.js` — TanStack Query client.
- `src/lib/readinessHistory.js` — readiness trend series.
- `src/lib/scaffoldKit.js` — scaffold assets, demo data and roadmap for generated repos.
- `src/lib/seedDocs.js` — derives one seed's user guide, technical guide and file manifest from the generator.
- `src/lib/seedComplete.js` — required-field rules for a complete seed.
- `src/lib/buyerArchive.js` — assembles the buyer book: one profile per company, an index table and the JSON record, with confidence stated per buyer.
- `src/lib/buyerSummary.js` — the research summary report: coverage, the evidence grade behind every finding, who to open first, and what to re-verify; emitted as Markdown and PDF.
- `src/lib/dossierPdf.js` — parses a dossier document's title, subtitle and sections and renders it as a paginated PDF, so a seed can ship as a print-ready set instead of Markdown.
- `src/lib/buyerIntel.js` — collects and deduplicates every named buyer across the ledger, then researches them in bounded batches through the buyerIntel function.
- `src/lib/seedArchive.js` — the bulk seed archive: dossier documents as Markdown, the verified codebase file set and the buyer book, per seed folder, in one compressed ZIP.
- `src/lib/seedReadiness.js` — funding readiness scoring per seed.
- `src/lib/syndicateMap.js` — clusters seeds that share a named buyer or a market vector, for combined-round syndicates; buyer links come from buyer leads, prospectus targets and tracked funders named in a seed's playbook.
- `src/lib/utils.js` — class-name merge helper.

### 4.17 Generated-code kit (10)

- `src/lib/kit/audit.js` — structure, syntax and contract passes for generated files.
- `src/lib/kit/brand.js` — brand defaults, normalization and brand assets.
- `src/lib/kit/client.js` — generated client: styles, API client, auth, pages and router.
- `src/lib/kit/db.js` — generated database access layer.
- `src/lib/kit/docs.js` — generated repository documentation.
- `src/lib/kit/model.js` — single source of truth for the generated data model.
- `src/lib/kit/pagesRecords.js` — generated list, create and detail screens per collection.
- `src/lib/kit/server.js` — generated Express server, routes and migration.
- `src/lib/kit/slopAudit.js` — antislop pass over a generated codebase: every finding names its file, phrase and the house rule that caught it.
- `src/lib/kit/tests.js` — generated ownership and contract tests.

### 4.18 Pages (37)

- `src/pages/AccountSettings.jsx` — account and subscription settings.
- `src/pages/AssetManagement.jsx` — seeds and instruments held as assets.
- `src/pages/CapitalReadiness.jsx` — capital readiness package per project.
- `src/pages/CommandCenter.jsx` — pipeline board, readiness trend, hunter, ledger and simulator.
- `src/pages/ComplianceAudit.jsx` — governance audit across gates, filings and signals.
- `src/pages/Connect.jsx` — external server connection setup.
- `src/pages/Dashboard.jsx` — home: counters, signals, seeds and dossiers.
- `src/pages/DisruptionLog.jsx` — war-room disruption plans.
- `src/pages/DossierWorkshop.jsx` — section-by-section dossier refinement.
- `src/pages/EntityNexus.jsx` — network map with readiness inspector.
- `src/pages/ExecutionOrders.jsx` — derived build and flip orders.
- `src/pages/ExecutionTimeline.jsx` — dated milestones per project.
- `src/pages/ForgotPassword.jsx` — password reset request.
- `src/pages/IntellectualAssets.jsx` — filings and seeds as intellectual assets.
- `src/pages/InvestorMatchmaker.jsx` — funder matching against dossiers.
- `src/pages/InvestorPipeline.jsx` — funder pipeline and outreach state.
- `src/pages/IpFactory.jsx` — hunt, seed ledger, packs, codebases, brand and agents.
- `src/pages/Login.jsx` — email and Google sign-in with MFA handoff.
- `src/pages/MarketIntel.jsx` — market vectors and their thesis.
- `src/pages/MarketResonance.jsx` — narrative resonance against archetypes and signals.
- `src/pages/Mfa.jsx` — second-factor sign-in completion and factor management.
- `src/pages/NewAnalysis.jsx` — start a dossier from a URL.
- `src/pages/OAuthConsent.jsx` — OAuth consent screen for app clients.
- `src/pages/PersonaManager.jsx` — synthetic personas.
- `src/pages/PrecisionSimulator.jsx` — paid simulator across snapshots and runs.
- `src/pages/ProjectDetail.jsx` — full dossier read, refine and funding actions.
- `src/pages/ProspectusManager.jsx` — liquidation prospectuses per seed.
- `src/pages/Register.jsx` — registration with code verification.
- `src/pages/ResetPassword.jsx` — set a new password from a reset token.
- `src/pages/SignalMonitoring.jsx` — live signal feed.
- `src/pages/SimulationArchive.jsx` — past simulation runs and snapshots.
- `src/pages/StrategyBlueprint.jsx` — logic constants the strategy layer respects.
- `src/pages/StrategyVault.jsx` — narrative vectors and their projects.
- `src/pages/SynthesisArchive.jsx` — archived dossier syntheses.
- `src/pages/SynthesisLogs.jsx` — synthesis run log.
- `src/pages/SynthesisMetrics.jsx` — synthesis metrics across projects, funders and signals.
- `src/pages/ThankYou.jsx` — public post-payment return page.

### 4.19 Documentation source (4)

- `src/docs/FILE_MANIFEST.md` — this manifest.
- `src/docs/TECHNICAL_GUIDE.md` — architecture, data model, functions, gates and operations.
- `src/docs/USER_GUIDE.md` — operator guide to every surface.
- `src/docs/verify-manifest.mjs` — compares this manifest against the working tree.

### 4.20 Utilities (1)

- `src/utils/index.ts` — shared utility exports including page URL helpers.