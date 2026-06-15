// Turns a static figure SVG into a self-animating one. No JS, no deps: a shared
// <style> block (enter → hold → exit on an 8s loop, smooth easing, respects
// prefers-reduced-motion) wraps each drawn element in a staggered reveal, and a
// few "traveling" templates get a signature dot gliding a path (SMIL
// animateMotion). Pure string transform.
//
// resvg only ever rasterizes frame 0, so the PNG render path never calls this —
// it operates on the same SVG string the templates already emit.

import { ACCENT, W } from './settings.js';

const LOOP = 8;            // seconds — one full enter → hold → exit cycle
const STEP = 0.06;         // seconds of stagger between consecutive elements
const MAX_STAGGER = 1.4;   // cap so dense figures don't crawl in forever

// One top-level SVG element: self-closing `<tag .../>` or paired `<tag …>…</tag>`.
// The generated figures are flat (no nested same-tag) and attribute values never
// contain '>', so this is unambiguous for our own output. \1 backrefs the tag.
const EL = /<(\w+)\b[^>]*?(?:\/>|>[\s\S]*?<\/\1>)/g;

function styleBlock() {
  return `<style>`
    + `@keyframes nyf-rev{0%{opacity:0;transform:translateY(10px)}8%{opacity:1;transform:translateY(0)}`
    + `82%{opacity:1;transform:translateY(0)}90%{opacity:0;transform:translateY(-8px)}100%{opacity:0;transform:translateY(-8px)}}`
    + `@keyframes nyf-app{0%{opacity:0}12%{opacity:1}78%{opacity:1}88%{opacity:0}100%{opacity:0}}`
    + `.nyf-r{animation:nyf-rev ${LOOP}s ease-in-out infinite both}`
    + `.nyf-m{opacity:0;animation:nyf-app ${LOOP}s ease-in-out infinite both}`
    + `@media(prefers-reduced-motion:reduce){.nyf-r,.nyf-m{animation:none;opacity:1}}`
    + `</style>`;
}

// A signature element gliding the figure's own geometry — only for the templates
// where motion IS the idea. Geometry mirrors the constants in templates.js
// (midY 360; ring radii; centre = W/2), so it tracks any re-theme of W.
function signature(name) {
  const cx = Math.round(W / 2);
  const dot = (path, r = 11) =>
    `<circle class="nyf-m" r="${r}" fill="${ACCENT}">`
    + `<animateMotion dur="${LOOP}s" repeatCount="indefinite" calcMode="linear"`
    + ` keyPoints="0;0;1;1" keyTimes="0;0.14;0.78;1" path="${path}"/></circle>`;
  if (name === 'timeline') return dot(`M150,360 H${W - 158}`);                 // ball runs the axis
  if (name === 'cycle')    return dot(`M${cx},165 a195,195 0 1,1 -0.01,0`, 10); // dot orbits the ring
  if (name === 'radial')   return dot(`M${cx},150 a210,210 0 1,1 -0.01,0`, 9);  // dot circles the hub
  return '';
}

// staticSvg + template name → animated SVG. Falls back to the input unchanged if
// the markup doesn't look like our figures.
export function animateSvg(svg, name) {
  if (typeof svg !== 'string') return svg;
  const open = svg.indexOf('>') + 1;        // end of the `<svg …>` open tag
  const close = svg.lastIndexOf('</svg>');
  if (open <= 0 || close < 0) return svg;
  const head = svg.slice(0, open);
  const body = svg.slice(open, close);

  let seen = 0, idx = 0;
  const wrapped = body.replace(EL, (m, tag) => {
    seen += 1;
    if (tag === 'rect' && seen <= 2) return m;            // bg + frame border stay still
    const delay = Math.min(idx * STEP, MAX_STAGGER);
    idx += 1;
    return `<g class="nyf-r" style="animation-delay:${delay.toFixed(2)}s">${m}</g>`;
  });

  return head + styleBlock() + wrapped + signature(name) + '</svg>';
}
