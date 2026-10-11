import { Network } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function SynergyLoop({ triggers, seedsById }) {
  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Network className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Synergy Loop</h2>
      </div>
      {triggers.length === 0 ? (
        <div className="rounded-xl border bg-white p-8 text-center text-sm text-muted-foreground">
          No cross-pollination staged. Press "Synergy Sync" once two assets are built.
        </div>
      ) : (
        <div className="space-y-2">
          {triggers.map((t) => (
            <div key={t.id} className="rounded-xl border bg-white p-4 space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="bg-slate-50 text-[11px]">{t.channel}</Badge>
                <div className="text-sm font-semibold text-slate-900">{t.trigger_name}</div>
              </div>
              <div className="text-xs text-muted-foreground">
                {seedsById[t.source_seed_id] || 'App'} <span className="font-semibold text-slate-700">→</span> {seedsById[t.target_seed_id] || 'sibling app'}
              </div>
              <p className="text-xs leading-relaxed text-slate-600">{t.message}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}