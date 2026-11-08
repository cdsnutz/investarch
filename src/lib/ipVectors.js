// Hunt scopes offered on the IP Factory page. Ids must match the presets in
// base44/shared/ipVectors.ts, which resolves them into full market briefs.
export const HUNT_PRESETS = [
  { id: 'all', label: 'All markets', blurb: 'Every vector' },
  { id: 'frontier', label: 'Frontier tech', blurb: 'Agents, dev tools, compute, robotics, chips' },
  { id: 'viral', label: 'Viral & consumer', blurb: 'Breakouts, creators, growth' },
  { id: 'software', label: 'Software & data', blurb: 'Dev infra, security, applied AI, business tooling' },
  { id: 'regulated', label: 'Regulated & money', blurb: 'Finance, insurance, legal, health, payments' },
  { id: 'physical', label: 'Physical economy', blurb: 'Logistics, industry, energy, trades, fleets' },
  { id: 'commerce', label: 'Commerce & property', blurb: 'Retail, marketplaces, media, travel, property' },
  { id: 'people', label: 'People & wellness', blurb: 'HR, payroll, education, health, care, sport' },
  { id: 'public', label: 'Public & institutional', blurb: 'Gov, education, nonprofits, defense, civic' },
  { id: 'health', label: 'Health & life sciences', blurb: 'Clinical, pharma, labs, devices, pharmacy' },
  { id: 'money', label: 'Money & legal', blurb: 'Banking, capital, payments, tax, digital assets' },
  { id: 'industry', label: 'Industry & resources', blurb: 'Plant, energy, chemicals, mining, water, waste' },
  { id: 'mobility', label: 'Transport & mobility', blurb: 'Fleets, freight, aviation, maritime, rail' },
  { id: 'culture', label: 'Media & culture', blurb: 'Film, music, news, games, museums, events' },
  { id: 'build', label: 'Built environment', blurb: 'Construction, design, survey, facilities, property' }
];