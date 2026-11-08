import { Badge } from '@/components/ui/badge';
import { Layers } from 'lucide-react';
import { SeedBody } from '@/components/ipFactory/SeedDetail';

export default function EcosystemRanking({ ecosystems, filingsBySeed, prospectusBySeed, onRefresh, brand }) {
  if (!ecosystems?.length) return null;

  return (
    <section className="mb-6">
      <div className="flex items-center gap-2 mb-3">
        <Layers className="size-4 text-emerald-600" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Top ranked ecosystems</h2>
      </div>
      <div className="space-y-4 sm:space-y-6">
        {ecosystems.map((seed, index) => (
          <div key={seed.id} className="rounded-xl border-2 border-emerald-300/70 bg-emerald-50/30 p-4 sm:p-6">
            <div className="mb-3">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge className="bg-emerald-700 text-white">Ecosystem #{index + 1}</Badge>
                {Number.isFinite(Number(seed.mix_score)) && (
                  <Badge variant="secondary" className="bg-emerald-100 text-emerald-900">Compounding {seed.mix_score}/10</Badge>
                )}
                <Badge variant="secondary" className="bg-card">Asym {seed.asymmetric_score}/10</Badge>
                {seed.source_seed_titles?.length > 0 && (
                  <span className="text-xs text-muted-foreground">{seed.source_seed_titles.join(' + ')}</span>
                )}
              </div>
              <h3 className="text-lg sm:text-xl font-semibold leading-snug break-words">{seed.title}</h3>
              {seed.mix_thesis && <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{seed.mix_thesis}</p>}
            </div>
            <SeedBody
              seed={seed}
              filings={filingsBySeed[seed.id] || []}
              prospectus={prospectusBySeed[seed.id]}
              onRefresh={onRefresh}
              brand={brand}
            />
          </div>
        ))}
      </div>
    </section>
  );
}