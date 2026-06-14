// resvg-wasm renderer (Node). Initializes the WASM module once and registers
// the bundled brand fonts, then rasterizes an SVG string to a PNG buffer at 2x.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, isAbsolute } from 'node:path';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

import { FONT_FILES, DEFAULT_FONT_FAMILY } from './settings.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// A font file is either an absolute path or a filename under assets/fonts.
const fontPath = (f) => (isAbsolute(f) ? f : join(ROOT, 'assets', 'fonts', f));

let ready = null;
let fontBuffers = null;
let loadedRef = null;   // identity of the FONT_FILES array we last loaded

async function ensureReady() {
  if (!ready) {
    const wasm = readFileSync(join(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm'));
    ready = initWasm(wasm);
  }
  await ready;
  // FONT_FILES is a live binding; set_theme reassigns it to a new array, so
  // reload the buffers whenever the array identity changes.
  if (loadedRef !== FONT_FILES) {
    fontBuffers = FONT_FILES.map((f) => readFileSync(fontPath(f)));
    loadedRef = FONT_FILES;
  }
}

// svg string + intended logical width → PNG Buffer (rendered at 2x for crispness).
// Hard cap on SVG size: a well-formed figure is a few KB; anything past 256KB is
// pathological input (oversized labels / array amplification) and is refused
// before it can pin the single-threaded rasterizer.
const MAX_SVG_BYTES = 262144;

export async function renderPng(svg, width) {
  if (typeof svg !== 'string') throw new Error('renderPng: svg must be a string');
  if (svg.length > MAX_SVG_BYTES) throw new Error(`figure too large (${svg.length} bytes; max ${MAX_SVG_BYTES}) — inputs likely oversized`);
  await ensureReady();
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: DEFAULT_FONT_FAMILY },
  });
  return Buffer.from(resvg.render().asPng());
}
