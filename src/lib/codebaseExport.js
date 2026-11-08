import JSZip from 'jszip';
import { buildKitFiles } from '@/lib/buildKit';
import { buildAgentReadme, buildAcceptanceGuide, buildDeploymentGuide } from '@/lib/agentDocs';
import { buildAgentDeployGuide } from '@/lib/agentDeploy';
import { appSlug } from '@/lib/scaffoldKit';

export const folderFor = (seed) => appSlug(seed);

function addSeed(zip, seed, { brand, codebase, root = '' } = {}) {
  const base = root ? `${root}/` : '';
  buildKitFiles(seed, codebase, brand).forEach((file) => {
    zip.file(base + file.path, file.content, file.executable ? { unixPermissions: '755' } : undefined);
  });
  zip.file(base + 'AGENTS.md', buildAgentReadme(seed, codebase));
  zip.file(base + 'ACCEPTANCE.md', buildAcceptanceGuide(seed, codebase));
  zip.file(base + 'DEPLOYMENT.md', buildDeploymentGuide(seed));
  zip.file(base + 'AGENT_DEPLOY.md', buildAgentDeployGuide({
    agentName: seed.title,
    seedTitle: seed.title,
    repoName: codebase?.repo_name
  }));
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

export function downloadSeedCodebase(seed, brand, codebase) {
  const zip = new JSZip();
  addSeed(zip, seed, { brand, codebase });
  return save(zip, `${folderFor(seed)}.zip`);
}

export async function downloadCodebaseBundle(seeds, brand, onProgress) {
  const zip = new JSZip();
  for (let index = 0; index < seeds.length; index += 1) {
    addSeed(zip, seeds[index], { brand, root: folderFor(seeds[index]) });
    onProgress?.(index + 1, seeds.length);
  }
  const stamp = new Date().toISOString().slice(0, 10);
  return save(zip, `investarch-codebases-${stamp}.zip`);
}