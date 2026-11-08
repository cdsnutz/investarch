// Every codebase is verified before it is written into a ZIP. A kit that fails any of the
// three passes is never packaged: the export throws with the report attached.
import JSZip from 'jszip';
import { buildKitFiles } from '@/lib/buildKit';
import { buildAgentReadme, buildAcceptanceGuide, buildDeploymentGuide } from '@/lib/agentDocs';
import { buildAgentDeployGuide } from '@/lib/agentDeploy';
import { appSlug } from '@/lib/scaffoldKit';
import { entityModel } from '@/lib/kit/model';
import { normalizeBrand } from '@/lib/kit/brand';
import { auditKit, auditMarkdown } from '@/lib/kit/audit';

export const folderFor = (seed) => appSlug(seed);

export function auditSeed(seed, brand, codebase) {
  const files = buildKitFiles(seed, codebase, brand);
  const report = auditKit(files, {
    entities: entityModel(seed),
    brand: normalizeBrand(brand, seed)
  });
  return { files, report };
}

function verified(seed, brand, codebase) {
  const { files, report } = auditSeed(seed, brand, codebase);
  if (!report.ok) {
    const first = report.errors[0];
    const problem = new Error(
      `${seed?.title || 'This codebase'} failed verification with ${report.errors.length} error${
        report.errors.length === 1 ? '' : 's'
      }. ${first.file}: ${first.message}`
    );
    problem.report = report;
    problem.seed = seed?.title || '';
    throw problem;
  }
  return {
    files: files.concat([{ path: 'AUDIT.md', content: auditMarkdown(report, seed) }]),
    report
  };
}

function addSeed(zip, seed, { brand, codebase, root = '' } = {}) {
  const base = root ? `${root}/` : '';
  const { files, report } = verified(seed, brand, codebase);

  files.forEach((file) => {
    zip.file(base + file.path, file.content, file.executable ? { unixPermissions: '755' } : undefined);
  });
  zip.file(base + 'AGENTS.md', buildAgentReadme(seed, codebase));
  zip.file(base + 'ACCEPTANCE.md', buildAcceptanceGuide(seed, codebase));
  zip.file(base + 'DEPLOYMENT.md', buildDeploymentGuide(seed));
  zip.file(
    base + 'AGENT_DEPLOY.md',
    buildAgentDeployGuide({
      agentName: seed.title,
      seedTitle: seed.title,
      repoName: codebase?.repo_name
    })
  );

  return report;
}

async function save(zip, filename) {
  const blob = await zip.generateAsync({ type: 'blob', platform: 'UNIX' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export async function downloadSeedCodebase(seed, brand, codebase) {
  const zip = new JSZip();
  const report = addSeed(zip, seed, { brand, codebase });
  await save(zip, `${folderFor(seed)}.zip`);
  return {
    codebases: 1,
    files: report.files + 4,
    errors: 0,
    warnings: report.warnings.length,
    passes: report.passes
  };
}

export async function downloadCodebaseBundle(seeds, brand, onProgress) {
  const zip = new JSZip();
  let files = 0;
  let warnings = 0;
  const passes = { 1: 0, 2: 0, 3: 0 };

  for (let index = 0; index < seeds.length; index += 1) {
    const seed = seeds[index];
    onProgress?.(index + 1, seeds.length, seed.title);
    const report = addSeed(zip, seed, { brand, root: folderFor(seed) });
    files += report.files + 4;
    warnings += report.warnings.length;
    for (const pass of report.passes) passes[pass.id] += pass.errors;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  const stamp = new Date().toISOString().slice(0, 10);
  await save(zip, `investarch-codebases-${stamp}.zip`);

  return {
    codebases: seeds.length,
    files,
    errors: Object.values(passes).reduce((sum, value) => sum + value, 0),
    warnings,
    passes
  };
}