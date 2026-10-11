import { useState } from 'react';
import { Coins, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

const usd = (n) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

const typeTint = {
  revenue: 'bg-emerald-100 text-emerald-800',
  reinvestment: 'bg-violet-100 text-violet-800',
  acquisition: 'bg-blue-100 text-blue-800',
  legal: 'bg-amber-100 text-amber-800',
  ops: 'bg-slate-100 text-slate-600'
};

function LogForm({ onLog }) {
  const [type, setType] = useState('revenue');
  const [amount, setAmount] = useState('');
  const [asset, setAsset] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!amount) return;
    setBusy(true);
    try {
      await onLog({ entry_type: type, amount: Number(amount), asset_title: asset, note });
      setAmount(''); setAsset(''); setNote('');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="rounded-xl border bg-white p-4 grid gap-3 sm:grid-cols-5 items-end">
      <div className="space-y-1.5">
        <Label className="text-xs">Type</Label>
        <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-9 rounded-md border border-input bg-transparent px-2 text-sm">
          {['revenue', 'reinvestment', 'acquisition', 'legal', 'ops'].map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Amount (USD)</Label>
        <Input type="number" step="0.01" min="0" placeholder="250" value={amount} onChange={(e) => setAmount(e.target.value)} required />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Asset</Label>
        <Input placeholder="Asset name" value={asset} onChange={(e) => setAsset(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label className="text-xs">Note</Label>
        <Input placeholder="Month 1 subscriptions" value={note} onChange={(e) => setNote(e.target.value)} />
      </div>
      <Button type="submit" size="sm" disabled={busy}>
        <Plus className="size-4 mr-1" /> {busy ? 'Logging…' : 'Log entry'}
      </Button>
    </form>
  );
}

export default function TreasuryLedger({ ledger, decisions, onLog }) {
  const revenue = ledger.filter((e) => e.entry_type === 'revenue').reduce((s, e) => s + (e.amount || 0), 0);
  const spent = ledger.filter((e) => e.entry_type !== 'revenue').reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2">
        <Coins className="size-4 text-muted-foreground" />
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Treasury Ledger</h2>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Capital Generated</div>
          <div className="text-2xl font-semibold tracking-tight mt-1 text-emerald-700">{usd(revenue)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Capital Reinvested</div>
          <div className="text-2xl font-semibold tracking-tight mt-1 text-violet-700">{usd(spent)}</div>
        </div>
        <div className="rounded-xl border bg-white p-4">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Net Equity Growth</div>
          <div className="text-2xl font-semibold tracking-tight mt-1">{usd(revenue - spent)}</div>
        </div>
      </div>

      <LogForm onLog={onLog} />

      {decisions.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Neural-CFO Allocation</div>
          {decisions.map((d) => (
            <div key={d.id} className="rounded-xl border bg-white p-4 flex flex-wrap items-center gap-3">
              <Badge className={d.decision === 'hold' ? 'bg-slate-100 text-slate-600' : 'bg-violet-100 text-violet-800'}>{d.decision}</Badge>
              <div className="flex-1 min-w-[200px]">
                <div className="text-sm font-semibold text-slate-900">{d.target_title}</div>
                <p className="text-xs text-muted-foreground mt-0.5">{d.rationale}</p>
              </div>
              <div className="text-right">
                <div className="text-lg font-semibold tracking-tight">{usd(d.allocation)}</div>
                <div className="text-xs text-muted-foreground">{d.decision_date}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {ledger.length > 0 && (
        <div className="rounded-xl border bg-white divide-y">
          {ledger.slice(0, 8).map((e) => (
            <div key={e.id} className="flex items-center gap-3 px-4 py-2.5">
              <Badge className={typeTint[e.entry_type] || 'bg-slate-100 text-slate-600'}>{e.entry_type}</Badge>
              <div className="flex-1 text-sm text-slate-700">
                {e.asset_title || 'General'}{e.note ? <span className="text-muted-foreground"> — {e.note}</span> : ''}
              </div>
              <div className={`text-sm font-semibold ${e.entry_type === 'revenue' ? 'text-emerald-700' : 'text-slate-900'}`}>
                {e.entry_type === 'revenue' ? '+' : '−'}{usd(e.amount)}
              </div>
              <div className="text-xs text-muted-foreground w-20 text-right">{e.entry_date}</div>
            </div>
          ))}
        </div>
      )}
      {ledger.length === 0 && (
        <p className="text-xs text-muted-foreground">No capital movements logged yet. Log revenue from a live asset to activate the self-funding loop.</p>
      )}
    </section>
  );
}