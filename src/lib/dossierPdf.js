// Renders the dossier documents of one seed as PDFs.
//
// The bulk archive writes each dossier document as Markdown. This module turns the same
// structure (an H1 title, an italic subtitle, H2 sections) into a set of paginated PDFs,
// one per document, so a seed can ship as a print-ready set instead of plain text.
import { buildPdf } from '@/lib/pdfBuilder';

const text = (value) => String(value ?? '').trim();

export function parseDossier(markdown) {
  const lines = String(markdown || '').split('\n');
  let title = '';
  let subtitle = '';
  const sections = [];
  let current = null;

  lines.forEach((raw) => {
    const trimmed = raw.trim();
    if (!trimmed) {
      if (current) current.body.push('');
      return;
    }
    if (!title && trimmed.startsWith('# ')) {
      title = trimmed.slice(2).trim();
      return;
    }
    if (!subtitle && !sections.length && /^_.+_$/.test(trimmed)) {
      subtitle = trimmed.slice(1, -1).trim();
      return;
    }
    const heading = trimmed.match(/^#{2,4}\s+(.*)$/);
    if (heading) {
      current = { heading: heading[1].replace(/\*\*/g, '').trim(), body: [] };
      sections.push(current);
      return;
    }
    if (!current) {
      current = { heading: 'Overview', body: [] };
      sections.push(current);
    }
    current.body.push(trimmed.replace(/\*\*/g, '').replace(/^[-*]\s+/, '· ').replace(/^(\d+)\.\s+/, '$1. '));
  });

  return {
    title: title || 'Dossier',
    subtitle,
    sections: sections
      .map((section) => ({ heading: section.heading, body: text(section.body.join('\n')) }))
      .filter((section) => section.body)
  };
}

export function dossierPdf(markdown, { footer } = {}) {
  const parsed = parseDossier(markdown);
  return buildPdf({
    title: parsed.title,
    subtitle: parsed.subtitle,
    sections: parsed.sections,
    footer: footer || parsed.title
  });
}

export function renderDossierPdfs(entries, footer) {
  return (entries || []).map((entry) => (
    entry.path.startsWith('Dossier/') && entry.path.endsWith('.md')
      ? { path: entry.path.replace(/\.md$/, '.pdf'), content: dossierPdf(entry.content, { footer }) }
      : entry
  ));
}