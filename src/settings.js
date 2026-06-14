// Global brand settings for nyyon-figures. Edit here to re-theme every diagram
// and the cover at once. The accent is a single token used as a "signal"; it
// can also be overridden at runtime via the NYYON_FIGURES_ACCENT env var.

export const PAPER       = process.env.NYYON_FIGURES_PAPER  || '#FAFAF9'; // warm paper background
export const INK         = process.env.NYYON_FIGURES_INK    || '#0A0A0A'; // near-black, primary
export const MUTE        = '#78716C'; // warm gray, secondary text
export const LINE        = '#E7E5E4'; // hairlines / faint strokes
export const CARDHI      = '#F5F5F4'; // subtle card fill
export const ACCENT      = process.env.NYYON_FIGURES_ACCENT || '#6C5CE7'; // THE accent — cool blue-violet (nyyonai brand)
export const ACCENT_WASH = '#ECE9FD'; // faint accent wash

export const SANS = 'Inter';
export const MONO = 'JetBrains Mono';

// ── brand lockup for the featured cover ──
// The diagrams are brand-agnostic; only the cover carries a wordmark + URL.
// These default to nyyon but are fully overridable so the cover works for any
// brand (or none). BRAND_MARK is an SVG path drawn in a ~64x70 box; set it to
// "" for a text-only wordmark and a plain accent hub.
export const BRAND_NAME = process.env.NYYON_FIGURES_BRAND_NAME || 'nyyon';
export const BRAND_URL  = process.env.NYYON_FIGURES_BRAND_URL  || 'nyyon.com';
export const BRAND_MARK = process.env.NYYON_FIGURES_BRAND_MARK
  ?? 'M33,0 L64,0 L64,66 L33,50 L33,0 Z M0,4 L31,20 L31,70 L0,70 L0,4 Z';

export const W = 1200, H = 675;             // figure canvas (16:9)
export const COVER_W = 1200, COVER_H = 630; // featured cover (OG ratio)

// Font files (relative to the package root) registered with resvg at render.
export const FONT_FILES = [
  'Inter-Regular.ttf', 'Inter-SemiBold.ttf', 'Inter-Bold.ttf',
  'JetBrainsMono-Medium.ttf', 'JetBrainsMono-Bold.ttf',
];

// A read-only snapshot of the active theme — surfaced by the get_settings tool.
export const SETTINGS = {
  about: 'General editorial-diagram + cover renderer. Paper/ink system with a single accent. Brand-themeable; defaults to nyyon\'s look.',
  colors: { paper: PAPER, ink: INK, mute: MUTE, line: LINE, cardHigh: CARDHI, accent: ACCENT, accentWash: ACCENT_WASH },
  fonts:  { sans: SANS, mono: MONO, files: FONT_FILES },
  canvas: { figure: { w: W, h: H }, cover: { w: COVER_W, h: COVER_H } },
  brand:  { name: BRAND_NAME, url: BRAND_URL, hasMark: !!BRAND_MARK },
  overrides: {
    NYYON_FIGURES_ACCENT:     'override the accent hex',
    NYYON_FIGURES_PAPER:      'override the paper/background hex',
    NYYON_FIGURES_INK:        'override the ink/foreground hex',
    NYYON_FIGURES_BRAND_NAME: 'wordmark text on the cover (default "nyyon")',
    NYYON_FIGURES_BRAND_URL:  'URL printed on the cover (default "nyyon.com")',
    NYYON_FIGURES_BRAND_MARK: 'SVG path (~64x70 box) for the logo mark; "" = text-only wordmark',
    NYYON_FIGURES_OUT:        'directory to write rendered PNGs into',
  },
};
