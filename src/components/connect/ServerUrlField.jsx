import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ServerUrlField() {
  const url = new URL('/api/mcp', window.location.origin).toString();
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
      <code className="flex-1 min-w-0 truncate rounded-md border border-border bg-background px-3 py-2 font-mono text-xs">
        {url}
      </code>
      <Button variant="outline" size="sm" onClick={copy} className="shrink-0">
        {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        {copied ? 'Copied' : 'Copy URL'}
      </Button>
    </div>
  );
}