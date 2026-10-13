// House no-slop filter: strips AI-isms, marketing filler and hedging boilerplate before render.
const PATTERNS = [
  /\bI hope (this|that) helps[^.!?\n]*[.!?]?/gi,
  /\b(Let me know|Feel free to (reach out|ask))[^.!?\n]*[.!?]?/gi,
  /\b(As an AI|As a language model)[^.!?\n]*[.!?]?/gi,
  /\b(Certainly|Absolutely|Of course|Great question)[!,.]\s*/gi,
  /\b(In conclusion|In summary|To sum up|Overall),\s*/gi,
  /\bIt(?:'s| is) (important|worth) (to note|noting) that\s*/gi,
  /\b(In today's (fast-paced|ever-changing|rapidly evolving) [a-z\s-]+?),\s*/gi,
  /\b(game-?changing|cutting-edge|revolutionary|world-class|best-in-class|seamless(ly)?|synerg(y|ies|istic))\s*/gi,
  /\b(delve into|unlock the (full )?potential of|leverage the power of)\s*/gi,
  /\b(arguably|potentially|it could be said that|to some extent)\s*/gi
];

export function scrub(text) {
  if (typeof text !== 'string') return text;
  let out = text;
  PATTERNS.forEach((re) => { out = out.replace(re, ''); });
  return out.replace(/[ \t]{2,}/g, ' ').replace(/\n{3,}/g, '\n\n').replace(/(^|[.!?]\s+)([a-z])/g, (m, p, c) => p + c.toUpperCase()).trim();
}

export function scrubDeep(value) {
  if (typeof value === 'string') return scrub(value);
  if (Array.isArray(value)) return value.map(scrubDeep);
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, scrubDeep(v)]));
  return value;
}