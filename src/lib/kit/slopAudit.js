// Antislop pass over a generated codebase: every file is scanned for house-rule
// violations (AI-isms, marketing filler, hedging). Each finding names the file,
// the offending phrase and the rule that caught it, so it can be patched.
import { SLOP_PATTERNS } from '@/lib/noSlop';

const RULES = [
  'assistant filler',
  'assistant filler',
  'assistant self-reference',
  'assistant opener',
  'summary scaffolding',
  'hedging preface',
  'generic era opener',
  'adjectives standing in for facts',
  'inflated verb',
  'hedging qualifier'
];

export function slopAudit(files) {
  const issues = [];
  for (const file of files || []) {
    const content = typeof file?.content === 'string' ? file.content : '';
    if (!content) continue;
    SLOP_PATTERNS.forEach((pattern, index) => {
      const re = new RegExp(pattern.source, pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`);
      for (const match of content.matchAll(re)) {
        const phrase = String(match[0]).trim();
        if (!phrase) continue;
        issues.push({
          file: file.path,
          phrase,
          rule: RULES[index] || 'house rule'
        });
      }
    });
  }
  return {
    clean: issues.length === 0,
    issues,
    files: (files || []).length
  };
}