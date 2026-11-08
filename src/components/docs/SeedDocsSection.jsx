import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Download, FolderTree, X } from 'lucide-react';
import DocMarkdown from '@/components/docs/DocMarkdown';
import { seedDocSet } from '@/lib/seedDocs';
import { appSlug } from '@/lib/scaffoldKit';

export default function SeedDocsSection({ seed, brand, codebase }) {
  const [active, setActive] = useState('user');
  const [reading, setReading] = useState(false);
  const docs = useMemo(() => seedDocSet(seed, brand, codebase), [seed, brand, codebase]);
  const slug = appSlug(seed);

  const tabs = [
    { id: 'user', label: 'User guide', file: `${slug}-USER_GUIDE.md`, text: docs.user },
    { id: 'technical', label: 'Technical guide', file: `${slug}-TECHNICAL_GUIDE.md`, text: docs.technical },
    { id: 'tree', label: 'File manifest', file: `${slug}-FILE_MANIFEST.md`, text: docs.tree }
  ];
  const doc = tabs.find((tab) => tab.id === active) || tabs[0];

  const download = () => {
    const url = URL.createObjectURL(new Blob([doc.text], { type: 'text/markdown' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = doc.file;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="rounded-lg border p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <FolderTree className="size-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Seed documentation</h4>
          </div>
          <p className="text-[11px] text-muted-foreground mt-1">Written by the generator for this seed's codebase.</p>
          <Badge variant="secondary" className="bg-muted text-[10px] font-normal mt-1.5">
            {docs.files.length} files enumerated
          </Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant={reading ? 'outline' : 'default'} onClick={() => setReading((v) => !v)}>
            {reading ? <X className="size-3.5 mr-1.5" /> : <BookOpen className="size-3.5 mr-1.5" />}
            {reading ? 'Close' : 'Read'}
          </Button>
          <Button size="sm" variant="outline" onClick={download}>
            <Download className="size-3.5 mr-1.5" /> .md
          </Button>
        </div>
      </div>

      <Tabs value={active} onValueChange={setActive} className="mt-3">
        <TabsList className="grid grid-cols-3 w-full">
          {tabs.map((tab) => (
            <TabsTrigger key={tab.id} value={tab.id} className="text-[11px] sm:text-xs">
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>

      {reading && (
        <div className="mt-3 border-t pt-3 max-h-[55vh] overflow-y-auto pr-1">
          <DocMarkdown text={doc.text} />
        </div>
      )}
    </div>
  );
}