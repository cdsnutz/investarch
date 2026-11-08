// Readiness for an IP seed, derived only from what is actually stored against it:
// the asymmetry score the hunter issued, how complete the record is, whether a
// build blueprint exists, and whether the Registrar has produced legal paper and
// a liquidation path. No score is invented beyond those five inputs.

const REQUIRED_FIELDS = ['title', 'gap', 'solution', 'mini_plan', 'pain_signal', 'source_channel'];

export const SEED_BANDS = [
  { id: 'deployable', label: 'Deployable', min: 80, blurb: 'paper in place, buyer path named' },
  { id: 'advancing', label: 'Advancing', min: 60, blurb: 'blueprint set, legal thin' },
  { id: 'forming', label: 'Forming', min: 40, blurb: 'thesis holds, packet incomplete' },
  { id: 'latent', label: 'Latent', min: 0, blurb: 'record needs finishing' }
];

export const bandOf = (score) =>
  SEED_BANDS.find((b) => score >= b.min) || SEED_BANDS[SEED_BANDS.length - 1];

export function scoreSeed(seed, filings = [], prospectus = null) {
  const rawAsym = typeof seed?.asymmetric_score === 'number' ? seed.asymmetric_score : 0;
  const asymmetry = Math.round(Math.max(0, Math.min(10, rawAsym)) * 3);

  const present = REQUIRED_FIELDS.filter((key) => String(seed?.[key] || '').trim());
  const completeness = Math.round((present.length / REQUIRED_FIELDS.length) * 25);

  const bp = seed?.blueprint || {};
  const bpParts = [
    Array.isArray(bp.tech_stack) && bp.tech_stack.length > 0,
    String(bp.db_schema || '').trim().length > 0,
    String(bp.core_logic || '').trim().length > 0
  ].filter(Boolean);
  const blueprint = Math.round((bpParts.length / 3) * 20);

  const legal = Math.min(15, filings.length * 5);
  const exit = prospectus ? 10 : 0;

  const score = Math.max(0, Math.min(100, asymmetry + completeness + blueprint + legal + exit));
  const band = bandOf(score);

  return {
    score,
    band: band.id,
    bandLabel: band.label,
    components: [
      { key: 'asymmetry', label: 'Asymmetry', value: asymmetry, max: 30 },
      { key: 'completeness', label: 'Record completeness', value: completeness, max: 25 },
      { key: 'blueprint', label: 'Build blueprint', value: blueprint, max: 20 },
      { key: 'legal', label: 'Legal paper', value: legal, max: 15 },
      { key: 'exit', label: 'Liquidation path', value: exit, max: 10 }
    ]
  };
}