import React from 'react';
import { cn } from '@/lib/utils';

const KIND_LABEL = { buyer: 'Investor base', vector: 'Market vector' };

const KIND_TONE = {
  buyer: 'bg-bottle text-bottle-foreground',
  vector: 'bg-[#3d5a80] text-white'
};

export default function SyndicateList({ clusters, activeId, onSelect }) {
  if (!clusters.length) {
    return (
      <div className="rounded-md border border-dashed border-border p-8 text-center">
        <p className="text-sm text-muted-foreground">No syndicates yet. A seed joins one once a prospectus names a shared buyer, or a market vector matches two seeds' theses.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {clusters.map((c) => (
        <button
          key={c.id}
          onClick={() => onSelect(activeId === c.id ? null : c.id)}
          className={cn(
            'rounded-md border bg-white p-4 text-left transition-colors',
            activeId === c.id ? 'border-bottle' : 'border-border hover:border-foreground/30'
          )}
        >
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-heading text-base leading-snug tracking-tight">{c.label}</h4>
            <span className={cn('shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide', KIND_TONE[c.kind])}>
              {KIND_LABEL[c.kind]}
            </span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{c.sub}</p>
          {c.owned && (
            <span className="mt-1.5 inline-block rounded border border-bottle/40 bg-bottle/5 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-bottle">
              In your investor base
            </span>
          )}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground tabular-nums">
            <span><strong className="text-foreground">{c.count}</strong> seeds</span>
            <span>combined {c.combinedAsym}</span>
            <span>average {c.avgAsym}</span>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {c.seeds.map((s) => (
              <span key={s.id} className="rounded border border-border px-1.5 py-0.5 text-[10px]">{s.title}</span>
            ))}
          </div>
        </button>
      ))}
    </div>
  );
}