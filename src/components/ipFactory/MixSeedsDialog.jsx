import { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Loader2, Layers } from 'lucide-react';
import MixComboCard from '@/components/ipFactory/MixComboCard';

export default function MixSeedsDialog({ onCreated }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [combos, setCombos] = useState(null);
  const [reason, setReason] = useState('');
  const [scanned, setScanned] = useState(0);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const findMixes = async () => {
    setLoading(true);
    setError('');
    setReason('');
    setCombos(null);
    try {
      const res = await base44.functions.invoke('mixSeeds', { action: 'find' });
      const data = res.data || {};
      setCombos(data.combinations || []);
      setReason(data.reason || '');
      setScanned(data.scanned || 0);
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'The mix scan failed.');
      setCombos([]);
    } finally {
      setLoading(false);
    }
  };

  const openDialog = () => {
    setOpen(true);
    findMixes();
  };

  const create = async (combo) => {
    setBusy(combo.title);
    setError('');
    try {
      await base44.functions.invoke('mixSeeds', { action: 'create', combination: combo });
      setOpen(false);
      setCombos(null);
      onCreated?.();
    } catch (err) {
      setError(err?.response?.data?.error || err?.message || 'That ecosystem could not be created.');
    } finally {
      setBusy('');
    }
  };

  return (
    <>
      <Button variant="outline" onClick={openDialog} className="w-full sm:w-auto">
        <Layers className="size-4 mr-2" />
        Mix seeds
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Seed mixes</DialogTitle>
            <DialogDescription>
              Seeds that support each other, read as one ecosystem. A mix becomes its own seed, so it draws the same patents, prospectus, dossier pack and codebase export as any other.
            </DialogDescription>
          </DialogHeader>

          {loading && (
            <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" />
              Reading the current ledger for combinations that compound…
            </div>
          )}

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/5 p-3">
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          {!loading && combos !== null && combos.length === 0 && (
            <p className="py-6 text-sm text-muted-foreground">{reason || 'No combinations found in this ledger.'}</p>
          )}

          {!loading && combos !== null && combos.length > 0 && (
            <div className="space-y-3">
              {scanned > 0 && (
                <p className="text-[11px] text-muted-foreground">{combos.length} combinable ecosystem{combos.length === 1 ? '' : 's'} across {scanned} seeds.</p>
              )}
              {combos.map((combo) => (
                <MixComboCard key={(combo.member_ids || []).join('-')} combo={combo} busy={busy} onCreate={create} />
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}