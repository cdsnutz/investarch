// Hunt scopes offered on the IP Factory page. Ids must match the presets in
// base44/shared/ipVectors.ts, which resolves them into full market briefs.
export const HUNT_PRESETS = [
  { id: 'all', label: 'All markets', blurb: 'Every vector' },
  { id: 'regulated', label: 'Regulated & money', blurb: 'Finance, insurance, legal, health' },
  { id: 'physical', label: 'Physical economy', blurb: 'Logistics, industry, energy, trades' },
  { id: 'public', label: 'Public & institutional', blurb: 'Gov, education, nonprofits' },
  { id: 'software', label: 'Software & data', blurb: 'Dev infra, security, applied AI' }
];