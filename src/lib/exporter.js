export function downloadFile(filename, content, mime = 'application/json') {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function toCsv(rows) {
  if (!rows.length) return '';
  const cols = Array.from(new Set(rows.flatMap((r) => Object.keys(r))));
  const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  return [cols.join(','), ...rows.map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
}

export function copyText(text) {
  if (navigator.clipboard) return navigator.clipboard.writeText(text);
  return Promise.resolve();
}

export function slugify(text) {
  return String(text || 'untitled').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase();
}