import React from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { BAND_LABEL } from '@/lib/nexusGraph';

const BAR = {
  'capital-ready': 'bg-bottle',
  advancing: 'bg-[#3d5a80]',
  thin: 'bg-[#9a3b2e]',
  early: 'bg-[#a8a29e]'
};

const BADGE = {
  'capital-ready': 'bg-bottle/10 text-bottle border-transparent',
  advancing: 'bg-[#3d5a80]/10 text-[#3d5a80] border-transparent',
  thin: 'bg-[#9a3b2e]/10 text-[#9a3b2e] border-transparent',
  early: 'opacity-60'
};

export default function ReadinessPanel({ rows, selected, onSelect }) {
  return (
    <div className="space-y-3">
      <div>
        <h2 className="font-heading text-xl tracking-tight">Funding readiness</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Derived from the network: dossier evidence (40), capital claims in motion (30), archetype pull (18), competitive pressure (−20), sibling market overlap (−9).
        </p>
      </div>

      {rows.length === 0 ? (
        <Card className="p-6 rounded-md border-dashed text-sm text-muted-foreground">No dossiers to score yet.</Card>
      ) : (
        <div className="space-y-2">
          {rows.map(({ project, reading }, i) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onSelect(selected === project.id ? null : project.id)}
              className={cn(
                'w-full rounded-md border bg-card p-3 text-left transition hover:border-foreground/30',
                selected === project.id ? 'border-bottle ring-1 ring-bottle/30' : 'border-border'
              )}
            >
              <div className="flex items-baseline justify-between gap-3">
                <div className="min-w-0">
                  <span className="text-xs text-muted-foreground tabular-nums mr-2">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-medium text-sm">{project.company_name || 'Untitled dossier'}</span>
                  <span className="block text-[11px] text-muted-foreground truncate">{project.industry || '—'}</span>
                </div>
                <div className="text-right shrink-0">
                  <span className="font-heading text-lg tabular-nums">{reading.score}</span>
                  <Badge variant="outline" className={cn('ml-2 text-[10px]', BADGE[reading.band])}>{BAND_LABEL[reading.band]}</Badge>
                </div>
              </div>
              <div className="mt-2 h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className={cn('h-full rounded-full', BAR[reading.band])} style={{ width: `${reading.score}%` }} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
                <span>+{reading.counts.claims} claim{reading.counts.claims === 1 ? '' : 's'}</span>
                <span>+{reading.counts.archetypes} archetype{reading.counts.archetypes === 1 ? '' : 's'}</span>
                <span>−{reading.counts.rivals} rival{reading.counts.rivals === 1 ? '' : 's'}</span>
                <span>−{reading.counts.peers} overlapping dossier{reading.counts.peers === 1 ? '' : 's'}</span>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}