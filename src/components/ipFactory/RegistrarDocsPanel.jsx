import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Download, ScrollText, ShieldCheck, BookOpen, X } from 'lucide-react';
import DocMarkdown from '@/components/docs/DocMarkdown';
import userGuide from '@/docs/USER_GUIDE.md?raw';
import technicalGuide from '@/docs/TECHNICAL_GUIDE.md?raw';
import manifest from '@/docs/FILE_MANIFEST.md?raw';

const DOCS = [
  { id: 'user', label: 'User guide', file: 'USER_GUIDE.md', text: userGuide },
  { id: 'technical', label: 'Technical guide', file: 'TECHNICAL_GUIDE.md', text: technicalGuide },
  { id: 'manifest', label: 'File manifest', file: 'FILE_MANIFEST.md', text: manifest }
];

const fileCount = (manifest.match(/^- `[^`]+`/gm) || []).length;

const download = (doc) => {
  const url = URL.createObjectURL(new Blob([doc.text], { type: 'text/markdown' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = doc.file;
  link.click();
  URL.revokeObjectURL(url);
};

export default function RegistrarDocsPanel() {
  const [active, setActive] = useState('user');
  const [reading, setReading] = useState(false);
  const doc = DOCS.find((d) => d.id === active) || DOCS[0];

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-heading flex items-center gap-2">
            <ScrollText className="size-4 text-bottle" /> Registrar documentation
          </h2>
          <p className="text-xs text-muted-foreground mt-1 max-w-xl">
            The Registrar's record of this application: an operator guide, a technical guide, and a manifest of every
            file in the repository, so nothing is described that does not exist and nothing exists undescribed.
          </p>
          <div className="flex flex-wrap items-center gap-1.5 mt-2">
            <Badge variant="secondary" className="bg-muted text-[10px] font-normal">{fileCount} files enumerated</Badge>
            <Badge variant="secondary" className="bg-muted text-[10px] font-normal flex items-center gap-1">
              <ShieldCheck className="size-3" /> Verified against the tree
            </Badge>
          </div>
        </div>
        <div className="flex w-full sm:w-auto gap-2">
          <Button
            variant={reading ? 'outline' : 'default'}
            onClick={() => setReading((v) => !v)}
            className="flex-1 sm:flex-none"
          >
            {reading ? <X className="size-4 mr-2" /> : <BookOpen className="size-4 mr-2" />}
            {reading ? 'Close' : `Read ${doc.label.toLowerCase()}`}
          </Button>
          <Button variant="outline" onClick={() => download(doc)} className="flex-1 sm:flex-none">
            <Download className="size-4 mr-2" /> .md
          </Button>
        </div>
      </div>

      <Tabs value={active} onValueChange={setActive} className="mt-4">
        <TabsList className="grid grid-cols-3 w-full sm:w-auto">
          {DOCS.map((d) => (
            <TabsTrigger key={d.id} value={d.id}>{d.label}</TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      <p className="text-[11px] text-muted-foreground mt-3">
        Drift check: <code className="font-mono">node src/docs/verify-manifest.mjs</code> — exits non-zero if the manifest
        and the working tree disagree.
      </p>

      {reading && (
        <div className="mt-4 border-t border-border pt-4 max-h-[65vh] overflow-y-auto pr-1">
          <DocMarkdown text={doc.text} />
        </div>
      )}
    </section>
  );
}