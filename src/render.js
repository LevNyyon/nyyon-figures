// resvg-wasm renderer (Node). Initializes the WASM module once and registers
// the bundled brand fonts, then rasterizes an SVG string to a PNG buffer at 2x.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initWasm, Resvg } from '@resvg/resvg-wasm';

import { FONT_FILES } from './settings.js';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

let ready = null;
let fontBuffers = null;

async function ensureReady() {
  if (!ready) {
    const wasm = readFileSync(join(ROOT, 'node_modules/@resvg/resvg-wasm/index_bg.wasm'));
    ready = initWasm(wasm);
    fontBuffers = FONT_FILES.map((f) => readFileSync(join(ROOT, 'assets', 'fonts', f)));
  }
  await ready;
}

// svg string + intended logical width → PNG Buffer (rendered at 2x for crispness).
export async function renderPng(svg, width) {
  await ensureReady();
  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: width * 2 },
    font: { fontBuffers, loadSystemFonts: false, defaultFontFamily: 'Inter' },
  });
  return Buffer.from(resvg.render().asPng());
}
