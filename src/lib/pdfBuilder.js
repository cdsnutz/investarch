import { jsPDF } from 'jspdf';

export function buildPdf({ title, subtitle, sections, footer }) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 56;
  const maxW = pageW - margin * 2;
  let y = 76;

  const ensure = (needed) => {
    if (y + needed > pageH - 70) { doc.addPage(); y = 76; }
  };

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.splitTextToSize(title, maxW).forEach((line) => { doc.text(line, margin, y); y += 26; });
  if (subtitle) {
    y += 2;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.splitTextToSize(subtitle, maxW).forEach((line) => { doc.text(line, margin, y); y += 14; });
    doc.setTextColor(0);
  }
  y += 10;
  doc.setLineWidth(1);
  doc.line(margin, y, pageW - margin, y);
  y += 26;

  (sections || []).forEach((s) => {
    ensure(48);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.splitTextToSize(s.heading, maxW).forEach((line) => { ensure(18); doc.text(line, margin, y); y += 17; });
    y += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10.5);
    doc.splitTextToSize(s.body || '', maxW).forEach((line) => { ensure(15); doc.text(line, margin, y); y += 14.5; });
    y += 14;
  });

  const total = doc.internal.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(footer || title, margin, pageH - 32);
    doc.text(`${i} / ${total}`, pageW - margin, pageH - 32, { align: 'right' });
  }

  return doc.output('arraybuffer');
}