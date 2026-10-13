import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Hammer, Loader2 } from 'lucide-react';
import useDossierBuild from '@/hooks/useDossierBuild';
import StageTrack from '@/components/command/StageTrack';

// With `project`: rebuilds that dossier in place. Without: takes a URL/idea and builds a new one.
export default function BuildButton({ project, onComplete }) {
  const [url, setUrl] = useState('');
  const [started, setStarted] = useState(false);
  const { stages, running, start, retry } = useDossierBuild();
  const navigate = useNavigate();

  const finish = (p) => {
    if (!p) return;
    if (onComplete) onComplete(p);
    else navigate(`/projects/${p.id}`);
  };

  const go = async () => {
    if (!project && !url.trim()) return;
    setStarted(true);
    finish(await start(project ? { project } : { url: url.trim() }));
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {!project && <Input placeholder="Company URL or business idea" value={url} onChange={(e) => setUrl(e.target.value)} disabled={running} className="bg-white" />}
        <Button onClick={go} disabled={running || (!project && !url.trim())} className="bg-bottle text-bottle-foreground hover:bg-bottle/90 shrink-0">
          {running ? <Loader2 className="animate-spin" /> : <Hammer />} {running ? 'Building' : 'Build'}
        </Button>
      </div>
      {started && <StageTrack stages={stages} running={running} onRetry={async (s) => finish(await retry(s))} />}
    </div>
  );
}