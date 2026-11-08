import { useEffect, useRef, useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, Palette, Check } from 'lucide-react';
import { BRAND_DEFAULTS } from '@/lib/kit/brand';

const EMPTY = {
  brand_name: '',
  tagline: '',
  logo_url: '',
  primary_color: BRAND_DEFAULTS.primary_color,
  accent_color: BRAND_DEFAULTS.accent_color,
  surface_color: BRAND_DEFAULTS.surface_color,
  ink_color: BRAND_DEFAULTS.ink_color,
  heading_font: BRAND_DEFAULTS.heading_font,
  body_font: BRAND_DEFAULTS.body_font,
  support_email: ''
};

export default function BrandKitPanel({ brand, onChange }) {
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const fileRef = useRef(null);

  useEffect(() => {
    if (brand) setForm({ ...EMPTY, ...Object.fromEntries(Object.entries(brand).filter(([k]) => k in EMPTY)) });
  }, [brand]);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const upload = async (file) => {
    if (!file) return;
    setUploading(true);
    setError('');
    try {
      const { file_url } = await base44.integrations.Core.UploadPublicFile({ file });
      set('logo_url', file_url);
      setNote('Logo uploaded. Save to apply it to every generated site.');
    } catch (problem) {
      setError(problem?.message || 'That logo could not be uploaded.');
    } finally {
      setUploading(false);
    }
  };

  const save = async () => {
    if (!form.brand_name.trim()) {
      setError('A brand name is required.');
      return;
    }
    setSaving(true);
    setError('');
    setNote('');
    try {
      const saved = brand?.id
        ? await base44.entities.BrandKit.update(brand.id, form)
        : await base44.entities.BrandKit.create(form);
      setNote('Saved. Every codebase you build from now on carries this brand.');
      onChange?.(saved);
    } catch (problem) {
      setError(problem?.message || 'That could not be saved.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="rounded-xl border bg-card p-4 sm:p-6 mb-6">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-heading flex items-center gap-2"><Palette className="size-4 text-bottle" /> Brand kit</h2>
          <p className="text-xs text-muted-foreground mt-1">Logo, palette and type baked into every generated site.</p>
        </div>
        <span className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground">
          {brand ? 'applied to new builds' : 'not set'}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-[180px_1fr]">
        <div>
          <div className="aspect-square rounded-lg border bg-muted/40 flex items-center justify-center overflow-hidden">
            {form.logo_url ? (
              <img src={form.logo_url} alt={form.brand_name || 'Logo'} className="max-h-full max-w-full object-contain" />
            ) : (
              <span className="text-[11px] text-muted-foreground px-2 text-center">No logo yet</span>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/png,image/jpeg,image/webp,image/svg+xml"
            className="hidden"
            onChange={(event) => upload(event.target.files?.[0])}
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full mt-2"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? <Loader2 className="size-3.5 mr-1.5 animate-spin" /> : <Upload className="size-3.5 mr-1.5" />}
            {form.logo_url ? 'Replace logo' : 'Upload logo'}
          </Button>
          {form.logo_url && (
            <button type="button" className="text-[11px] text-muted-foreground underline mt-2 w-full" onClick={() => set('logo_url', '')}>
              Remove logo
            </button>
          )}
        </div>

        <div className="space-y-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-name">Brand name</Label>
              <Input id="brand-name" value={form.brand_name} onChange={(e) => set('brand_name', e.target.value)} placeholder="Northline" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-support">Support email (optional)</Label>
              <Input id="brand-support" type="email" value={form.support_email} onChange={(e) => set('support_email', e.target.value)} placeholder="help@yourdomain.com" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="brand-tagline">Tagline (optional)</Label>
            <Input id="brand-tagline" value={form.tagline} onChange={(e) => set('tagline', e.target.value)} placeholder="Every claim, on the record." />
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-[0.12em] text-muted-foreground mb-1.5">Palette</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                ['primary_color', 'Primary'],
                ['accent_color', 'Accent'],
                ['surface_color', 'Surface'],
                ['ink_color', 'Ink']
              ].map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 border rounded-lg px-2 py-1.5 cursor-pointer">
                  <input
                    type="color"
                    value={form[key]}
                    onChange={(e) => set(key, e.target.value)}
                    className="h-7 w-7 rounded border-0 bg-transparent p-0 cursor-pointer"
                    aria-label={label}
                  />
                  <span className="text-[11px] text-muted-foreground">{label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="brand-heading-font">Heading font family</Label>
              <Input id="brand-heading-font" value={form.heading_font} onChange={(e) => set('heading_font', e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="brand-body-font">Body font family</Label>
              <Input id="brand-body-font" value={form.body_font} onChange={(e) => set('body_font', e.target.value)} />
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
          {note && <p className="text-xs text-bottle flex items-center gap-1.5"><Check className="size-3.5" /> {note}</p>}

          <Button onClick={save} disabled={saving || uploading} className="w-full sm:w-auto">
            {saving && <Loader2 className="size-4 mr-2 animate-spin" />}
            Save brand kit
          </Button>
        </div>
      </div>
    </section>
  );
}