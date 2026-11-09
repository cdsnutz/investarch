import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { computeResearchGaps } from '@/lib/researchGaps';

const BADGE = {
  unresearched: 'bg-destructive/10 text-destructive border-transparent',
  partial: 'bg-amber-100 text-amber-800 border-transparent',
  no_buyers: 'bg-muted text-muted-foreground border-transparent'
};

const LABEL = {
  unresearched: 'Unresearched',
  partial: 'Evidence thin',
  no_buyers: 'No buyers named'
};

const SHOWN = 6;

export default function ResearchGapsPanel() {
  const [data, setData] = useState(null);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    Promise.all([
      base44.entities.IpSeed.list({
        sort: '-created_date',
        limit: 300,
        fields: ['title', 'strategy', 'buyer_leads', 'source_seed_ids', 'source_channel']
      }),
      base44.entities.BuyerResearch.list({ sort: '-researched_date', limit: 400 })
    ])
      .then(([seedPage, researchPage]) => setData(computeResearchGaps({
        seeds: seedPage.items || [],
        research: researchPage.items || []
      })))
      .catch(() => setData(computeResearchGaps({})));
  }, []);

  const totals = data?.totals;
  const openAll = (data?.rows || []).filter((row) => row.status !== 'verified');
  const open = expanded ? openAll : openAll.slice(0, SHOWN);

  return (
    <Card className="p-5 rounded-md">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-heading text-lg tracking-tight">Research Gaps</h2>
        <Link to="/ip-factory" className="text-xs text-bottle hover:underline">IP Factory</Link>
      </div>
      <p className="text-xs text-muted-foreground">Seeds still short of the buyer evidence a build decision needs, in the order worth working.</p>

      {data === null ? (
        <div className="space-y-3 mt-4">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}</div>
      ) : totals.seeds === 0 ? (
        <p className="text-sm text-muted-foreground py-6 text-center">No seeds on the ledger yet. Run a hunt in the IP Factory.</p>
      ) : (
        <>
          <div className="mt-4">
            <div className="flex items-baseline justify-between text-xs mb-1.5">
              <span className="tabular-nums font-medium">{totals.verified} of {totals.seeds} seeds carry verified buyer research</span>
              <span className="tabular-nums text-muted-foreground">{totals.progress}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-muted overflow-hidden" role="progressbar" aria-valuenow={totals.progress} aria-valuemin={0} aria-valuemax={100} aria-label="Seeds with verified research">
              <div className="h-full bg-bottle" style={{ width: `${totals.progress}%` }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-md border px-2 py-2">
              <div className="text-base font-semibold tabular-nums">{totals.unreadBuyers}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Buyers unread</div>
            </div>
            <div className="rounded-md border px-2 py-2">
              <div className="text-base font-semibold tabular-nums">{totals.unresearched + totals.partial}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Evidence short</div>
            </div>
            <div className="rounded-md border px-2 py-2">
              <div className="text-base font-semibold tabular-nums">{totals.noBuyers}</div>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">No buyers named</div>
            </div>
          </div>

          {open.length === 0 ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Every seed carries verified buyer research. Nothing to chase.</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {open.map((row) => (
                <li key={row.id} className="border-b border-border last:border-0 pb-3 last:pb-0">
                  <Link
                    to={`/ip-factory?seed=${row.id}`}
                    className="flex items-start justify-between gap-3 rounded-md -mx-2 px-2 py-1.5 hover:bg-muted/50 transition"
                  >
                    <div className="min-w-0">
                      <div className="text-sm font-medium tracking-tight truncate">{row.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">{row.nextStep}</div>
                      {row.missing.length > 0 && (
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {row.missing.slice(0, 3).join(', ')}{row.missing.length > 3 ? ` +${row.missing.length - 3}` : ''}
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1.5 shrink-0">
                      <Badge variant="outline" className={BADGE[row.status]}>{LABEL[row.status]}</Badge>
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {row.researched}/{row.named || 0} read{row.verified ? ` · ${row.verified} verified` : ''}
                      </span>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          {openAll.length > SHOWN && (
            <button
              type="button"
              onClick={() => setExpanded((value) => !value)}
              className="mt-3 text-xs text-bottle hover:underline tabular-nums"
              aria-expanded={expanded}
            >
              {expanded
                ? `Show the top ${SHOWN} only`
                : `Show all ${openAll.length} seeds needing research`}
            </button>
          )}
        </>
      )}
    </Card>
  );
}