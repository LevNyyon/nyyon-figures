// Global theme + render settings. EVERYTHING here is overridable three ways:
//   1. env vars (NYYON_FIGURES_*) at startup,
//   2. editing the defaults below,
//   3. the set_theme tool at runtime (adjusts the GLOBAL look for all later renders).
// The shipped DEFAULTS are a neutral editorial look — slate ink on white, a blue
// accent, IBM Plex Sans/Mono — intentionally NOT nyyon's brand.
//
// The themeable tokens are `export let` so set_theme can reassign them; ES module
// live bindings mean templates.js/render.js see the change with no extra wiring.

const env = process.env;
const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;

// ── colors (overridable) ──
export let PAPER       = env.NYYON_FIGURES_PAPER       || '#FFFFFF';
export let INK         = env.NYYON_FIGURES_INK         || '#111827';
export let MUTE        = env.NYYON_FIGURES_MUTE        || '#6B7280';
export let LINE        = env.NYYON_FIGURES_LINE        || '#E5E7EB';
export let CARDHI      = env.NYYON_FIGURES_CARDHI      || '#F3F4F6';
export let ACCENT      = env.NYYON_FIGURES_ACCENT      || '#2563EB';
export let ACCENT_WASH = env.NYYON_FIGURES_ACCENT_WASH || '#DBEAFE';

// ── fonts (family names + the TTF files resvg loads; overridable) ──
export let SANS = env.NYYON_FIGURES_FONT_SANS || 'IBM Plex Sans';
export let MONO = env.NYYON_FIGURES_FONT_MONO || 'IBM Plex Mono';
export let FONT_FILES = env.NYYON_FIGURES_FONT_FILES
  ? env.NYYON_FIGURES_FONT_FILES.split(',').map((s) => s.trim()).filter(Boolean)
  : ['IBMPlexSans-Regular.ttf', 'IBMPlexSans-SemiBold.ttf', 'IBMPlexSans-Bold.ttf', 'IBMPlexMono-Medium.ttf', 'IBMPlexMono-Bold.ttf'];
export let DEFAULT_FONT_FAMILY = env.NYYON_FIGURES_FONT_DEFAULT || SANS;

// ── brand lockup for the featured cover (separate from the theme) ──
export let BRAND_NAME = env.NYYON_FIGURES_BRAND_NAME || 'nyyon';
export let BRAND_URL  = env.NYYON_FIGURES_BRAND_URL  || 'nyyon.com';
export let BRAND_MARK = env.NYYON_FIGURES_BRAND_MARK
  ?? 'M33,0 L64,0 L64,66 L33,50 L33,0 Z M0,4 L31,20 L31,70 L0,70 L0,4 Z';

// ── canvas (fixed) ──
export const W = 1200, H = 675;
export const COVER_W = 1200, COVER_H = 630;

// ── runtime global adjustment ──
function hex(name, v) {
  if (!HEX.test(String(v))) throw new Error(`set_theme: ${name} must be a hex colour like #2563EB (got ${JSON.stringify(v)})`);
  return String(v);
}

// Adjust the GLOBAL theme for all subsequent renders. Returns the new snapshot.
export function setTheme(patch = {}) {
  if (patch.paper       !== undefined) PAPER       = hex('paper', patch.paper);
  if (patch.ink         !== undefined) INK         = hex('ink', patch.ink);
  if (patch.mute        !== undefined) MUTE        = hex('mute', patch.mute);
  if (patch.line        !== undefined) LINE        = hex('line', patch.line);
  if (patch.cardHigh    !== undefined) CARDHI      = hex('cardHigh', patch.cardHigh);
  if (patch.accent      !== undefined) ACCENT      = hex('accent', patch.accent);
  if (patch.accentWash  !== undefined) ACCENT_WASH = hex('accentWash', patch.accentWash);
  if (patch.sans        !== undefined) SANS        = String(patch.sans);
  if (patch.mono        !== undefined) MONO        = String(patch.mono);
  if (patch.fontFiles   !== undefined) {
    if (!Array.isArray(patch.fontFiles) || !patch.fontFiles.length) throw new Error('set_theme: fontFiles must be a non-empty array of TTF paths/names');
    FONT_FILES = patch.fontFiles.map(String);   // render.js reloads buffers when this array identity changes
  }
  if (patch.fontDefault !== undefined) DEFAULT_FONT_FAMILY = String(patch.fontDefault);
  if (patch.brandName   !== undefined) BRAND_NAME = String(patch.brandName);
  if (patch.brandUrl    !== undefined) BRAND_URL  = String(patch.brandUrl);
  if (patch.brandMark   !== undefined) BRAND_MARK = String(patch.brandMark);
  return snapshot();
}

// A live snapshot of the active theme — surfaced by get_settings.
export function snapshot() {
  return {
    about: 'General editorial-diagram + cover renderer. Neutral default theme (slate/blue on white, IBM Plex); re-themeable at startup (env), in code, or at runtime (set_theme).',
    colors: { paper: PAPER, ink: INK, mute: MUTE, line: LINE, cardHigh: CARDHI, accent: ACCENT, accentWash: ACCENT_WASH },
    fonts:  { sans: SANS, mono: MONO, defaultFamily: DEFAULT_FONT_FAMILY, files: FONT_FILES },
    canvas: { figure: { w: W, h: H }, cover: { w: COVER_W, h: COVER_H } },
    brand:  { name: BRAND_NAME, url: BRAND_URL, hasMark: !!BRAND_MARK },
    adjust: 'set_theme changes any of these globally for later renders; env NYYON_FIGURES_* sets them at startup.',
  };
}
