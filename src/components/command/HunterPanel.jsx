import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import Panel from '@/components/command/Panel';
import { logActivity } from '@/lib/activity';

export default function HunterPanel({ onChange }) {
  const [seeds, setSeeds] = useState(null);
  const [busy, setBusy] = useState(null);

  const load = () => base44.entities.MarketSeed.filter({ status: 'New' }, { sort: '-created_date', limit: 20 }).then((p) => setSeeds(p.items));
  useEffect(() => { load(); }, []);

  const capture = async (s) => {
    setBusy(s.id);
    await base44.entities.Project.create({ url: s.thesis || s.title, company_name: s.title, industry: s.vector, status: 'captured', tags: [s.vector, s.source].filter(Boolean) });
    await base44.entities.MarketSeed.update(s.id, { status: 'Captured' });
    await logActivity('seed_captured', s.title);
    setBusy(null); load(); onChange?.();
  };

  const dismiss = async (s) => {
    setBusy(s.id);
    await base44.entities.MarketSeed.update(s.id, { status: 'Dismissed' });
    await logActivity('seed_dismissed', s.title);
    setBusy(null); load(); onChange?.();
  };

  return (
    <Panel code="C" title="Market Hunter" action={<span className="text-xs text-muted-foreground">{seeds?.length ?? '–'} open</span>}>
      {!seeds ? <p className="text-xs text-muted-foreground">Loading…</p>
        : seeds.length === 0 ? <p className="text-xs text-muted-foreground">No open market seeds.</p>
        : (
          <ul className="divide-y divide-border max-h-[520px] overflow-y-auto">
            {seeds.map((s) => (
              <li key={s.id} className="py-3 first:pt-0">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-heading text-[15px] leading-snug">{s.title}</div>
                    <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mt-0.5">{s.vector || 'Unclassified'}{s.source ? ` · ${s.source}` : ''}</div>
                  </div>
                  <span className="font-mono text-sm text-bottle shrink-0">{s.signal_score ?? '–'}</span>
                </div>
                {s.thesis && <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.thesis}</p>}
                <div className="flex gap-2 mt-2">
                  <Button size="sm" disabled={busy === s.id} onClick={() => capture(s)} className="h-7 bg-bottle text-bottle-foreground hover:bg-bottle/90">Capture</Button>
                  <Button size="sm" variant="outline" disabled={busy === s.id} onClick={() => dismiss(s)} className="h-7">Dismiss</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
    </Panel>
  );
}