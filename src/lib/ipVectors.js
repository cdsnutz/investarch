// Hunt scopes offered on the IP Factory page. Ids must match the presets in
// base44/shared/ipVectors.ts, which resolves them into full market briefs.
export const HUNT_PRESETS = [
  { id: 'all', label: 'All markets', blurb: 'Every vector' },
  { id: 'frontier', label: 'Frontier tech', blurb: 'Agents, dev tools, compute, robotics' },
  { id: 'viral', label: 'Viral & consumer', blurb: 'Breakouts, creators, growth' },
  { id: 'software', label: 'Software & data', blurb: 'Dev infra, security, applied AI' },
  { id: 'regulated', label: 'Regulated & money', blurb: 'Finance, insurance, legal, health' },
  { id: 'physical', label: 'Physical economy', blurb: 'Logistics, industry, energy, trades, fleets' },
  { id: 'commerce', label: 'Commerce & property', blurb: 'Retail, marketplaces, media, travel, property' },
  { id: 'people', label: 'People & wellness', blurb: 'HR, payroll, education, health, sport' },
  { id: 'public', label: 'Public & institutional', blurb: 'Gov, education, nonprofits, defense' }
];