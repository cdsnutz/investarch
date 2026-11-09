import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BAND_LABEL, EDGE_LABEL } from '@/lib/nexusGraph';

const TYPE_LABEL = {
  dossier: 'Dossier',
  competitor: 'Competitor',
  funding: 'Capital claim',
  archetype: 'Archetype',
  seed: 'IP seed',
  buyer: 'Buyer lead'
};

export default function NodeInspector({ graph, selectedId, onSelect }) {
  const node = graph.nodes.find((n) => n.id === selectedId);

  if (!node) {
    return (
      <Card className="p-5 rounded-md border-dashed text-sm text-muted-foreground">
        Select any node on the map to trace what it touches and how it moves that dossier's readiness score.
      </Card>
    );
  }

  const links = graph.edges
    .filter((e) => e.source === selectedId || e.target === selectedId)
    .map((e) => {
      const otherId = e.source === selectedId ? e.target : e.source;
      const other = graph.nodes.find((n) => n.id === otherId);
      return { kind: e.kind, via: e.via, other };
    })
    .filter((l) => l.other);

  const grouped = Object.keys(EDGE_LABEL)
    .map((kind) => ({ kind, items: links.filter((l) => l.kind === kind) }))
    .filter((g) => g.items.length);

  const reading = node.type === 'dossier' ? graph.readiness[node.id] : null;

  return (
    <Card className="p-5 rounded-md space-y-4">
      <div>
        <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{TYPE_LABEL[node.type]}</div>
        <h3 className="font-heading text-lg tracking-tight">{node.label}</h3>
        <p className="text-xs text-muted-foreground">{node.sub}</p>
      </div>

      {reading && (
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-medium">Readiness</span>
            <span className="font-heading text-xl tabular-nums">{reading.score}<span className="text-xs text-muted-foreground"> / 100</span></span>
          </div>
          <Badge variant="outline" className="text-[10px]">{BAND_LABEL[reading.band]}</Badge>
          <div className="space-y-1.5 pt-1">
            {reading.components.map((c) => (
              <div key={c.key}>
                <div className="flex items-baseline justify-between text-[11px]">
                  <span className={c.value < 0 ? 'text-[#9a3b2e]' : 'text-foreground'}>{c.label}</span>
                  <span className={cn('tabular-nums', c.value < 0 ? 'text-[#9a3b2e]' : 'text-foreground')}>
                    {c.value > 0 ? '+' : ''}{c.value}
                    <span className="text-muted-foreground"> / {c.max}</span>
                  </span>
                </div>
                <div className="mt-1 h-1 rounded-full bg-secondary overflow-hidden">
                  <div
                    className={c.value < 0 ? 'h-full rounded-full bg-[#9a3b2e]' : 'h-full rounded-full bg-bottle'}
                    style={{ width: `${Math.min(100, Math.round((Math.abs(c.value) / c.max) * 100))}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-0.5">{c.note}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {node.type === 'buyer' && node.detail && (
        <div className="space-y-2 rounded-md border border-[#d9c27a] bg-[#faf6e8] p-3">
          <div className="flex flex-wrap gap-1">
            {(node.detail.categories || []).map((c) => (
              <Badge key={c} variant="outline" className="text-[10px] capitalize">{c}</Badge>
            ))}
          </div>
          {node.detail.whyFit && (
            <p className="text-xs leading-relaxed"><span className="text-muted-foreground">Why it fits: </span>{node.detail.whyFit}</p>
          )}
          {node.detail.contact && <p className="text-[11px] text-muted-foreground">Open with: {node.detail.contact}</p>}
          {(node.detail.sources || []).length > 0 && (
            <div className="space-y-0.5 pt-1">
              <div className="text-[10px] uppercase tracking-wide text-[#8a6c1f]">Verified sources</div>
              {node.detail.sources.slice(0, 3).map((url) => (
                <a
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="block text-[11px] break-all text-[#3d5a80] hover:underline"
                >
                  {url.replace(/^https?:\/\//, '').slice(0, 56)}
                </a>
              ))}
            </div>
          )}
        </div>
      )}

      {node.type === 'seed' && node.detail?.gap && (
        <div className="space-y-1 rounded-md border border-[#9a3b2e]/30 bg-[#fdf5f3] p-3">
          <div className="text-[10px] uppercase tracking-wide text-[#9a3b2e]">The gap it fills</div>
          <p className="text-xs leading-relaxed line-clamp-4">{node.detail.gap}</p>
        </div>
      )}

      <div className="space-y-3">
        {grouped.length === 0 ? (
          <p className="text-xs text-muted-foreground">Nothing connects to this node yet — it is an isolated record.</p>
        ) : (
          grouped.map((g) => (
            <div key={g.kind}>
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{EDGE_LABEL[g.kind]} · {g.items.length}</div>
              <ul className="space-y-1">
                {g.items.slice(0, 8).map((l, i) => (
                  <li key={`${l.other.id}-${i}`}>
                    <button
                      type="button"
                      onClick={() => onSelect(l.other.id)}
                      className="w-full text-left text-xs hover:text-bottle hover:underline"
                    >
                      {l.other.label}
                      {l.via && <span className="text-muted-foreground"> · via “{l.via}”</span>}
                    </button>
                  </li>
                ))}
                {g.items.length > 8 && <li className="text-[10px] text-muted-foreground">+{g.items.length - 8} more</li>}
              </ul>
            </div>
          ))
        )}
      </div>
    </Card>
  );
}