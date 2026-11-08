import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const W = 900;
const PAD = 26;
const ROW = 27;
const HUB_X = 176;
const SEED_X = 646;

const KIND = {
  buyer: { color: '#1a3c34', label: 'Shared investor base' },
  vector: { color: '#3d5a80', label: 'Shared market vector' }
};

const clamp = (value, max) => (value.length > max ? `${value.slice(0, max - 1)}…` : value);

function layout(clusters, seedIds) {
  const rows = Math.max(clusters.length, seedIds.length);
  const height = Math.max(240, rows * ROW + PAD * 2);
  const centre = (count, i) => PAD + (height - PAD * 2 - count * ROW) / 2 + i * ROW + ROW / 2;
  const hubs = new Map(clusters.map((c, i) => [c.id, centre(clusters.length, i)]));
  const seeds = new Map(seedIds.map((id, i) => [id, centre(seedIds.length, i)]));
  return { height, hubs, seeds };
}

export default function SyndicateMap({ clusters, active, onSelect }) {
  const [hovered, setHovered] = useState(null);

  const shown = useMemo(() => clusters.slice(0, 12), [clusters]);

  const seedTitles = useMemo(() => {
    const map = new Map();
    shown.forEach((c) => c.seeds.forEach((s) => map.set(s.id, s)));
    return map;
  }, [shown]);

  const seedIds = useMemo(() => [...seedTitles.keys()], [seedTitles]);
  const { height, hubs, seeds } = useMemo(() => layout(shown, seedIds), [shown, seedIds]);

  if (!shown.length) return null;

  const focus = hovered || active;
  const cluster = shown.find((c) => c.id === focus) || null;
  const isLinked = (clusterId, seedId) => {
    const c = shown.find((x) => x.id === clusterId);
    return Boolean(c && c.seeds.some((s) => s.id === seedId));
  };

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <svg width={W} height={height} className="block">
          {shown.map((c) => {
            const y1 = hubs.get(c.id);
            return c.seeds.map((s) => {
              const y2 = seeds.get(s.id);
              if (y1 == null || y2 == null) return null;
              const lit = !focus || focus === c.id;
              return (
                <path
                  key={`${c.id}-${s.id}`}
                  d={`M${HUB_X},${y1} C${HUB_X + 170},${y1} ${SEED_X - 170},${y2} ${SEED_X},${y2}`}
                  fill="none"
                  stroke={KIND[c.kind].color}
                  strokeWidth={lit ? 1.4 : 0.8}
                  opacity={lit ? 0.42 : 0.05}
                />
              );
            });
          })}

          {shown.map((c) => {
            const y = hubs.get(c.id);
            const lit = !focus || focus === c.id;
            return (
              <g
                key={c.id}
                transform={`translate(${HUB_X}, ${y})`}
                className="cursor-pointer"
                opacity={lit ? 1 : 0.2}
                onMouseEnter={() => setHovered(c.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(active === c.id ? null : c.id)}
              >
                <rect x="-8" y="-8" width="16" height="16" fill="transparent" />
                <circle r="5.5" fill={KIND[c.kind].color} />
                <text x="14" textAnchor="start" fontSize="10.5" fill="#0a0a0a" dominantBaseline="middle">
                  {clamp(c.label, 24)}
                </text>
                <text x="-14" textAnchor="end" fontSize="9" fill="#737373" dominantBaseline="middle" className="tabular-nums">
                  {c.count}
                </text>
              </g>
            );
          })}

          {seedIds.map((id) => {
            const y = seeds.get(id);
            const seed = seedTitles.get(id);
            const lit = !focus || isLinked(focus, id);
            return (
              <g
                key={id}
                transform={`translate(${SEED_X}, ${y})`}
                opacity={lit ? 1 : 0.22}
              >
                <circle r="4.5" fill="#efeae1" stroke="#1a3c34" strokeWidth="1.2" />
                <text x="-13" textAnchor="end" fontSize="10" fill="#0a0a0a" dominantBaseline="middle">
                  {clamp(seed.title, 27)}
                </text>
                <text x="12" textAnchor="start" fontSize="9" fill="#737373" dominantBaseline="middle" className="tabular-nums">
                  {seed.asym}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        {Object.entries(KIND).map(([kind, k]) => (
          <span key={kind} className="inline-flex items-center gap-1.5">
            <span className="inline-block size-2.5 rounded-full" style={{ background: k.color }} />
            {k.label}
          </span>
        ))}
        <span>Left: the shared asset · Right: the seeds that share it · Number left of a seed is its asymmetry score</span>
        {active && (
          <button onClick={() => onSelect(null)} className={cn('underline hover:text-bottle')}>Clear selection</button>
        )}
      </div>

      {cluster && (
        <div className="mt-3 rounded-md border border-border bg-white p-4">
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <h4 className="font-heading text-base tracking-tight">{cluster.label}</h4>
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">{cluster.sub}</span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {cluster.count} seeds · combined asymmetry {cluster.combinedAsym} · average {cluster.avgAsym} — one round can be argued across all of them.
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {cluster.seeds.map((s) => (
              <span key={s.id} className="rounded-md border px-2 py-0.5 text-[11px]">{s.title} · {s.asym}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}