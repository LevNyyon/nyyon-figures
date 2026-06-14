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

export const W = 1200, H = 675;             // figure canvas (16:9)
export const COVER_W = 1200, COVER_H = 630; // featured cover (OG ratio)

// Font files (relative to the package root) registered with resvg at render.
export const FONT_FILES = [
  'Inter-Regular.ttf', 'Inter-SemiBold.ttf', 'Inter-Bold.ttf',
  'JetBrainsMono-Medium.ttf', 'JetBrainsMono-Bold.ttf',
];

// A read-only snapshot of the active theme — surfaced by the get_settings tool.
export const SETTINGS = {
  brand: 'nyyon — paper/ink editorial system with a single cool-purple accent',
  colors: { paper: PAPER, ink: INK, mute: MUTE, line: LINE, cardHigh: CARDHI, accent: ACCENT, accentWash: ACCENT_WASH },
  fonts:  { sans: SANS, mono: MONO, files: FONT_FILES },
  canvas: { figure: { w: W, h: H }, cover: { w: COVER_W, h: COVER_H } },
  overrides: {
    NYYON_FIGURES_ACCENT: 'override the accent hex',
    NYYON_FIGURES_PAPER:  'override the paper/background hex',
    NYYON_FIGURES_INK:    'override the ink/foreground hex',
    NYYON_FIGURES_OUT:    'directory to write rendered PNGs into',
  },
};
