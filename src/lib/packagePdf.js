import { jsPDF } from 'jspdf';

function writeBody(doc, text, M, maxW, pageH, state) {
  if (!text) return;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10.5);
  doc.setTextColor(30, 30, 30);
  for (const line of String(text).split('\n')) {
    const trimmed = line.trim();
    if (!trimmed) { state.y += 6; continue; }
    const bullet = trimmed.startsWith('- ') || trimmed.startsWith('* ');
    const content = bullet ? trimmed.slice(2) : trimmed;
    const wrapped = doc.splitTextToSize(content, maxW - (bullet ? 16 : 0));
    const h = wrapped.length * 14 + 4;
    if (state.y + h > pageH - M) { doc.addPage(); state.y = M; }
    if (bullet) {
      doc.text('\u2022', M + 2, state.y);
      doc.text(wrapped, M + 16, state.y);
    } else {
      doc.text(wrapped, M, state.y);
    }
    state.y += h;
  }
  state.y += 8;
}

export default function makePdf({ title, subtitle = '', sections = [] }) {
  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const M = 56;
  const maxW = pageW - M * 2;
  const state = { y: 0 };

  doc.setFillColor(17, 17, 17);
  doc.rect(0, 0, pageW, 92, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(17);
  doc.text(title, M, 42, { maxWidth: maxW });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(190, 190, 190);
  doc.text(subtitle || 'InvestArch Investment Readiness Package', M, 64, { maxWidth: maxW });
  state.y = 126;

  for (const s of sections) {
    if (!s) continue;
    if (state.y + 60 > pageH - M) { doc.addPage(); state.y = M; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(10, 10, 10);
    const headingLines = doc.splitTextToSize(s.heading || '', maxW);
    headingLines.forEach((hl, i) => doc.text(hl, M, state.y + i * 16));
    state.y += headingLines.length * 16 + 6;
    writeBody(doc, s.body, M, maxW, pageH, state);
  }
  return doc;
}