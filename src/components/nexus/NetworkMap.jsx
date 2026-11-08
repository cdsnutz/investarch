import React, { useMemo, useState } from 'react';
import { cn } from '@/lib/utils';

const W = 900, H = 640;

const STYLE = {
  dossier: { r: 9, fill: '#1a3c34', stroke: '#1a3c34', label: 'Dossier' },
  competitor: { r: 5, fill: '#ffffff', stroke: '#1a3c34', label: 'Competitor' },
  funding: { r: 5, fill: '#a8a29e', stroke: '#78716c', label: 'Capital claim' },
  archetype: { r: 6, fill: '#efeae1', stroke: '#6b5b95', label: 'Archetype' }
};

const EDGE = {
  competition: { color: '#9a3b2e', dash: undefined, width: 1.5, opacity: 0.6 },
  funding: { color: '#3d5a80', dash: undefined, width: 1.5, opacity: 0.6 },
  influence: { color: '#6b5b95', dash: '2 3', width: 1.2, opacity: 0.45 },
  market: { color: '#a8a29e', dash: '4 4', width: 1, opacity: 0.3 }
};

const BAND_RING = {
  'capital-ready': '#1a3c34',
  advancing: '#3d5a80',
  thin: '#9a3b2e',
  early: '#a8a29e'
};

// Deterministic force layout: repulsion + edge springs + centering, no runtime animation.
function computeLayout(nodes, edges) {
  const pts = nodes.map((n, i) => {
    const a = (i / Math.max(1, nodes.length)) * Math.PI * 2;
    const r = n.type === 'dossier' ? 60 : H / 2 - 90;
    return { x: W / 2 + Math.cos(a) * r, y: H / 2 + Math.sin(a) * r, vx: 0, vy: 0 };
  });
  const idx = Object.fromEntries(nodes.map((n, i) => [n.id, i]));
  const e = edges
    .map((ed) => ({ s: idx[ed.source], t: idx[ed.target], kind: ed.kind }))
    .filter((x) => x.s != null && x.t != null);
  for (let it = 0; it < 300; it++) {
    for (let i = 0; i < pts.length; i++) {
      for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[j].x - pts[i].x, dy = pts[j].y - pts[i].y;
        const d2 = dx * dx + dy * dy || 1;
        const d = Math.sqrt(d2);
        const f = 2800 / d2;
        const fx = (dx / d) * f, fy = (dy / d) * f;
        pts[i].vx -= fx; pts[i].vy -= fy;
        pts[j].vx += fx; pts[j].vy += fy;
      }
    }
    e.forEach(({ s, t, kind }) => {
      const rest = kind === 'funding' ? 110 : kind === 'influence' ? 150 : 175;
      const k = kind === 'funding' ? 0.02 : kind === 'influence' ? 0.009 : 0.005;
      const dx = pts[t].x - pts[s].x, dy = pts[t].y - pts[s].y;
      const d = Math.sqrt(dx * dx + dy * dy) || 1;
      const f = (d - rest) * k;
      const fx = (dx / d) * f, fy = (dy / d) * f;
      pts[s].vx += fx; pts[s].vy += fy;
      pts[t].vx -= fx; pts[t].vy -= fy;
    });
    pts.forEach((p, i) => {
      const core = nodes[i].type === 'dossier';
      p.vx += (W / 2 - p.x) * (core ? 0.03 : 0.004);
      p.vy += (H / 2 - p.y) * (core ? 0.03 : 0.004);
      p.vx *= 0.85; p.vy *= 0.85;
      p.x += Math.max(-8, Math.min(8, p.vx));
      p.y += Math.max(-8, Math.min(8, p.vy));
      p.x = Math.max(46, Math.min(W - 46, p.x));
      p.y = Math.max(46, Math.min(H - 46, p.y));
    });
  }
  return pts.map((p, i) => ({ ...p, node: nodes[i] }));
}

export default function NetworkMap({ graph, selected, onSelect }) {
  const [hovered, setHovered] = useState(null);
  const { nodes, edges, readiness } = graph;

  const positions = useMemo(() => computeLayout(nodes, edges), [nodes, edges]);

  const neighbors = useMemo(() => {
    const m = new Map(nodes.map((n) => [n.id, new Set([n.id])]));
    edges.forEach((e) => {
      m.get(e.source)?.add(e.target);
      m.get(e.target)?.add(e.source);
    });
    return m;
  }, [nodes, edges]);

  const active = hovered || selected;
  const inFocus = (id) => !active || (neighbors.get(active) || new Set()).has(id);
  const posOf = useMemo(() => Object.fromEntries(positions.map((p) => [p.node.id, p])), [positions]);
  const showLabel = (n) => n.type !== 'market' && (n.type === 'dossier' || active === n.id || (active && (neighbors.get(active) || new Set()).has(n.id)));

  return (
    <div>
      <div className="overflow-x-auto rounded-md border border-border bg-white">
        <svg width={W} height={H} className="block">
          {edges.map((e, i) => {
            const a = posOf[e.source], b = posOf[e.target];
            if (!a || !b) return null;
            const lit = !active || (e.source === active || e.target === active);
            const s = EDGE[e.kind] || EDGE.market;
            return (
              <line
                key={i}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={s.color}
                strokeWidth={s.width}
                strokeDasharray={s.dash}
                opacity={lit ? s.opacity : 0.06}
              />
            );
          })}
          {positions.map((p) => {
            const s = STYLE[p.node.type];
            const lit = inFocus(p.node.id);
            const reading = readiness[p.node.id];
            const isCore = p.node.type === 'dossier';
            return (
              <g
                key={p.node.id}
                transform={`translate(${p.x}, ${p.y})`}
                className="cursor-pointer"
                opacity={lit ? 1 : 0.18}
                onMouseEnter={() => setHovered(p.node.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect(selected === p.node.id ? null : p.node.id)}
              >
                <circle r={s.r + 6} fill="transparent" />
                {reading && (
                  <circle r={s.r + 3.5} fill="none" stroke={BAND_RING[reading.band]} strokeWidth="1.5" opacity={selected === p.node.id ? 0.9 : 0.55} />
                )}
                <circle
                  r={s.r}
                  fill={s.fill}
                  stroke={s.stroke}
                  strokeWidth={p.node.type === 'competitor' || p.node.type === 'archetype' ? 1.5 : 0}
                  strokeDasharray={p.node.type === 'archetype' ? '2 2' : undefined}
                />
                {showLabel(p.node) && (
                  <text y={s.r + 12} textAnchor="middle" fontSize="10" fill="#0a0a0a">
                    <tspan className="font-medium" x="0">{p.node.label.length > 24 ? p.node.label.slice(0, 23) + '…' : p.node.label}</tspan>
                    <tspan x="0" dy="11" fontSize="8.5" fill="#737373">
                      {isCore && reading ? `${reading.score} · ${p.node.sub}`.slice(0, 34) : String(p.node.sub || '').slice(0, 30)}
                    </tspan>
                  </text>
                )}
              </g>
            );
          })}
        </svg>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-[11px] text-muted-foreground">
        {Object.entries(STYLE).map(([type, s]) => (
          <span key={type} className="inline-flex items-center gap-1.5">
            <span className="inline-block rounded-full border" style={{ width: 9, height: 9, background: s.fill, borderColor: s.stroke }} />
            {s.label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-[#9a3b2e]" /> Direct competition
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-[#3d5a80]" /> Capital claim
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t-2 border-dotted border-[#6b5b95]" /> Archetype influence
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block w-4 border-t border-dashed border-[#a8a29e]" /> Shared market
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full ring-1 ring-bottle" /> Readiness ring
        </span>
        {selected && (
          <button onClick={() => onSelect(null)} className={cn('underline hover:text-bottle')}>Clear selection</button>
        )}
      </div>
    </div>
  );
}