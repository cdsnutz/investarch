// The forge: one seed becomes a specified, audited, runnable full-stack app. The competitive
// teardown is read first, the data model it implies replaces the seed's own, and nothing is
// packaged until the generated kit passes its three audit passes.
import JSZip from 'jszip';
import { base44 } from '@/api/base44Client';
import { buildKitFiles } from '@/lib/buildKit';
import { auditKit, auditMarkdown } from '@/lib/kit/audit';
import { entityModel } from '@/lib/kit/model';
import { normalizeBrand } from '@/lib/kit/brand';
import { appSlug } from '@/lib/scaffoldKit';
import { buildAgentReadme, buildAcceptanceGuide, buildDeploymentGuide } from '@/lib/agentDocs';
import { buildAgentDeployGuide } from '@/lib/agentDeploy';
import { buildMvpBrief } from '@/lib/mvpBrief';
import { buildPortfolioIndex } from '@/lib/mvpIndex';
import { buildSourceFooter } from '@/lib/mvpSources';

export const forgeFolder = (seed) => appSlug(seed);

export async function loadForgeSpecs(seedIds) {
  if (!seedIds?.length) return {};
  const { items } = await base44.entities.MvpForge.filter({ seed_id: { $in: seedIds } }, { limit: 400 });
  const map = {};
  (items || []).forEach((record) => { map[record.seed_id] = record; });
  return map;
}

export async function forgeSpec(seedId, research) {
  const response = await base44.functions.invoke('forgeGoldMvp', {
    seedId,
    research: Array.isArray(research) ? research : []
  });
  return response?.data?.spec || null;
}

// The teardown decides the data model: its tables become the seed's schema, so the generated API,
// migration, screens and tests all describe the product that beats the field, not the seed's guess.
function audit(target, brand) {
  const files = buildKitFiles(target, null, brand);
  const report = auditKit(files, { entities: entityModel(target), brand: normalizeBrand(brand, target) });
  return { files, report };
}

function packageApp(seed, spec, brandKit) {
  const enriched = spec?.db_schema
    ? { ...seed, blueprint: { ...(seed.blueprint || {}), db_schema: spec.db_schema } }
    : seed;
  const brand = spec?.headline && !brandKit?.tagline ? { ...(brandKit || {}), tagline: spec.headline } : brandKit;

  let built = audit(enriched, brand);
  if (!built.report.ok && enriched !== seed) built = audit(seed, brand);

  if (!built.report.ok) {
    const first = built.report.errors[0];
    const problem = new Error(`${first?.file || 'kit'}: ${first?.message || 'verification failed'}`);
    problem.report = built.report;
    problem.seed = seed?.title || '';
    throw problem;
  }

  return { files: built.files, report: built.report };
}

export function buildForgeFiles(seed, spec, brand) {
  const { files, report } = packageApp(seed, spec, brand);
  // MVP_BRIEF.md carries the full register; every other hand-off document closes with the same
  // sources so no claim travels in a pack without the page and quote behind it.
  const footer = buildSourceFooter(spec);
  const cited = (content) => `${String(content).trimEnd()}\n\n${footer}\n`;
  return {
    report,
    files: files.concat([
      { path: 'MVP_BRIEF.md', content: buildMvpBrief(seed, spec) },
      { path: 'AGENTS.md', content: cited(buildAgentReadme(seed, null)) },
      { path: 'ACCEPTANCE.md', content: cited(buildAcceptanceGuide(seed, null)) },
      { path: 'DEPLOYMENT.md', content: cited(buildDeploymentGuide(seed)) },
      {
        path: 'AGENT_DEPLOY.md',
        content: cited(buildAgentDeployGuide({ agentName: seed.title, seedTitle: seed.title, repoName: null }))
      },
      { path: 'AUDIT.md', content: cited(auditMarkdown(report, seed)) }
    ])
  };
}

function save(zip, filename) {
  return zip.generateAsync({ type: 'blob', platform: 'UNIX' }).then((blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  });
}

export async function downloadForgeBundle(entries, brand) {
  const zip = new JSZip();
  const shipped = [];
  const failures = [];

  entries.forEach(({ seed, spec }) => {
    if (!spec) {
      failures.push({ seed: seed.title, reason: 'No competitive teardown yet' });
      return;
    }
    try {
      const { files } = buildForgeFiles(seed, spec, brand);
      const folder = forgeFolder(seed);
      files.forEach((file) => {
        zip.file(`${folder}/${file.path}`, file.content, file.executable ? { unixPermissions: '755' } : undefined);
      });
      shipped.push({ seed, spec, folder });
    } catch (problem) {
      failures.push({ seed: seed.title, reason: problem?.message || 'audit failed' });
    }
  });

  if (!shipped.length) return { shipped, failures, filename: '' };

  zip.file('GOLD_STANDARD_INDEX.md', buildPortfolioIndex(shipped));
  const filename = `investarch-gold-mvps-${new Date().toISOString().slice(0, 10)}.zip`;
  await save(zip, filename);
  return { shipped, failures, filename };
}