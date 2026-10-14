import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Download, Scale, Tag, FileSignature, Handshake, Wrench, FileArchive } from 'lucide-react';
import JSZip from 'jszip';
import { buildDossierPack } from '@/lib/dossierPack';

function Block({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{title}</h4>
      <div className="text-sm leading-relaxed whitespace-pre-wrap">{children}</div>
    </div>
  );
}

function FilingView({ filing }) {
  if (filing.filing_type === 'patent') {
    return (
      <div className="space-y-3">
        <Block title="Abstract">{filing.abstract}</Block>
        <Block title="Claims">{filing.claims}</Block>
        <Block title="Detailed Description">{filing.detailed_description}</Block>
        {filing.prior_art_note && <Block title="Prior Art Note">{filing.prior_art_note}</Block>}
      </div>
    );
  }
  if (filing.filing_type === 'trademark') {
    return (
      <div className="space-y-3">
        <Block title="Brand Name">{filing.brand_name}</Block>
        <Block title="Trademark Classes">{filing.trademark_classes}</Block>
        <Block title="Logo Concepts">{filing.logo_concepts}</Block>
        <Block title="Clearance Note">{filing.clearance_note}</Block>
      </div>
    );
  }
  if (filing.filing_type === 'copyright') return <Block title="Copyright Registration">{filing.copyright_text}</Block>;
  return <Block title="Deed of Ownership">{filing.deed_text}</Block>;
}

export function SeedBody({ seed, filings, prospectus, onRefresh }) {
  const [busy, setBusy] = useState('');
  const [codebase, setCodebase] = useState(null);

  const run = async (key, fn) => {
    setBusy(key);
    try {
      await fn();
      onRefresh();
    } finally {
      setBusy('');
    }
  };

  const buildCodebase = () => run('build', async () => {
    const res = await base44.functions.invoke('architectSeed', { seedId: seed.id });
    const cb = res.data;
    setCodebase(cb);
    const zip = new JSZip();
    (cb.files || []).forEach((f) => zip.file(f.path, f.content));
    zip.file('Developer_Onboarding_Guide.md', cb.onboarding_guide || '');
    zip.file('User_Manual.md', cb.user_manual || '');
    const blob = await zip.generateAsync({ type: 'blob' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${cb.repo_name || seed.title}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  });

  const draft = (filingType) => run(filingType, async () => {
    await base44.functions.invoke('draftIpFiling', { seedId: seed.id, filingType });
  });

  const liquidate = () => run('liquidate', async () => {
    await base44.functions.invoke('liquidateIp', { seedId: seed.id });
  });

  const buildPack = () => run('pack', async () => {
    const missing = ['patent', 'trademark', 'deed', 'copyright'].filter((t) => !(filings || []).some((f) => f.filing_type === t));
    const capitalReq = base44.functions.invoke('draftCapitalPack', { seedId: seed.id });
    await Promise.all(missing.map((t) => base44.functions.invoke('draftIpFiling', { seedId: seed.id, filingType: t })));
    const capital = (await capitalReq).data;
    let prospectusRec = prospectus;
    if (!prospectusRec) {
      const res = await base44.functions.invoke('liquidateIp', { seedId: seed.id });
      prospectusRec = res.data?.prospectus;
    }
    const arch = await base44.functions.invoke('architectSeed', { seedId: seed.id });
    const codebase = arch.data || {};
    const fresh = await base44.entities.IpFiling.filter({ seed_id: seed.id }, { limit: 20 });
    const blob = await buildDossierPack({ seed, filings: fresh.items || [], prospectus: prospectusRec, codebase, capital });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${seed.title.replace(/[^\w\s-]/g, '').trim() || 'IP-Asset'} Dossier Pack.zip`;
    a.click();
    URL.revokeObjectURL(url);
    onRefresh();
  });

  const bp = seed.blueprint || {};

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <Block title="The Gap">{seed.gap}</Block>
        {seed.pain_signal && <Block title="Pain-Signal">{seed.pain_signal}</Block>}
        <Block title="The Solution">{seed.solution}</Block>
      </div>

      {seed.mini_plan && <Block title="Mini-Plan">{seed.mini_plan}</Block>}

      {(bp.tech_stack?.length || bp.db_schema || bp.core_logic) && (
        <div className="rounded-lg border bg-muted/40 p-4 space-y-3">
          <div className="flex items-center gap-2"><Wrench className="size-3.5 text-muted-foreground" /><h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Blueprint</h4></div>
          {bp.tech_stack?.length > 0 && (
            <div className="flex flex-wrap gap-1.5">{bp.tech_stack.map((t, i) => <span key={i} className="text-xs rounded-md bg-background border px-2 py-0.5 font-mono">{t}</span>)}</div>
          )}
          {bp.db_schema && <Block title="Database Schema">{bp.db_schema}</Block>}
          {bp.core_logic && <Block title="Core Logic">{bp.core_logic}</Block>}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant={seed.status === 'built' ? 'outline' : 'default'} onClick={buildCodebase} disabled={!!busy}>
          {busy === 'build' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Wrench className="size-3.5 mr-1.5" />}
          {seed.status === 'built' ? 'Rebuild codebase export' : 'Architect: build codebase'}
        </Button>
        <Button size="sm" variant="outline" onClick={() => draft('patent')} disabled={!!busy}>
          {busy === 'patent' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Scale className="size-3.5 mr-1.5" />} Draft patent
        </Button>
        <Button size="sm" variant="outline" onClick={() => draft('trademark')} disabled={!!busy}>
          {busy === 'trademark' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Tag className="size-3.5 mr-1.5" />} Trademark packet
        </Button>
        <Button size="sm" variant="outline" onClick={() => draft('deed')} disabled={!!busy}>
          {busy === 'deed' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <FileSignature className="size-3.5 mr-1.5" />} Deed of ownership
        </Button>
        <Button size="sm" variant="outline" onClick={liquidate} disabled={!!busy}>
          {busy === 'liquidate' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Handshake className="size-3.5 mr-1.5" />} Liquidation prospectus
        </Button>
        <Button size="sm" onClick={buildPack} disabled={!!busy}>
          {busy === 'pack' ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <FileArchive className="size-3.5 mr-1.5" />} Download dossier pack (PDFs)
        </Button>
      </div>
      {busy === 'pack' && (
        <p className="text-xs text-muted-foreground">Drafting any missing filings, grant applications, the loan proposal and the prospectus, rebuilding the codebase, then assembling the pack. This can take a few minutes.</p>
      )}

      {codebase?.onboarding_guide && (
        <Block title="Developer Onboarding">{codebase.onboarding_guide}</Block>
      )}

      {(filings || []).map((f) => (
        <div key={f.id} className="rounded-lg border p-4">
          <div className="flex items-center gap-2 mb-3">
            <Scale className="size-3.5 text-muted-foreground" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              {f.filing_type === 'patent' ? 'Patent Application Draft' : f.filing_type === 'trademark' ? 'Trademark Filing Packet' : f.filing_type === 'copyright' ? 'Copyright Registration Application' : 'IP Deed of Ownership'}
            </h4>
          </div>
          <FilingView filing={f} />
        </div>
      ))}

      {prospectus && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Handshake className="size-3.5 text-emerald-600" />
            <h4 className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Liquidation Prospectus</h4>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(prospectus.targets || []).map((t, i) => (
              <span key={i} className="text-xs rounded-md bg-background border px-2 py-0.5">{t.name}</span>
            ))}
          </div>
          <div className="text-sm leading-relaxed whitespace-pre-wrap">{prospectus.prospectus}</div>
          <Badge variant="secondary" className="bg-background">{prospectus.offer_type}</Badge>
          {prospectus.lead_contact && <Block title="Lead Contact">{prospectus.lead_contact}</Block>}
          {prospectus.offer_terms && <Block title="Offer Terms">{prospectus.offer_terms}</Block>}
        </div>
      )}
    </div>
  );
}

export default function SeedDetail({ seed, filings, prospectus, open, onClose, onRefresh }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">{seed.title}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary" className="bg-slate-100">Asym {seed.asymmetric_score}/10</Badge>
            <Badge variant="secondary" className="bg-slate-100">{seed.strategy}</Badge>
            {seed.yield_date && <span className="text-xs">Yield: {seed.yield_date}</span>}
          </DialogDescription>
        </DialogHeader>
        <SeedBody seed={seed} filings={filings} prospectus={prospectus} onRefresh={onRefresh} />
      </DialogContent>
    </Dialog>
  );
}