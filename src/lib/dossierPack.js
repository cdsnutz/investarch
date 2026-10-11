import JSZip from 'jszip';
import { buildPdf } from '@/lib/pdfBuilder';

function splitIntoSections(text) {
  const sections = [];
  let current = null;
  (text || '').split('\n').forEach((line) => {
    const match = line.match(/^(#{1,4})\s+(.*)/);
    if (match) {
      if (current) sections.push(current);
      current = { heading: match[2].trim(), body: '' };
    } else if (!current) {
      current = { heading: 'Overview', body: line };
    } else {
      current.body += (current.body ? '\n' : '') + line;
    }
  });
  if (current) sections.push(current);
  return sections.map((s) => ({ heading: s.heading, body: s.body.trim() })).filter((s) => s.heading || s.body);
}

export async function buildDossierPack({ seed, filings, prospectus, codebase }) {
  const zip = new JSZip();
  const base = (seed.title || 'IP-Asset').replace(/[^\w\s-]/g, '').trim() || 'IP-Asset';

  const byType = {};
  (filings || []).forEach((f) => { if (!byType[f.filing_type]) byType[f.filing_type] = f; });

  if (byType.patent) {
    const p = byType.patent;
    const sections = [
      { heading: 'Abstract', body: p.abstract || '' },
      { heading: 'Claims', body: p.claims || '' },
      { heading: 'Detailed Description', body: p.detailed_description || '' },
      ...(p.prior_art_note ? [{ heading: 'Prior Art Note', body: p.prior_art_note }] : [])
    ];
    zip.file(`${base}/01_Patent_Application_Draft.pdf`, buildPdf({
      title: `Patent Application Draft: ${seed.title}`,
      subtitle: 'Confidential instrument draft, prepared by InvestArch IP Factory',
      sections,
      footer: 'Patent Application Draft — Confidential'
    }));
  }

  if (byType.trademark) {
    const t = byType.trademark;
    const sections = [
      { heading: 'Brand Name', body: t.brand_name || '' },
      { heading: 'Trademark Classes', body: t.trademark_classes || '' },
      { heading: 'Logo Concepts', body: t.logo_concepts || '' },
      ...(t.clearance_note ? [{ heading: 'Clearance Note', body: t.clearance_note }] : [])
    ];
    zip.file(`${base}/02_Trademark_Filing_Packet.pdf`, buildPdf({
      title: `Trademark Filing Packet: ${seed.title}`,
      subtitle: 'Confidential instrument draft, prepared by InvestArch IP Factory',
      sections,
      footer: 'Trademark Filing Packet — Confidential'
    }));
  }

  if (byType.deed) {
    const d = byType.deed;
    zip.file(`${base}/03_Deed_of_Ownership.pdf`, buildPdf({
      title: `Deed of Ownership: ${seed.title}`,
      subtitle: 'Confidential instrument draft, prepared by InvestArch IP Factory',
      sections: splitIntoSections(d.deed_text),
      footer: 'Deed of Ownership — Confidential'
    }));
  }

  if (codebase?.files?.length) {
    (codebase.files || []).forEach((f) => zip.file(`${base}/Codebase/${f.path}`, f.content));
    zip.file(`${base}/Codebase/Developer_Onboarding_Guide.md`, codebase.onboarding_guide || '');
    zip.file(`${base}/Codebase/User_Manual.md`, codebase.user_manual || '');
  }

  if (codebase?.onboarding_guide) {
    zip.file(`${base}/04_Developer_Onboarding_Guide.pdf`, buildPdf({
      title: `Developer Onboarding Guide: ${seed.title}`,
      subtitle: 'Architecture, setup and extension points for the engineering team',
      sections: splitIntoSections(codebase.onboarding_guide),
      footer: 'Developer Onboarding Guide — Confidential'
    }));
  }

  if (prospectus) {
    const sections = [
      { heading: 'Prospectus', body: prospectus.prospectus || '' },
      ...(Array.isArray(prospectus.targets) && prospectus.targets.length ? [{
        heading: 'Named Targets',
        body: prospectus.targets.map((t) => `${t.name}${t.rationale ? ' — ' + t.rationale : ''}`).join('\n')
      }] : []),
      ...(prospectus.lead_contact ? [{ heading: 'Lead Contact', body: prospectus.lead_contact }] : []),
      ...(prospectus.offer_terms ? [{ heading: `Offer Terms (${prospectus.offer_type})`, body: prospectus.offer_terms }] : [])
    ];
    zip.file(`${base}/05_Liquidation_Prospectus.pdf`, buildPdf({
      title: `Liquidation Prospectus: ${seed.title}`,
      subtitle: `Offer type: ${prospectus.offer_type || 'licensing'}. Confidential, prepared by InvestArch IP Factory`,
      sections,
      footer: 'Liquidation Prospectus — Confidential'
    }));
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  return blob;
}