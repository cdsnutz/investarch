# InvestArch — User Guide

Version 1.0 · 8 November 2026 · Maintained by the Registrar.

This guide covers every surface an operator can reach. Each section names the route, what the screen is for, and what it writes. Where a capability is not yet live, the guide says so rather than implying it works.

---

## 1. What InvestArch is

InvestArch turns a company, a market gap, or a raw signal into a defensible asset. Three engines do the work:

- **The Dossier engine** takes a company URL and returns an investment dossier: value proposition, market analysis, strategic edge, a five-year forecast, milestones, scored plan points and matched funders.
- **The Market Hunter** sweeps thirty-four market vectors for pain-signals opened in the last twelve months, discards anything already in the portfolio, and yields IP seeds: a gap, a solution, a blueprint and a route to the first thousand users.
- **The Registrar** turns a seed into property: a patent draft written as claims, a trademark packet, a deed of ownership, a copyright registration, a liquidation prospectus naming its buyers, a grant and loan pack, and a complete, verified codebase.

Everything the system produces is an artifact you can hand to a counterparty: a PDF, a ZIP, or a repository.

## 2. Who this is for

An operator running a portfolio of digital assets: one person holding many ventures, deciding which to build, which to license out, and which to hold. The interface assumes you are comfortable reading a P&L and a patent claim, not that you are a developer.

## 3. Getting in

| Surface | Route | What it does |
| --- | --- | --- |
| Register | `/register` | Creates the account and verifies the email with a code. Registration does not sign you in; the code step does. |
| Sign in | `/login` | Email and password, or Google. If the app requires a second factor, sign-in continues to `/mfa`. |
| Two-factor | `/mfa` | Completes a sign-in that needs a second step, and is also the settings screen for enabling, replacing or disabling an authenticator or SMS factor. |
| Forgot password | `/forgot-password` | Sends a reset link. The screen always reports success, whether or not the address exists. |
| Reset password | `/reset-password` | Sets a new password from the token in the link. |
| Account settings | `/account-settings` | Account details and subscription state for the simulator. |

Roles are `admin` and `user`. An admin can see and change all records and manage app users. A regular user sees only what the row-level rules on each entity allow, which in practice is their own records.

## 4. Command Center (home, `/`)

The landing surface after sign-in.

- **Counters** across the portfolio: seeds yielded, strategies assigned, dossiers completed.
- **Signal feed**: the most recent live signals, each with its domain, observation window and recommended strike.
- **Seed feed**: the most recent IP seeds with their asymmetric score and strategy.
- **Dossiers**: every analysis, newest first, with status and scan score. Select one to open it.
- **Build action**: starts a bulk build from this surface.

## 5. Producing a dossier (`/new`)

1. Enter the company URL. A company name and an analysis intensity are optional; intensity trades depth against cost.
2. Start the analysis. The dossier is created in `analyzing` state and the engine fills it in stages.
3. When it finishes, status becomes `complete`, and once the readiness gate passes it is promoted to `ready_for_review`.

A dossier record carries the executive summary, value proposition, market analysis, strategic edge, financial forecast, investor narrative, forecast years, key milestones, scored plan points, the value scan (dimension scores plus a per-point verdict), the competitive radar, and its matched funders and competitors.

## 6. Reading a dossier (`/projects/:id`)

The detail screen is the working document. From it you can:

- Read every generated section.
- **Re-score the plan points** (`buildPlanPoints`) when the underlying facts change.
- **Re-run the value scan** (`runValueScan`) to get a fresh per-point verdict and total.
- **Score competitors** (`scoreCompetition`) to rebuild the radar.
- **Draft funding letters** (`draftFundingLetters`) for each matched funder, then track outreach state from the pipeline screens.
- Open the forecast, competitor and funder tables.

A dossier is finished when the value scan is present, the plan points are scored and at least one funder is matched. Anything less is a draft.

## 7. IP Factory (`/ip-factory`)

The industrial floor of the app. This is where seeds are hunted, instrumented, and turned into shippable assets.

### 7.1 Running the hunt

**Run the hunt now** executes the Market Hunter. Choose a **hunt scope** first; the scope narrows which of the thirty-four vectors are swept. The run is the single most expensive operation in the app, so the panel above the ledger shows the credit estimate and, after a run, the yield it produced.

A hunt returns seeds in batches and only keeps complete ones: a seed without a gap, a solution, a pain-signal, a why-now and a distribution hook is retried, and if a batch still yields nothing complete the run reports a failure rather than writing partial records. After the seeds land, the strategy pass (`ipWealthStrategy`) assigns each one **hold**, **flip** or **build** with a written rationale.

### 7.2 The seed ledger

Filter by strategy and page through the ledger. Each seed card shows its asymmetric score, its strategy, its yield date, and the following actions.

| Action | What it produces |
| --- | --- |
| Architect: build codebase | The blueprint, user manual, onboarding guide and ecosystem interlocks for the seed. |
| Draft patent | A patent application draft: abstract, claims, detailed description, prior-art note. |
| Trademark packet | Brand name, classes, logo concepts, clearance note. |
| Copyright registration | The registration application text. |
| Deed of ownership | The instrument assigning ownership. |
| Liquidation prospectus | Named buyers with a rationale, the offer type and the offer terms. |
| Download dossier pack | The full ZIP described below. |

A seed flagged **Incomplete** is missing required fields; use **Complete this seed** to fill the blueprint before spending on instruments.

### 7.3 Mixing seeds into one ecosystem

**Mix seeds** reads the current ledger and returns the combinations that hold together as one product: two or three seeds serving the same buyer through a shared data spine, a shared distribution surface or a shared economic loop. Each combination arrives with the merged product's name, the thesis, the shared loop, what each member contributes, the merged tech stack and a merged Postgres schema. A pairing where one member would collapse into a feature of another is rejected before it reaches you, and a schema that is not a real merge is rejected the same way.

A weak pairing is not offered. When nothing in the ledger compounds, the panel says so rather than inventing a bundle.

**Create ecosystem** writes the combination as a new seed on the build ledger, marked **Mix of N**. From that point it is an ordinary seed with one difference: it is already merged. Architect it, draft its instruments, build its liquidation prospectus, download its dossier pack and export its codebase exactly as for any other seed, and both the pack and the codebase describe the ecosystem rather than its parts. The member seeds stay untouched, so each one can still be filed and sold on its own.

Finding combinations costs one synthesis call. Creating the mix costs nothing further.

### 7.4 What the dossier pack contains

```
<Seed> Dossier Pack.zip
  01_Patent_Application_Draft.pdf
  02_Trademark_Filing_Packet.pdf
  03_Deed_of_Ownership.pdf
  04_Copyright_Registration_Application.pdf
  05_Liquidation_Prospectus.pdf
  06_Developer_Onboarding_Guide.pdf
  07_Small_Business_Loan_Proposal.pdf
  08_Funding_Playbook.pdf       (how this asset gets funded, instrument by instrument)
  09_Acquisition_Playbook.pdf   (how it is sold to a larger company, with named buyers)
  10_Seed_Architecture.pdf
  11_Seed_Logic.pdf
  12_Seed_Data_Model.pdf
  13_Seed_Strategy.pdf
  14_Seed_Marketing_Plan.pdf
  15_Seed_Research_Brief.pdf
  16_Codebase_Hardening_Report.pdf
  Grants/<program>.pdf          (one per matched grant program)
  Codebase/                     (the generated repository, files and guides)
  Documentation/                (USER_GUIDE.md, TECHNICAL_GUIDE.md, MANIFEST.md)
  Data/                         (schema.sql and the seed record as JSON)
  PACK_MANIFEST.md              (every file in the pack, listed)
  QA_REPORT.md                  (what was verified, and what was not)
```

Documents 10 to 15 are generated from the seed record itself: the stack and repository layout, the mechanisms, the PostgreSQL schema with its table list, the portfolio verdict, the first-thousand-users plan, and the split between what the record shows and what is assumed.

Document 08 orders the instruments by what should be attempted first, states the evidence each funder scores and the disqualifier that ends an application. Document 09 names the buyer categories that pay for this capability, gives the packaging argument and valuation logic, then lists six to ten specific, currently operating companies with why each fits, the role to approach, the opening move and the proof to lead with. Both are grounded in live sources when they are drafted, and neither states a funding amount or a contact that the sources did not support. Use them as the working script: an outreach list you can act on, not a promise of capital.

If a seed has never been through the hardening bench, document 16 is absent and the pack says so in `QA_REPORT.md`. Press **Harden codebase** on the seed to produce it.

Nothing is packaged until every document passes its own check. A blank instrument, a section under a minimum length, a placeholder where a substantive paragraph belongs, or a missing grant or loan document blocks the download and names the document and the reason. The PDFs are drafts for filing and for submission, not executed instruments: a patent draft is not a filed application, and a trademark packet is not a registered mark.

### 7.5 Full codebases

**Verify & download** packages every seed's codebase, and refuses to package any that fails verification. Verification is three passes per codebase:

1. **Structure**: every required file present, nothing missing from the routes or the navigation.
2. **Syntax**: every JSX and JS file parses, every import resolves to a file the same generator emitted.
3. **Contracts**: the data model in the SQL migration, the server validation and the screens agree on every field, and the generated tests match the routes.

A generated repository contains an Express API, a Postgres migration, token authentication, owner-scoped record routes, list, create and detail screens for every collection, a contract test suite, `verify.sh`, `AGENTS.md`, `ACCEPTANCE.md` and `DEPLOYMENT.md`. `./verify.sh` is the runtime proof; static verification cannot execute the database.

Mixed ecosystems are packaged the same way, from the merged seed rather than its members: one schema, one route set, one brand, one `MANIFEST.md` describing the combined app.

**Harden codebase** runs the bench before the export rather than after a failed one. Four pods work in order over the seed's blueprint — structure (tables, keys, uniqueness, indexes), contracts (schema, logic and screens agreeing), security (isolation, trust boundaries, delete behaviour) — then enhancement, which proposes the two to four changes that most raise the asset's value. The bench records a verdict and a score out of 100 on the seed, keeps every existing table when it rewrites the model, and the next export is generated from the hardened schema. The same bench runs unattended every night over up to three seeds that have no report yet; the verdict appears on the seed and on the activity ledger.

### 7.6 Brand kit

Save a brand name, tagline, logo, palette and font pairing, and every exported codebase and site is rendered in it. With no brand saved, the default palette ships.

### 7.7 Agent registry

Register an agent, deploy it, pause it, and record its runs. Each agent row carries its kind (external or in-app), its parent agent, the seed it serves, its run count, its success rate and its last outcome. Registering returns a written contract the agent can follow: run the pack's `verify.sh` first, deploy the API on one origin behind TLS, register itself with the `x-agent-key` header, report every run. Deploying your own agents means registering each one with `parentAgent` set to the agent that spawned it.

### 7.8 The Registrar's documentation, per seed

Every seed carries its own documentation, written by the same generator that builds that seed's codebase. Open any seed and the **Seed documentation** block offers three documents:

- **User guide**: every screen of that generated application, every field, and every message its user can see.
- **Technical guide**: that application's stack, data model, API reference, authentication and ownership rules, tests and extension points, with its known limits stated.
- **File manifest**: every file the export writes for that seed, by directory, with sizes, counted from the emitted file set rather than transcribed.

Read in place, or download the active document as markdown to hand to a counterparty. Because the documents come from the generator, a seed's documentation cannot describe a file that does not ship.

## 8. Command Center (`/command-center`)

The portfolio in motion: the seed board across the pipeline, the readiness trend over time, the hunter control, the portfolio ledger, and the simulator run panel.

## 9. Portfolio and intelligence surfaces

| Route | Purpose | Reads |
| --- | --- | --- |
| `/entity-nexus` | Network map of projects, competitors, funders and archetypes with a readiness inspector. | Project, Competitor, FundingSource, ArchetypeImprint |
| `/market-intel` | The market vector taxonomy and its thesis. | MarketVector |
| `/market-resonance` | Whether a narrative is landing, against archetypes and live signals. | NarrativeVector, LiveSignal, ArchetypeImprint |
| `/strategy-vault` | Narrative theses held and the projects they belong to. | NarrativeVector, Project |
| `/strategy-blueprint` | The logic constants the strategy layer must respect. | LogicConstant |
| `/signal-monitoring` | The live signal feed in full. | LiveSignal |
| `/dossier-workshop` | Rewrite one dossier section against explicit guidance. | Project, refineDossierSection |
| `/capital-readiness` | The capital readiness package per project. | Project |
| `/prospectus-manager` | Liquidation prospectuses against their seeds. | IpProspectus, IpSeed |
| `/intellectual-assets` | Filings and seeds held as property. | IpFiling, IpSeed |
| `/asset-management` | The same assets managed by lifecycle. | IpSeed, IpFiling |
| `/investor-pipeline` | Funder pipeline with outreach state. | FundingSource, Project |
| `/investor-matchmaker` | Funder matching against dossiers. | FundingSource, Project |
| `/execution-orders` | Build and flip orders derived from the ledger. | ExecutionOrder |
| `/execution-timeline` | Dated milestones per project. | TimelineMilestone, Project |
| `/compliance-audit` | Governance view across gates, filings and signals. | LogicGate, HegemonySnapshot, IpFiling, LiveSignal, NarrativeVector, Project |
| `/disruption-log` | War-room disruption plans. | DisruptionPlan |
| `/persona-manager` | Synthetic personas used for pre-launch testing. | SyntheticPersona |
| `/synthesis-archive` | Archived dossier syntheses. | Project |
| `/synthesis-logs` | The synthesis run log. | Project |
| `/synthesis-metrics` | Metrics across projects, funders and signals. | Project, FundingSource, LiveSignal, NarrativeVector |
| `/simulation-archive` | Past simulation runs and hegemony snapshots. | SimulationRun, HegemonySnapshot |
| `/simulator` | The paid simulator: scenarios, gates, treasury and strategy tabs. | SimulationRun, GateVerdict, TreasurySnapshot and related |
| `/connect` | Point the app at an external server. | none |

## 10. Simulator and paid access

The Precision Simulator is the paid surface; access is gated on an active `SimulatorAccess` record. The checkout and grant path is wired but **not live**: the checkout function still carries the scaffold's placeholder price and the webhook's grant step is not yet implemented, so a purchase cannot complete and no subscription is created. Do not take payment through this app until that is closed. See the technical guide, section 15.

## 11. Limits worth knowing

- A pack that must draft four instruments, a grant pack, a loan proposal and a codebase takes minutes, not seconds. Leave the tab open until it finishes.
- Any single server operation is capped at roughly two minutes. Long pipelines are therefore chained into atomic functions rather than run as one call.
- Hunts and packs spend integration credits. The hunt panel shows the estimate before you run it.

## 12. Troubleshooting

| Symptom | Cause | What to do |
| --- | --- | --- |
| A seed shows **Incomplete** | The hunt produced a partial record. | Use **Complete this seed** before drafting instruments. |
| Dossier pack refuses to download | One document failed its audit; the message names the document. | Draft the missing instrument or re-run the pack; the pack re-drafts anything absent. |
| Codebase export refuses to package | A verification pass failed; the panel lists the failing checks and files. | Re-generate the seed's blueprint, then export again. |
| Hunt reports too few usable signals | The sweep found nothing clean enough to seed. | Run again, or widen the hunt scope. |
| A page is empty after sign-in | Row-level rules returned nothing for your role. | Confirm you are the record's owner, or ask an admin. |
| Sign-in loops back to the login screen | The session expired or the account has no app user. | Sign in again; if it persists, ask an admin to confirm your invitation. |

## 13. Glossary

- **Seed**: a market gap with a solution, a blueprint and a route to first users; the raw unit of IP.
- **Strategy**: the verdict on a seed, one of hold, flip or build.
- **Instrument**: a patent draft, trademark packet, copyright registration or deed of ownership.
- **Prospectus**: the liquidation document naming buyers and terms.
- **Dossier**: the investment document for a company.
- **Value scan**: the scored verdict on a dossier's plan points.
- **Dossier pack**: the ZIP containing instruments, capital documents, the codebase and the QA report.
- **Registrar**: the layer that turns seeds into property and keeps this documentation.