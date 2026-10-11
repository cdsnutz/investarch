import React, { useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import moment from 'moment';

export default function AccountSettings() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [access, setAccess] = useState(null);
  const [digest, setDigest] = useState(false);
  const [exportFmt, setExportFmt] = useState('json');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.auth.me().then((me) => {
      setUser(me);
      setDigest(!!me.pref_digest);
      setExportFmt(me.pref_export || 'json');
      return base44.entities.SimulatorAccess.filter({ app_user_id: me.id });
    }).then((p) => setAccess(p.items[0] || null)).catch(() => setAccess(null));
  }, []);

  const savePrefs = async (data) => {
    setSaving(true);
    try {
      await base44.auth.updateMe(data);
      toast({ title: 'Preferences saved' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-3xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        {[0, 1, 2].map((i) => <Skeleton key={i} className="h-32 rounded-md" />)}
      </div>
    );
  }

  return (
    <div className="bg-paper min-h-[calc(100vh-3.5rem)] md:min-h-screen p-6 md:p-12 max-w-3xl mx-auto space-y-8">
      <PageHeader title="Account Settings" subtitle="Profile, subscription tier, and persistent system configuration." />

      <Card className="p-6 rounded-md space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Profile</h2>
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Name</div>
            <div className="mt-0.5">{user.full_name || '—'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Email</div>
            <div className="mt-0.5">{user.email}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Role</div>
            <div className="mt-0.5 capitalize">{user.role || 'user'}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Member since</div>
            <div className="mt-0.5">{moment(user.created_date).format('MMM D, YYYY')}</div>
          </div>
        </div>
      </Card>

      <Card className="p-6 rounded-md space-y-4">
        <h2 className="font-heading text-xl tracking-tight">Subscription</h2>
        {access == null ? <Skeleton className="h-12 w-full" /> : access ? (
          <div className="grid sm:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Tier</div>
              <div className="mt-0.5 font-medium capitalize">{(access.plan || 'simulator_pro').replace(/_/g, ' ')}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Status</div>
              <div className="mt-0.5"><Badge variant="outline" className={access.status === 'active' ? 'bg-bottle/10 text-bottle border-transparent' : ''}>{access.status}</Badge></div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Billing</div>
              <div className="mt-0.5 capitalize">{access.billing_interval || 'monthly'} · since {moment(access.started_date).format('MMM D, YYYY')}</div>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No active subscription. Simulator access is paywalled; visit the Precision Simulator to subscribe.</p>
        )}
      </Card>

      <Card className="p-6 rounded-md space-y-5">
        <h2 className="font-heading text-xl tracking-tight">System Configuration</h2>
        <p className="text-sm text-muted-foreground -mt-3">Persisted on your account and applied across every screen.</p>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Email digest</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Include a summary of new signals and seeds when the engine emails you.</p>
          </div>
          <Switch checked={digest} onCheckedChange={(v) => { setDigest(v); savePrefs({ pref_digest: v }); }} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <Label>Default export format</Label>
            <p className="text-xs text-muted-foreground mt-0.5">Format used by vault and prospectus exports.</p>
          </div>
          <select
            value={exportFmt}
            onChange={(e) => { setExportFmt(e.target.value); savePrefs({ pref_export: e.target.value }); }}
            disabled={saving}
            className="h-9 rounded-md border border-input bg-white px-3 text-sm"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
      </Card>
    </div>
  );
}