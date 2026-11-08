// Maps how IP seeds share a buyer base or a market vector, so the seeds that
// could go to one investor, acquirer or thesis together surface as a syndicate.
// Every link comes from a stored record: named prospectus targets, drafted
// buyer leads, or the vocabulary of a MarketVector — nothing is invented.

const STOP = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'their', 'have', 'been', 'will', 'which',
  'while', 'about', 'across', 'within', 'without', 'more', 'most', 'than', 'other', 'each', 'every', 'also',
  'such', 'system', 'systems', 'software', 'service', 'services', 'solution', 'solutions', 'company',
  'companies', 'market', 'markets', 'platform', 'platforms', 'tool', 'tools', 'based', 'using', 'layer', 'layers'
]);

const tokens = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter((t) => t.length > 3 && !STOP.has(t));

export function companyKey(name) {
  return String(name || '')
    .toLowerCase()
    .replace(/\([^)]*\)/g, ' ')
    .replace(/\b(inc|incorporated|ltd|limited|corp|corporation|llc|plc|group|holdings|holding|company|co|com|international|global|systems|technologies|technology|software|labs)\b/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function displayName(name) {
  return String(name || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[,\s]+(inc|ltd|limited|corp|corporation|llc|plc|holdings?)\.?$/i, '')
    .replace(/\s+/g, ' ')
    .replace(/[,\s]+$/, '')
    .trim();
}

export function buildSyndicates({ seeds = [], vectors = [], prospectuses = [], funding = [] } = {}) {
  const seedById = new Map(seeds.map((s) => [s.id, s]));

  // The operator's own investor base: every funder recorded on a dossier.
  const baseNames = new Map();
  funding.forEach((f) => {
    const key = companyKey(f?.name);
    if (key.length >= 3 && !baseNames.has(key)) baseNames.set(key, displayName(f.name) || String(f.name));
  });

  // Investor base: every company named as a target on a prospectus, or drafted
  // as a buyer lead, keyed so "Salesforce, Inc." and "Salesforce.com Inc." agree.
  const byBuyer = new Map();
  const addBuyer = (name, seedId) => {
    const key = companyKey(name);
    if (key.length < 3 || !seedById.has(seedId)) return;
    const entry = byBuyer.get(key) || { label: displayName(name) || String(name), seeds: new Set() };
    entry.seeds.add(seedId);
    byBuyer.set(key, entry);
  };
  seeds.forEach((seed) => (seed.buyer_leads || []).forEach((lead) => addBuyer(lead?.company, seed.id)));
  prospectuses.forEach((p) => (p.targets || []).forEach((t) => addBuyer(t?.name, p.seed_id)));

  // Market vector: a seed belongs to a vector when its own thesis shares at
  // least two distinctive terms with the vector's name and sector.
  const seedTerms = new Map(seeds.map((s) => [s.id, new Set(tokens([
    s.title, s.gap, s.solution, s.pain_signal, s.source_channel, s.ecosystem_interlocks, s.mix_thesis
  ].join(' ')))]))

  const byVector = new Map();
  vectors.forEach((vector) => {
    const vt = new Set(tokens([vector.vector_name, vector.sector].join(' ')));
    const hits = [];
    seedTerms.forEach((st, seedId) => {
      let shared = 0;
      vt.forEach((t) => { if (st.has(t)) shared += 1; });
      if (shared >= 2) hits.push({ seedId, shared });
    });
    const best = hits.sort((a, b) => b.shared - a.shared).slice(0, 12);
    if (best.length >= 2) {
      byVector.set(vector.id, {
        label: vector.vector_name,
        sector: vector.sector,
        seeds: new Set(best.map((h) => h.seedId))
      });
    }
  });

  const toCluster = (kind, id, label, sub, seedIds) => {
    const members = [...seedIds]
      .map((sid) => seedById.get(sid))
      .filter(Boolean)
      .map((s) => ({
        id: s.id,
        title: s.title || 'Untitled seed',
        asym: typeof s.asymmetric_score === 'number' ? s.asymmetric_score : 0,
        strategy: s.strategy || 'hold'
      }))
      .sort((a, b) => b.asym - a.asym);
    const total = members.reduce((sum, s) => sum + s.asym, 0);
    return {
      id: `${kind}:${id}`,
      kind,
      label,
      sub,
      seeds: members,
      count: members.length,
      combinedAsym: Math.round(total * 10) / 10,
      avgAsym: members.length ? Math.round((total / members.length) * 10) / 10 : 0
    };
  };

  const buyers = [...byBuyer]
    .map(([key, entry]) => ({
      ...toCluster('buyer', key, entry.label, 'shared investor base', entry.seeds),
      owned: baseNames.has(key)
    }))
    .sort((a, b) => b.count - a.count || b.avgAsym - a.avgAsym || a.label.localeCompare(b.label));

  const clusters = [];
  buyers.filter((c) => c.count >= 2).forEach((c) => clusters.push(c));
  byVector.forEach((entry, id) => {
    if (entry.seeds.size >= 2) clusters.push(toCluster('vector', id, entry.label, entry.sector || 'shared market vector', entry.seeds));
  });

  clusters.sort((a, b) => b.count - a.count || b.avgAsym - a.avgAsym || a.label.localeCompare(b.label));

  const covered = new Set(clusters.flatMap((c) => c.seeds.map((s) => s.id)));
  return {
    clusters,
    buyers,
    investorBase: [...baseNames]
      .map(([key, label]) => ({ key, label, seeds: byBuyer.get(key)?.seeds.size || 0 }))
      .sort((a, b) => b.seeds - a.seeds || a.label.localeCompare(b.label)),
    coveredSeeds: covered.size,
    buyerClusters: clusters.filter((c) => c.kind === 'buyer').length,
    vectorClusters: clusters.filter((c) => c.kind === 'vector').length
  };
}