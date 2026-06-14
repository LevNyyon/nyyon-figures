// Smoke test: render one of each template + the cover, assert each PNG is a
// valid, non-trivial image. Run: npm test  (or node smoke-test.mjs)
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FIGURE_TEMPLATES, FIGURE_TEMPLATE_NAMES, FEATURED_TEMPLATE } from './src/templates.js';
import { renderPng } from './src/render.js';

const OUT = join(process.cwd(), 'tmp-smoke');
mkdirSync(OUT, { recursive: true });

const SAMPLE = {
  layers:   { fig_label: 'TEST', layers: [{ band_label: 'BUILD', items: ['A', 'B'], dark: false }, { band_label: 'OPERATE', items: ['C', 'D'], dark: true }], boundary_label: 'BOUNDARY', caption: 'x' },
  contrast: { fig_label: 'TEST', left: { heading: 'OLD', mode: 'chain', nodes: ['A', 'B', 'C'] }, right: { heading: 'NEW', mode: 'hub', center: 'CORE', nodes: ['A', 'B', 'C', 'D'] }, caption: 'x' },
  cycle:    { fig_label: 'TEST', center: 'GOAL', nodes: ['A', 'B', 'C', 'D'], caption: 'x' },
  fanout:   { fig_label: 'TEST', source: 'EVENT', targets: [{ label: 'A', sub: 's' }, { label: 'B', sub: 's' }, { label: 'C', sub: 's' }], caption: 'x' },
  columns:  { fig_label: 'TEST', header: 'ROUTER', columns: [{ title: 'A', items: ['x', 'y'] }, { title: 'B', items: ['x', 'y'] }, { title: 'C', items: ['x'] }], caption: 'x' },
  grid:     { fig_label: 'TEST', panels: [{ title: 'A', rows: ['1', '2'] }, { title: 'B', rows: ['1'] }, { title: 'C', rows: ['1'] }, { title: 'D', rows: ['1'] }], caption: 'x' },
  funnel:   { fig_label: 'TEST', stages: [{ label: 'TOP', sub: '1M' }, { label: 'MID', sub: '10K' }, { label: 'WON', sub: '37' }], caption: 'x' },
  timeline: { fig_label: 'TEST', milestones: [{ label: 'A', sub: 'W0' }, { label: 'B', sub: 'W1' }, { label: 'C', sub: 'W2' }], caption: 'x' },
  quadrant: { fig_label: 'TEST', x_axis: 'X', y_axis: 'Y', quadrants: [{ label: 'A' }, { label: 'B', highlight: true }, { label: 'C' }, { label: 'D' }], caption: 'x' },
  pyramid:  { fig_label: 'TEST', tiers: [{ label: 'APEX', sub: 's' }, { label: 'MID', sub: 's' }, { label: 'BASE', sub: 's' }], caption: 'x' },
  venn:     { fig_label: 'TEST', left_label: 'HUMAN', right_label: 'AI', overlap_label: 'LEVERAGE', caption: 'x' },
  table:    { fig_label: 'TEST', columns: ['A', 'B'], rows: [{ label: 'r1', cells: ['NO', 'YES'] }, { label: 'r2', cells: ['X', 'Y'] }, { label: 'r3', cells: ['X', 'Y'] }], caption: 'x' },
  pipeline: { fig_label: 'TEST', stages: ['A', 'B', 'C', 'D'], stage_caption: 'cap', caption: 'x' },
  radial:   { fig_label: 'TEST', center: 'SPINE', spokes: [{ label: 'A', sub: 's' }, { label: 'B', sub: 's' }, { label: 'C', sub: 's' }, { label: 'D', sub: 's' }], caption: 'x' },
  bigstat:  { fig_label: 'TEST', stats: [{ value: '10X', label: 'a' }, { value: '0', label: 'b' }, { value: '300MS', label: 'c' }], caption: 'x' },
  progression: { fig_label: 'TEST', steps: [{ label: 'A', sub: 's' }, { label: 'B', sub: 's' }, { label: 'C', sub: 's' }], caption: 'x' },
};

let pass = 0, fail = 0;
for (const name of FIGURE_TEMPLATE_NAMES) {
  try {
    const png = await renderPng(FIGURE_TEMPLATES[name].build(SAMPLE[name] || {}), FIGURE_TEMPLATES[name].width);
    if (png.length < 1000 || png[0] !== 0x89 || png[1] !== 0x50) throw new Error('not a valid PNG');
    writeFileSync(join(OUT, `${name}.png`), png);
    console.log(`✓ ${name} (${png.length} bytes)`); pass += 1;
  } catch (e) { console.log(`✗ ${name}: ${e.message}`); fail += 1; }
}
try {
  const png = await renderPng(FEATURED_TEMPLATE.build({ kicker: 'AI-NATIVE MARKETING', title: 'What Is a Marketing Agent vs. a Workflow?', highlight: 'Agent', sub: 'A single-purpose function, not a workflow with better branding.' }), FEATURED_TEMPLATE.width);
  if (png.length < 1000 || png[0] !== 0x89) throw new Error('not a valid PNG');
  writeFileSync(join(OUT, 'cover.png'), png);
  console.log(`✓ cover (${png.length} bytes)`); pass += 1;
} catch (e) { console.log(`✗ cover: ${e.message}`); fail += 1; }

console.log(`\n${pass} passed, ${fail} failed → ${OUT}`);
process.exit(fail ? 1 : 0);
