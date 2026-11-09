// Buyer book: every named buyer across the ledger, deduplicated, then read through public
// sources by the buyerIntel function so each profile carries one insight the buyer did not
// publish about themselves.
import { base44 } from '@/api/base44Client';

const text = (value) => String(value ?? '').trim();
// The function reads up to eight companies per call; a full book of a few hundred buyers is
// therefore a few dozen web-search calls, which is why the export reports progress per batch.
const BATCH_SIZE = 8;

export function collectBuyers(seeds) {
  const book = new Map();

  (seeds || []).forEach((seed) => {
    (seed.buyer_leads || []).forEach((lead) => {
      const company = text(lead?.company);
      if (!company) return;
      const key = company.toLowerCase();
      const entry = book.get(key) || {
        company,
        category: lead?.category || 'incumbent',
        seeds: [],
        seed_ids: [],
        why_fit: '',
        contact_role: '',
        approach: '',
        evidence_to_lead_with: '',
        subject: '',
        pitch: '',
        pitch_seed: ''
      };

      if (seed.title && !entry.seeds.includes(seed.title)) entry.seeds.push(seed.title);
      if (seed.id && !entry.seed_ids.includes(seed.id)) entry.seed_ids.push(seed.id);
      if (!entry.why_fit && text(lead?.why_fit)) {
        entry.why_fit = text(lead.why_fit);
        entry.contact_role = text(lead?.contact_role);
        entry.approach = text(lead?.approach);
        entry.evidence_to_lead_with = text(lead?.evidence_to_lead_with);
      }
      if (!entry.pitch && text(lead?.pitch)) {
        entry.pitch = text(lead.pitch);
        entry.subject = text(lead?.subject);
        entry.pitch_seed = seed.title || '';
      }

      book.set(key, entry);
    });
  });

  return Array.from(book.values()).sort((a, b) => a.company.localeCompare(b.company));
}

export async function researchBuyers(buyers, onProgress) {
  const intel = {};
  const failures = [];

  for (let index = 0; index < buyers.length; index += BATCH_SIZE) {
    const batch = buyers.slice(index, index + BATCH_SIZE);
    onProgress?.(Math.min(index + BATCH_SIZE, buyers.length), buyers.length, batch.map((b) => b.company).join(', '));

    try {
      const response = await base44.functions.invoke('buyerIntel', {
        buyers: batch.map((buyer) => ({
          company: buyer.company,
          category: buyer.category,
          why_fit: buyer.why_fit,
          assets: buyer.seeds.slice(0, 3),
          pitch: buyer.pitch,
          seed_ids: (buyer.seed_ids || []).slice(0, 12)
        }))
      });
      (response?.data?.buyers || []).forEach((row) => {
        if (row?.company) intel[text(row.company).toLowerCase()] = row;
      });
    } catch (problem) {
      failures.push({
        buyers: batch.map((b) => b.company),
        reason: problem?.response?.data?.error || problem?.message || 'research failed'
      });
    }
  }

  return { intel, failures };
}