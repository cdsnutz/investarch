import { ExternalLink } from 'lucide-react';

export default function ClickupTaskList({ tasks }) {
  if (!tasks?.length) return null;

  return (
    <div className="mt-3 space-y-1.5">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Tracked in ClickUp</p>
      {tasks.slice(0, 6).map((task) => (
        <a
          key={task.id}
          href={task.task_url || '#'}
          target="_blank"
          rel="noreferrer"
          className="flex items-start gap-2 rounded-md border bg-muted/30 px-2.5 py-1.5 text-xs hover:border-foreground/30"
        >
          <ExternalLink className="size-3 mt-0.5 shrink-0 text-muted-foreground" />
          <span className="min-w-0 flex-1 break-words">{task.task_name}</span>
          <span className="shrink-0 text-muted-foreground">{task.status}</span>
        </a>
      ))}
      {tasks.length > 6 && <p className="text-[11px] text-muted-foreground">and {tasks.length - 6} more</p>}
    </div>
  );
}