// Live search evidence, shared by every function that reads public sources. One place decides the
// timeout, the freshness window, the per-key cap and the concurrency, so buyer research and the
// MVP forge read the web the same way.

const DEFAULT_TIMEOUT_MS = 12000;
const DEFAULT_RESULTS = 5;

export const clean = (value: unknown) => String(value ?? '').trim();

export const linkKey = (url: string) =>
  clean(url).toLowerCase().replace(/#.*$/, '').replace(/\/+$/, '').split('?')[0];

export type Evidence = { title: string; link: string; snippet: string; date: string };

export type SearchOptions = {
  results?: number;
  timeoutMs?: number;
  fresh?: boolean;
  perKeyCap?: number;
  parallel?: number;
};

export async function serpSearch(query: string, apiKey: string, options: SearchOptions = {}): Promise<Evidence[]> {
  const url = new URL('https://serpapi.com/search.json');
  url.searchParams.set('engine', 'google');
  url.searchParams.set('q', query);
  url.searchParams.set('num', String(options.results ?? DEFAULT_RESULTS));
  if (options.fresh !== false) url.searchParams.set('tbs', 'qdr:y');
  url.searchParams.set('api_key', apiKey);

  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS) });
  if (!res.ok) throw new Error(`SERP API ${res.status}`);
  const data = await res.json();
  const rows = Array.isArray(data?.organic_results) ? data.organic_results : [];
  return rows
    .map((row: any) => ({
      title: clean(row?.title),
      link: clean(row?.link),
      snippet: clean(row?.snippet),
      date: clean(row?.date)
    }))
    .filter((row: Evidence) => /^https?:\/\/\S+\.\S+/i.test(row.link));
}

// Runs the queries in small parallel batches and groups the results by the key that asked for them.
export async function gatherEvidence(
  jobs: { key: string; query: string }[],
  apiKey: string,
  options: SearchOptions = {}
): Promise<Map<string, Evidence[]>> {
  const parallel = options.parallel ?? 4;
  const perKeyCap = options.perKeyCap ?? 10;
  const evidence = new Map<string, Evidence[]>();
  const seen = new Set<string>();

  for (let index = 0; index < jobs.length; index += parallel) {
    const batch = jobs.slice(index, index + parallel);
    const settled = await Promise.allSettled(batch.map((job) => serpSearch(job.query, apiKey, options)));
    settled.forEach((result, offset) => {
      const key = batch[offset].key;
      const list = evidence.get(key) || [];
      if (result.status === 'rejected') {
        console.error('[search] serp failed', batch[offset].query, (result.reason as any)?.message);
        evidence.set(key, list);
        return;
      }
      result.value.forEach((row) => {
        const dedupe = `${key}:${linkKey(row.link)}`;
        if (seen.has(dedupe)) return;
        seen.add(dedupe);
        list.push(row);
      });
      evidence.set(key, list.slice(0, perKeyCap));
    });
  }

  return evidence;
}