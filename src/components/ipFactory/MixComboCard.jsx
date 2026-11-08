import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Link2 } from 'lucide-react';

export default function MixComboCard({ combo, busy, onCreate }) {
  const members = combo.member_titles || [];
  const roles = combo.roles || [];
  const stack = combo.blueprint?.tech_stack || [];

  return (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <h4 className="text-sm font-semibold leading-snug min-w-0 break-words">{combo.title}</h4>
        <Badge variant="secondary" className="bg-emerald-50 text-emerald-800 border border-emerald-200 shrink-0">
          Mix {combo.mix_score}/10
        </Badge>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {members.map((title, index) => (
          <span key={index} className="text-[10px] uppercase tracking-wide rounded-md border bg-muted/50 px-2 py-0.5">
            {title}
          </span>
        ))}
      </div>

      <p className="text-xs leading-relaxed">{combo.thesis}</p>

      <div className="rounded-md bg-muted/50 p-2.5 space-y-1.5">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-muted-foreground">
          <Link2 className="size-3" /> Shared loop
        </div>
        <p className="text-xs leading-relaxed">{combo.shared_value_loop}</p>
      </div>

      {roles.length > 0 && (
        <ul className="space-y-1 text-[11px] leading-relaxed">
          {roles.map((role, index) => (
            <li key={index}>
              <span className="font-medium">{role.seed_title}</span> — {role.role}
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-wrap gap-1">
        {stack.slice(0, 6).map((tech, index) => (
          <span key={index} className="text-[10px] font-mono rounded border bg-background px-1.5 py-0.5">{tech}</span>
        ))}
      </div>

      <div className="flex items-center justify-between gap-2 pt-1">
        <span className="text-[10px] text-muted-foreground">Asym {combo.asymmetric_score}/10 · builds one codebase + dossier pack</span>
        <Button size="sm" onClick={() => onCreate(combo)} disabled={!!busy}>
          {busy === combo.title ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : null}
          Create ecosystem
        </Button>
      </div>
    </div>
  );
}