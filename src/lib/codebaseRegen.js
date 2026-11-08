// Rebuilds every seed's codebase in a single pass. Each blueprint is hardened
// until it clears the release floor, then the generated file set is audited for
// house-rule slop; the copy that produced a finding is patched at the source and
// the codebase is regenerated, so what ships carries no slop.
import { base44 } from '@/api/base44Client';
import { auditSeed } from '@/lib/codebaseExport';
import { slopAudit } from '@/lib/kit/slopAudit';
import { scrub } from '@/lib/noSlop';

export const HARDEN_FLOOR = 83;
const MAX_HARDEN_PASSES = 3;

const COPY_FIELDS = [
  'title',
  'gap',
  'pain_signal',
  'solution',
  'mini_plan',
  'strategy_note',
  'mix_thesis',
  'ecosystem_interlocks',
  'research_brief',
  'funding_playbook',
  'acquisition_playbook',
  'marketing_plan'
];

function copyPatch(seed) {
  const patch = {};
  for (const field of COPY_FIELDS) {
    const value = seed?.[field];
    if (typeof value !== 'string') continue;
    const cleaned = scrub(value);
    if (cleaned && cleaned !== value) patch[field] = cleaned;
  }
  const logic = seed?.blueprint?.core_logic;
  if (typeof logic === 'string') {
    const cleaned = scrub(logic);
    if (cleaned && cleaned !== logic) patch.blueprint = { ...seed.blueprint, core_logic: cleaned };
  }
  return patch;
}

const hasBlueprint = (seed) => Boolean(seed?.blueprint) && /create\s+table/i.test(String(seed.blueprint.db_schema || ''));

export async function regenerateAllCodebases(seeds, { brand, onProgress } = {}) {
  const all = seeds || [];
  const targets = all.filter(hasBlueprint);
  const results = [];

  for (let index = 0; index < targets.length; index += 1) {
    const base = targets[index];
    onProgress?.({ index: index + 1, total: targets.length, title: base.title, phase: 'hardening' });

    let seed = base;
    let score = Number(seed?.hardening_report?.score || 0);
    let passes = 0;
    let hardeningError = '';

    while (score < HARDEN_FLOOR && passes < MAX_HARDEN_PASSES) {
      try {
        const res = await base44.functions.invoke('hardenCodebase', { action: 'seed', seedId: seed.id });
        const row = (res?.data?.results || [])[0];
        passes += 1;
        seed = await base44.entities.IpSeed.get(seed.id);
        score = Number(seed?.hardening_report?.score || 0);
        if (row && row.ok === false) {
          hardeningError = row.error || 'The hardening bench returned no usable report.';
          break;
        }
      } catch (error) {
        hardeningError = error?.response?.data?.error || error?.message || 'Hardening failed.';
        break;
      }
    }

    onProgress?.({ index: index + 1, total: targets.length, title: seed?.title || base.title, phase: 'audit' });

    let built = auditSeed(seed, brand, null);
    let slop = slopAudit(built.files);
    const found = slop.issues.length;

    if (found) {
      const patch = copyPatch(seed);
      if (Object.keys(patch).length) {
        try {
          await base44.entities.IpSeed.update(seed.id, patch);
        } catch (error) {
          // the patch still applies to the in-memory seed, so the rebuild is clean either way
        }
        seed = { ...seed, ...patch };
      }
      built = auditSeed(seed, brand, null);
      slop = slopAudit(built.files);
    }

    results.push({
      id: seed.id,
      title: seed.title,
      score,
      hardened: score >= HARDEN_FLOOR,
      passes,
      slopFound: found,
      slopFixed: Math.max(0, found - slop.issues.length),
      slopLeft: slop.issues.length,
      auditErrors: (built.report.errors || []).length,
      error: hardeningError
    });

    await new Promise((resolve) => setTimeout(resolve, 0));
  }

  return {
    total: targets.length,
    skipped: all.length - targets.length,
    hardened: results.filter((row) => row.hardened).length,
    slopFixed: results.reduce((sum, row) => sum + row.slopFixed, 0),
    slopLeft: results.reduce((sum, row) => sum + row.slopLeft, 0),
    auditErrors: results.reduce((sum, row) => sum + row.auditErrors, 0),
    results
  };
}