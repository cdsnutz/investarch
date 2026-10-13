import { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { format } from 'date-fns';
import Panel from '@/components/command/Panel';

export default function LedgerPanel() {
  const [events, setEvents] = useState(null);

  useEffect(() => {
    base44.entities.ActivityEvent.filter({}, { sort: '-timestamp', limit: 40 }).then((p) => setEvents(p.items));
    return base44.entities.ActivityEvent.subscribe((e) => {
      if (e.type === 'create') setEvents((prev) => [e.data, ...(prev || [])].slice(0, 40));
    });
  }, []);

  return (
    <Panel code="D" title="Activity Ledger">
      {!events ? <p className="text-xs text-muted-foreground">Loading…</p>
        : events.length === 0 ? <p className="text-xs text-muted-foreground">No entries.</p>
        : (
          <ul className="font-mono text-[11px] space-y-1 max-h-[520px] overflow-y-auto">
            {events.map((e) => (
              <li key={e.id} className="flex gap-3">
                <span className="text-muted-foreground shrink-0">{format(new Date(e.timestamp), 'MM-dd HH:mm:ss')}</span>
                <span className="text-bottle shrink-0">{e.action}</span>
                <span className="truncate">{e.detail}</span>
              </li>
            ))}
          </ul>
        )}
    </Panel>
  );
}