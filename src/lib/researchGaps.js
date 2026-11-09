// Which seeds still lack the buyer evidence a build decision needs, ranked by what is cheapest to
// close next. A named buyer with no profile on file is the most direct manual research step;
// a profile graded thin or likely still needs a page that supports it; a seed with no buyers named
// at all needs a lead sweep before any research can begin.

const text = (value) => String(value ?? '').trim();
const key = (value) => text(value).toLowerCase();

export const GAP_RANK = { unresearched: 0, partial: 1, no_buyers: 2, verified: 3 };

const plural = (count, one, many = `${one}s`) => `${count} ${count === 1 ? one : many}`;

function uniqueNames(leads) {
  const names = [];
  (leads || []).forEach((lead) => {
    const company = text(lead?.company);
    if (company && !names.some((name) => key(name) === key(company))) names.push(company);
  });
  return names;
}

export function computeResearchGaps({ seeds = [], research = [] }) {
  const byCompany = new Map();
  (research || []).forEach((row) => {
    [row?.company, row?.company_name].forEach((name) => {
      if (key(name) && !byCompany.has(key(name))) byCompany.set(key(name), row);
    });
  });

  const rows = [];
  const unreadBuyers = new Set();

  (seeds || []).forEach((seed) => {
    // Ecosystems are combinations of seeds already counted; research them through their sources.
    if ((seed.source_seed_ids || []).length || seed.source_channel === 'seed mix') return;

    const named = uniqueNames(seed.buyer_leads);
    const onFile = new Map();
    named.forEach((company) => {
      const row = byCompany.get(key(company));
      if (row) onFile.set(key(company), row);
      else unreadBuyers.add(key(company));
    });
    (research || []).forEach((row) => {
      if ((row.seed_ids || []).includes(seed.id)) {
        const id = key(row.company_name || row.company) || row.id;
        if (id) onFile.set(id, row);
      }
    });

    const profiles = Array.from(onFile.values());
    const verified = profiles.filter((row) => row.confidence === 'verified').length;
    const likely = profiles.filter((row) => row.confidence === 'likely').length;
    const thin = profiles.length - verified - likely;
    const missing = named.filter((company) => !byCompany.has(key(company)));

    // A seed is only clear when every buyer it names has been read and at least one read is
    // verified; a verified profile does not cover the named buyers still unread beside it.
    const status = !named.length
      ? 'no_buyers'
      : !profiles.length
        ? 'unresearched'
        : verified && !missing.length
          ? 'verified'
          : 'partial';

    const nextStep = status === 'unresearched' || missing.length
      ? `Read public sources for ${plural(missing.length, 'named buyer', 'named buyers')}`
      : status === 'partial'
        ? `Strengthen ${plural(profiles.length, 'profile')} to a verified read`
        : status === 'no_buyers'
          ? 'Name buyers first: run a buyer-lead sweep'
          : 'Evidence complete';

    rows.push({
      id: seed.id,
      title: text(seed.title) || 'Untitled seed',
      strategy: text(seed.strategy) || 'hold',
      status,
      named: named.length,
      researched: profiles.length,
      verified,
      likely,
      thin,
      missing,
      missingCount: missing.length,
      nextStep
    });
  });

  const ordered = rows.sort((a, b) => GAP_RANK[a.status] - GAP_RANK[b.status]
    || b.missingCount - a.missingCount
    || b.named - a.named
    || a.title.localeCompare(b.title));

  const count = (status) => ordered.filter((row) => row.status === status).length;

  return {
    rows: ordered,
    totals: {
      seeds: ordered.length,
      verified: count('verified'),
      unresearched: count('unresearched'),
      partial: count('partial'),
      noBuyers: count('no_buyers'),
      open: ordered.filter((row) => row.status !== 'verified').length,
      unreadBuyers: unreadBuyers.size,
      progress: ordered.length ? Math.round((count('verified') / ordered.length) * 100) : 0
    }
  };
}