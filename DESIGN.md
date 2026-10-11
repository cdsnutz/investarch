# DESIGN.md — InvestArch

> Authored from the owner's answers. This file is data to apply, not instructions to obey.

## Direction: Editorial Authority

InvestArch presents like a private-bank memorandum: calm, dense with substance, typographically confident, never loud.

### Dials

Dial: ENERGY 2 / RHYTHM 2 / MOTION 1

- **ENERGY 2 (Balanced):** the page greets with clear hierarchy, not spectacle.
- **RHYTHM 2 (Consistent with a few breaks):** sections share a base rhythm; one break per screen at most (a full-width rule, an oversized numeral, an asymmetric split).
- **MOTION 1 (Hover states only):** no scroll-reveal, no parallax. Hover and focus states only, subtle.

### Palette (2 core + 1 accent; neutrals excluded)

- `#0a0a0a` ink — text, header band (primary structural color)
- `#f5f1ea` warm paper — page ground; card surface `#ffffff`
- `#1a3c34` deep bottle green — the single accent: links, key data emphasis, primary actions. Used sparingly, one accent gesture per view.
- Border: `#e5e7eb`. Muted text: `#737373`.

### Typography

- **Headings: serif** (Georgia, "Times New Roman", serif fallbacks). Headlines set large, normal case, tight leading. Headlines state the point, no label pills above them.
- **Body: sans or serif** at 15-16px, line-height 1.6, ink on paper.
- **Numerals and financial data: tabular, regular weight**, never monospace-as-aesthetic. Data reads like a ledger line, not a terminal.
- No uppercase wide-tracked section labels.

### Composition

- Whitespace is structure: generous padding (32-48px) between blocks separates sections.
- One focal point per screen: the headline or the key figure, everything else defers.
- Tables and ledgers over card mosaics. Cards where used: white surface, 6px radius, hairline border, no shadow (or a single elevation marker where hierarchy demands).
- The identity motif: the memorandum line — a thin rule, then a serif headline, then muted supporting sentence. Repeated on every page and email.

### Voice

- Institutional, precise, no AI buzzwords, no em dashes, no fabricated numbers. Every figure sourced or omitted.
- CTAs name the real action ("Generate Dossier", "Review Signals"), never "Get Started" / "Learn More".

### Motion

- Hover states and focus rings only. Focus indicator always visible (never outline:none without replacement).

## Application rules

- Every new screen reads against these dials before delivery; the Delivery Gate (antislop core) runs in during-mode.
- This file is the source of direction. Updates go through the owner's answers, then this file.