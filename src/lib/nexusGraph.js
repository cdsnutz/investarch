// Builds the Entity Nexus graph: dossiers, competitors, capital claims and
// archetypes, infers links between them from shared market terms, and derives a
// funding-readiness index per dossier from what is actually connected to it.

const STOPWORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'from', 'into', 'your', 'their', 'have', 'will', 'are', 'not',
  'but', 'all', 'can', 'our', 'its', 'was', 'has', 'who', 'how', 'why', 'what', 'when', 'more', 'most', 'than',
  'them', 'they', 'been', 'being', 'because', 'there', 'these', 'those', 'which', 'while', 'about', 'over',
  'under', 'after', 'before', 'around', 'across', 'within', 'without', 'every', 'each', 'also', 'just', 'very',
  'such', 'then', 'too', 'only', 'own', 'same', 'some', 'much', 'many', 'other', 'where', 'would', 'could',
  'should', 'does', 'were', 'been', 'onto', 'upon', 'through', 'between', 'against'
]);

const tokenize = (value) => String(value || '')
  .toLowerCase()
  .replace(/[^a-z0-9\s]/g, ' ')
  .split(/\s+/)
  .filter((t) => t.length > 3 && !STOPWORDS.has(t));

const termsOf = (values) => {
  const set = new Set();
  values.filter(Boolean).forEach((v) => tokenize(v).forEach((t) => set.add(t)));
  return set;
};

const sharedTerm = (a, b) => {
  if (!a || !b) return null;
  for (const t of a) if (b.has(t)) return t;
  return null;
};

// How much capital momentum a claim represents, by its outreach stage.
const OUTREACH_WEIGHT = {
  not_contacted: 3,
  contacted: 6,
  replied: 9,
  negotiating: 13,
  closed: 18
};

export const BAND_LABEL = {
  'capital-ready': 'Capital ready',
  advancing: 'Advancing',
  thin: 'Thin',
  early: 'Early'
};

export const EDGE_LABEL = {
  competition: 'Direct competition',
  funding: 'Capital claim',
  influence: 'Archetype influence',
  market: 'Shared market'
};

export function buildNexus({ projects = [], competitors = [], funding = [], archetypes = [] } = {}) {
  const projectById = new Map(projects.map((p) => [p.id, p]));

  const projTerms = new Map(projects.map((p) => [p.id, termsOf([p.company_name, p.industry, ...(p.tags || [])])]));
  const compTerms = new Map();
  competitors.forEach((c) => {
    const owner = projectById.get(c.project_id);
    compTerms.set(c.id, termsOf([c.name, owner?.industry, ...(owner?.tags || [])]));
  });
  const fundTerms = new Map(funding.map((f) => [f.id, termsOf([f.name, f.focus_area, f.type])]));
  const archTerms = new Map(archetypes.map((a) => [a.id, termsOf([a.archetype_name, a.population_segment, a.imprint_thesis, ...(a.channels || [])])]));

  const nodes = [
    ...projects.map((p) => ({ id: p.id, type: 'dossier', label: p.company_name || 'Untitled dossier', sub: p.industry || p.status || 'dossier' })),
    ...competitors.map((c) => ({ id: c.id, type: 'competitor', label: c.name || 'Competitor', sub: c.overall_score != null ? `index ${c.overall_score}` : 'competitor', projectId: c.project_id })),
    ...funding.map((f) => ({ id: f.id, type: 'funding', label: f.name || 'Capital source', sub: [f.type, (f.outreach_status || '').replace(/_/g, ' ')].filter(Boolean).join(' · ') || 'capital claim', projectId: f.project_id })),
    ...archetypes.map((a) => ({ id: a.id, type: 'archetype', label: a.archetype_name || 'Archetype', sub: a.imprint_depth_pct != null ? `${a.imprint_depth_pct}% imprint` : (a.status || 'archetype') }))
  ];

  const edges = [];
  const seen = new Set();
  const push = (source, target, kind, via) => {
    if (!source || !target || source === target) return false;
    const key = `${kind}:${source}:${target}`;
    if (seen.has(key)) return false;
    seen.add(key);
    edges.push({ source, target, kind, via: via || null });
    return true;
  };

  // Structural links: what each record is officially attached to.
  competitors.forEach((c) => { if (projectById.has(c.project_id)) push(c.id, c.project_id, 'competition'); });
  funding.forEach((f) => { if (projectById.has(f.project_id)) push(f.id, f.project_id, 'funding'); });

  // Archetype influence: an archetype reaches a dossier, rival or capital claim
  // when they share the market vocabulary the imprint was written for.
  const archToDossier = new Map();
  const archToRival = new Map();
  const archToClaim = new Map();
  const bump = (map, key) => map.set(key, (map.get(key) || 0) + 1);

  archetypes.forEach((a) => {
    const at = archTerms.get(a.id);
    projects.forEach((p) => {
      if ((archToDossier.get(a.id) || 0) >= 6) return;
      const via = sharedTerm(at, projTerms.get(p.id));
      if (via && push(a.id, p.id, 'influence', via)) bump(archToDossier, a.id);
    });
    competitors.forEach((c) => {
      if ((archToRival.get(a.id) || 0) >= 4) return;
      const via = sharedTerm(at, compTerms.get(c.id));
      if (via && push(a.id, c.id, 'influence', via)) bump(archToRival, a.id);
    });
    funding.forEach((f) => {
      if ((archToClaim.get(a.id) || 0) >= 4) return;
      const via = sharedTerm(at, fundTerms.get(f.id));
      if (via && push(a.id, f.id, 'influence', via)) bump(archToClaim, a.id);
    });
  });

  // Shared-market links across the whole network.
  projects.forEach((p) => {
    const pt = projTerms.get(p.id) || new Set();
    projects.forEach((q) => {
      if (q.id >= p.id) return;
      const qt = projTerms.get(q.id) || new Set();
      const via = sharedTerm(pt, qt);
      if (via) push(p.id, q.id, 'market', via);
    });
  });

  let fundingMarket = 0;
  funding.forEach((f) => {
    if (fundingMarket >= 30) return;
    const ft = fundTerms.get(f.id) || new Set();
    projects.forEach((p) => {
      if (fundingMarket >= 30 || f.project_id === p.id) return;
      const via = sharedTerm(ft, projTerms.get(p.id));
      if (via && push(f.id, p.id, 'market', via)) fundingMarket++;
    });
  });

  let rivalMarket = 0;
  competitors.forEach((c) => {
    if (rivalMarket >= 30) return;
    const own = c.project_id;
    const ct = compTerms.get(c.id) || new Set();
    projects.forEach((p) => {
      if (rivalMarket >= 30 || p.id === own) return;
      const via = sharedTerm(ct, projTerms.get(p.id));
      if (via && push(c.id, p.id, 'market', via)) rivalMarket++;
    });
  });

  // Readiness: derived only from what is connected to each dossier.
  const fundingById = new Map(funding.map((f) => [f.id, f]));
  const compById = new Map(competitors.map((c) => [c.id, c]));
  const archetypeIds = new Set(archetypes.map((a) => a.id));

  const claimsByProject = new Map();
  const rivalsByProject = new Map();
  const archesByProject = new Map();
  const peersByProject = new Map();
  const add = (map, key, value) => {
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(value);
  };

  edges.forEach((e) => {
    if (e.kind === 'funding' && projectById.has(e.target)) add(claimsByProject, e.target, e.source);
    if (e.kind === 'competition' && projectById.has(e.target)) add(rivalsByProject, e.target, e.source);
    if (e.kind === 'influence') {
      const projectId = projectById.has(e.source) ? e.source : projectById.has(e.target) ? e.target : null;
      const archId = archetypeIds.has(e.source) ? e.source : archetypeIds.has(e.target) ? e.target : null;
      if (projectId && archId) add(archesByProject, projectId, archId);
    }
    if (e.kind === 'market' && projectById.has(e.source) && projectById.has(e.target)) {
      add(peersByProject, e.source, e.target);
      add(peersByProject, e.target, e.source);
    }
  });

  const readiness = {};
  projects.forEach((p) => {
    const evidence = Math.round((p.scan_score ?? 0) * 0.4);

    const claims = (claimsByProject.get(p.id) || []).map((id) => fundingById.get(id)).filter(Boolean);
    const capitalValue = claims.reduce((sum, f) => sum + (OUTREACH_WEIGHT[f.outreach_status] ?? 3), 0);
    const capital = Math.min(30, capitalValue);

    const arches = [...new Set(archesByProject.get(p.id) || [])];
    const archetypePull = Math.min(18, arches.length * 6);

    const rivals = (rivalsByProject.get(p.id) || []).map((id) => compById.get(id)).filter(Boolean);
    const competition = Math.min(20, Math.round(rivals.reduce((sum, c) => sum + ((c.overall_score ?? 5) / 10) * 4, 0)));

    const peers = new Set(peersByProject.get(p.id) || []);
    const overlap = Math.min(9, peers.size * 3);

    const score = Math.max(0, Math.min(100, evidence + capital + archetypePull - competition - overlap));
    readiness[p.id] = {
      score,
      band: score >= 70 ? 'capital-ready' : score >= 50 ? 'advancing' : score >= 30 ? 'thin' : 'early',
      counts: { claims: claims.length, archetypes: arches.length, rivals: rivals.length, peers: peers.size },
      components: [
        { key: 'evidence', label: 'Dossier evidence', value: evidence, max: 40, note: p.scan_score != null ? `scan ${p.scan_score}/100 × 0.4` : 'no scan recorded yet' },
        { key: 'capital', label: 'Capital claims in motion', value: capital, max: 30, note: claims.length ? `${claims.length} claim${claims.length === 1 ? '' : 's'} linked, weighted by outreach stage` : 'nothing linked yet' },
        { key: 'archetype', label: 'Archetype pull', value: archetypePull, max: 18, note: arches.length ? `${arches.length} aligned archetype${arches.length === 1 ? '' : 's'}` : 'no archetype shares this market' },
        { key: 'competition', label: 'Competitive pressure', value: -competition, max: 20, note: rivals.length ? `${rivals.length} mapped rival${rivals.length === 1 ? '' : 's'}` : 'no rival mapped' },
        { key: 'overlap', label: 'Sibling market overlap', value: -overlap, max: 9, note: peers.size ? `${peers.size} dossier${peers.size === 1 ? '' : 's'} in the same market` : 'no sibling overlap' }
      ]
    };
  });

  return { nodes, edges, readiness };
}