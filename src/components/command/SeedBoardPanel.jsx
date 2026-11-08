import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import Panel from '@/components/command/Panel';
import SeedCard from '@/components/command/SeedCard';
import { SEED_BANDS, scoreSeed } from '@/lib/seedReadiness';

export default function SeedBoardPanel({ refreshKey }) {
  const [board, setBoard] = useState(null);

  const load = useCallback(async () => {
    const [seedPage, filingPage, prospectusPage, activeTotal] = await Promise.all([
      base44.entities.IpSeed.filter({ status: 'seed' }, { sort: '-created_date', limit: 200 }),
      base44.entities.IpFiling.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.IpProspectus.filter({}, { sort: '-created_date', limit: 300 }),
      base44.entities.IpSeed.count({ status: 'seed' })
    ]);
    const filingsBySeed = {};
    (filingPage.items || []).forEach((f) => {
      (filingsBySeed[f.seed_id] = filingsBySeed[f.seed_id] || []).push(f);
    });
    const prospectusSeeds = new Set((prospectusPage.items || []).map((p) => p.seed_id));

    const scored = (seedPage.items || []).map((seed) => {
      const filings = filingsBySeed[seed.id] || [];
      const hasProspectus = prospectusSeeds.has(seed.id);
      return { seed, filings, hasProspectus, ...scoreSeed(seed, filings, hasProspectus ? { present: true } : null) };
    });

    const columns = SEED_BANDS.map((band) => ({
      ...band,
      cards: scored
        .filter((row) => row.band === band.id)
        .sort((a, b) => b.score - a.score || String(a.seed.title).localeCompare(String(b.seed.title)))
    }));

    setBoard({ columns, total: scored.length, activeTotal });
  }, []);

  useEffect(() => {
    load().catch(() => setBoard({ columns: [], total: 0, activeTotal: 0 }));
  }, [load, refreshKey]);

  const average = board?.total
    ? Math.round(
      board.columns.reduce((sum, col) => sum + col.cards.reduce((s, c) => s + c.score, 0), 0) /
      board.total
    )
    : 0;

  return (
    <Panel
      code="K"
      title="Active IP Seeds"
      action={(
        <span className="text-xs text-muted-foreground">
          {board ? `${board.activeTotal} active${board.total ? ` · avg readiness ${average}` : ''}` : 'loading…'}
        </span>
      )}
    >
      {!board ? (
        <p className="text-xs text-muted-foreground">Loading the seed board…</p>
      ) : board.total === 0 ? (
        <p className="text-xs text-muted-foreground">No active seeds. Run the hunt in the IP Factory to populate the board.</p>
      ) : (
        <>
          {board.activeTotal > board.total && (
            <p className="text-[11px] text-muted-foreground mb-2">
              Showing the {board.total} most recent seeds, ranked by readiness inside each column.
            </p>
          )}
          <div className="-mx-1 overflow-x-auto pb-1">
            <div className="flex gap-3 px-1 min-w-max lg:min-w-0 lg:grid lg:grid-cols-4">
              {board.columns.map((col) => (
                <div key={col.id} className="w-[232px] shrink-0 lg:w-auto border border-border bg-paper/60">
                  <div className="flex items-baseline justify-between gap-2 border-b border-border px-3 py-2">
                    <span className="text-[10px] uppercase tracking-[0.12em] text-foreground">{col.label}</span>
                    <span className="font-mono text-[11px] text-muted-foreground tabular-nums">{col.cards.length}</span>
                  </div>
                  <div className="p-2 space-y-2 max-h-[520px] overflow-y-auto">
                    {col.cards.length === 0 ? (
                      <p className="text-[11px] text-muted-foreground px-1 py-3 leading-relaxed">{col.blurb}.</p>
                    ) : (
                      col.cards.map((row) => (
                        <SeedCard
                          key={row.seed.id}
                          seed={row.seed}
                          score={row.score}
                          filings={row.filings.length}
                          hasProspectus={row.hasProspectus}
                        />
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </Panel>
  );
}