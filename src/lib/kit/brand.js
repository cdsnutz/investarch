// The brand kit that every generated codebase is built from. One kit per operator,
// resolved into concrete tokens once here so the CSS, the HTML head and the React
// screens can never disagree about the palette, the logo or the type.

export const BRAND_DEFAULTS = {
  brand_name: 'InvestArch',
  tagline: '',
  logo_url: '',
  primary_color: '#1a3c34',
  accent_color: '#9a3b2e',
  surface_color: '#fbfaf7',
  ink_color: '#0f1115',
  heading_font: 'Georgia, "Times New Roman", serif',
  body_font: 'system-ui, -apple-system, "Segoe UI", sans-serif',
  support_email: ''
};

const HEX = /^#[0-9a-f]{6}$/i;

const safeHex = (value, fallback) => (HEX.test(String(value || '').trim()) ? String(value).trim().toLowerCase() : fallback);

const rgb = (hex) => {
  const clean = safeHex(hex, '#000000').slice(1);
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16));
};

// Readable ink for text sitting on the primary colour.
function inkOn(hex) {
  const [r, g, b] = rgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminance > 0.45 ? '#0f1115' : '#ffffff';
}

const cleanFont = (value, fallback) => {
  const font = String(value || '').replace(/[^a-zA-Z0-9\s,'"\-]/g, '').trim();
  return font.length > 2 ? font : fallback;
};

const cleanText = (value, max) => String(value ?? '').replace(/[<>]/g, '').trim().slice(0, max);

export function normalizeBrand(brand, seed) {
  const source = brand || {};
  const primary = safeHex(source.primary_color, BRAND_DEFAULTS.primary_color);
  return {
    name: cleanText(source.brand_name, 60) || cleanText(seed?.title, 60) || BRAND_DEFAULTS.brand_name,
    tagline: cleanText(source.tagline, 140),
    logo: /^https:\/\/\S+$/.test(String(source.logo_url || '').trim()) ? String(source.logo_url).trim() : '',
    primary,
    onPrimary: inkOn(primary),
    accent: safeHex(source.accent_color, BRAND_DEFAULTS.accent_color),
    surface: safeHex(source.surface_color, BRAND_DEFAULTS.surface_color),
    ink: safeHex(source.ink_color, BRAND_DEFAULTS.ink_color),
    headingFont: cleanFont(source.heading_font, BRAND_DEFAULTS.heading_font),
    bodyFont: cleanFont(source.body_font, BRAND_DEFAULTS.body_font),
    supportEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(source.support_email || '').trim())
      ? String(source.support_email).trim()
      : ''
  };
}

export function buildBrandClientModule(brand) {
  return `// Generated from the brand kit saved in the InvestArch IP Factory. Edit these values to rebrand.
export const BRAND = ${JSON.stringify(
    {
      name: brand.name,
      tagline: brand.tagline,
      logo: brand.logo,
      primary: brand.primary,
      accent: brand.accent,
      surface: brand.surface,
      ink: brand.ink,
      headingFont: brand.headingFont,
      bodyFont: brand.bodyFont,
      supportEmail: brand.supportEmail
    },
    null,
    2
  )};
`;
}

export function buildBrandDoc(brand, seed) {
  return `# ${brand.name}: brand assets

Everything in this repository that shows the brand reads \`src/brand.js\`. Change a value there, or in the IP Factory brand kit, and the palette, type, logo and page titles follow.

| Token | Value | Used by |
| --- | --- | --- |
| Brand name | ${brand.name} | \`index.html\` title, shell header, landing page |
| Tagline | ${brand.tagline || '(none set)'} | landing page hero |
| Logo | ${brand.logo || '(none uploaded, the name renders as a wordmark)'} | shell header, landing hero, favicon |
| Primary | ${brand.primary} | buttons, links, focus rings |
| Accent | ${brand.accent} | destructive actions, warnings |
| Surface | ${brand.surface} | page background |
| Ink | ${brand.ink} | body text |
| Heading font | ${brand.headingFont} | \`h1\` to \`h3\`, wordmark |
| Body font | ${brand.bodyFont} | paragraphs, controls |
${brand.supportEmail ? `| Support email | ${brand.supportEmail} | landing page footer |\n` : ''}
## The logo file

The logo is referenced by its absolute URL rather than committed as a binary, so a rebrand does not require a new commit. To vendor it instead: download the file, drop it at \`public/logo\`, and set \`logo\` in \`src/brand.js\` to \`/logo\`. Fonts stay as the CSS families named above, so no font files ship and no licence is implied.

Application: ${seed?.title || 'untitled asset'}.
`;
}

export function buildBrandFiles(seed, brand) {
  return [
    { path: 'src/brand.js', content: buildBrandClientModule(brand) },
    { path: 'brand/BRAND.md', content: buildBrandDoc(brand, seed) }
  ];
}