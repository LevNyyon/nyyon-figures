#!/usr/bin/env node
// nyyon-figures — a local MCP server that renders nyyon's editorial diagrams and
// featured covers from a spec. It ships three things: the TEMPLATES (16 diagram
// shapes + a cover), the global brand SETTINGS (paper/ink + one cool-purple
// accent), and the REASONING prompt (how to map an article to a figure set).
//
// It does no network calls and runs no model: the calling agent reads the
// reasoning prompt, decides which templates/slots to use, then calls the render
// tools. PNGs are written locally and the path is returned.

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { writeFileSync, mkdirSync, realpathSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve, sep } from 'node:path';

import { FIGURE_TEMPLATES, FIGURE_TEMPLATE_NAMES, FEATURED_TEMPLATE } from './templates.js';
import { renderPng } from './render.js';
import { snapshot, setTheme } from './settings.js';
import { buildArticleBrief } from './reasoning.js';

const OUT_DIR = process.env.NYYON_FIGURES_OUT || join(tmpdir(), 'nyyon-figures');
let seq = 0;

function slug(s) {
  return String(s || 'figure').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'figure';
}

// Confine any caller-supplied path to OUT_DIR. resolve() collapses ".." and
// absorbs absolute paths; we then assert the result stays under the (symlink-
// resolved) root. Defeats path traversal and absolute-path writes.
function safeUnder(candidate) {
  mkdirSync(OUT_DIR, { recursive: true });
  const base = realpathSync(OUT_DIR);
  const r = resolve(base, candidate || '.');
  if (r !== base && !r.startsWith(base + sep)) {
    throw new Error('out_path escapes the output directory');
  }
  return r;
}

function resolveOut(outPath, fallbackName) {
  if (outPath) return safeUnder(outPath);
  mkdirSync(OUT_DIR, { recursive: true });
  seq += 1;
  return join(OUT_DIR, `${fallbackName}-${Date.now()}-${seq}.png`);
}

function jsonContent(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

const server = new McpServer(
  { name: 'nyyon-figures', version: '0.2.1' },
  {
    instructions:
      'Two ways in. (1) ARTICLE → figures: call figures_for_article (article text + a `design`: "auto" | "all" | "cover" | a template name); it returns a short brief — follow it, then call render_set / render_cover. (2) AD-HOC one-off ("make a venn of X and Y overlapping Z", "a 3-step pipeline of A→B→C"): skip the article flow — map the request to a template + slots (see list_templates) and call render_figure directly. Adjust the global look anytime with set_theme (colors/fonts/brand) — it applies to all later renders. ALWAYS show every rendered PNG inline in the chat; never just report paths.',
  },
);

// ── list_templates ──────────────────────────────────────────────────────────
server.registerTool(
  'list_templates',
  {
    title: 'List figure templates',
    description:
      'List every diagram template (16) and the featured cover with their slot schemas. Call this first to learn what shapes exist and exactly which slots each render tool expects.',
    inputSchema: {},
  },
  async () => jsonContent({
    figures: FIGURE_TEMPLATE_NAMES.map((name) => ({ template: name, slots: FIGURE_TEMPLATES[name].slots })),
    cover: { tool: 'render_cover', slots: FEATURED_TEMPLATE.slots },
  }),
);

// ── figures_for_article ──────────────────────────────────────────────────────
// THE entry point. Article in → a compact, design-aware brief telling the agent
// exactly what figure spec to produce, then to call render_set/render_cover and
// show the PNGs. Token-lean: a specific design returns only that template's schema.
server.registerTool(
  'figures_for_article',
  {
    title: 'Figures for an article',
    description:
      'START HERE. Give an article (body, optional title) and a `design`, and this returns a short brief telling you exactly what figure spec to produce — then you call render_set (or render_cover) and show the PNGs. design options: "auto" (default — 3-4 varied figures anchored to the article + a cover; the normal use), "all" (one figure of EVERY template, a showcase of all shapes), "cover" (just the featured cover), or a specific template name from list_templates (just that one shape). Token-lean: a specific design returns only that template\'s schema, not all 16.',
    inputSchema: {
      body: z.string().max(60000).describe('The article text.'),
      title: z.string().max(300).optional().describe('Article title (used for the cover headline).'),
      design: z.string().max(40).optional().describe('"auto" (default) | "all" | "cover" | a template name'),
    },
  },
  async ({ body, title, design }) => ({
    content: [{ type: 'text', text: buildArticleBrief({ title, body, design }) }],
  }),
);

// ── get_settings ─────────────────────────────────────────────────────────────
server.registerTool(
  'get_settings',
  {
    title: 'Get brand settings',
    description: 'Return the active theme — colors (incl. the accent), fonts, canvas sizes, brand lockup. Reflects any runtime set_theme changes.',
    inputSchema: {},
  },
  async () => jsonContent(snapshot()),
);

// ── set_theme ────────────────────────────────────────────────────────────────
server.registerTool(
  'set_theme',
  {
    title: 'Adjust the global design',
    description:
      'Change the GLOBAL look applied to ALL subsequent renders — colors, fonts, and the cover brand lockup. Persists for the session. Pass only what you want to change; returns the new settings. Colors are hex strings.',
    inputSchema: {
      paper: z.string().optional(), ink: z.string().optional(), mute: z.string().optional(),
      line: z.string().optional(), cardHigh: z.string().optional(),
      accent: z.string().optional(), accentWash: z.string().optional(),
      sans: z.string().optional().describe('sans family name'),
      mono: z.string().optional().describe('mono family name'),
      fontFiles: z.array(z.string()).optional().describe('TTF paths (absolute) or names under assets/fonts'),
      fontDefault: z.string().optional().describe('resvg default font family'),
      brandName: z.string().optional(), brandUrl: z.string().optional(),
      brandMark: z.string().optional().describe('SVG path (~64x70) for the logo mark; "" = text-only'),
    },
  },
  async (patch) => jsonContent(setTheme(patch || {})),
);

// ── render_figure ─────────────────────────────────────────────────────────────
server.registerTool(
  'render_figure',
  {
    title: 'Render one diagram',
    description:
      'Render a single diagram to a PNG from a template + slots (see list_templates for each schema). Use this directly for ad-hoc one-off requests — e.g. "make a venn of X and Y overlapping Z" → template:"venn", slots:{left_label:"X", right_label:"Y", overlap_label:"Z"}. No article needed. Returns the file path (rendered at 2x). AFTER rendering, show the PNG inline in the chat — never just report the path.',
    inputSchema: {
      template: z.enum(FIGURE_TEMPLATE_NAMES),
      slots: z.record(z.any()),
      out_path: z.string().max(512).optional().describe('Optional filename or sub-path written INTO the output dir (confined to it).'),
    },
  },
  async ({ template, slots, out_path }) => {
    const tpl = FIGURE_TEMPLATES[template];
    if (!tpl) throw new Error(`unknown template: ${template}`);
    const svg = tpl.build(slots || {});
    const png = await renderPng(svg, tpl.width);
    const path = resolveOut(out_path, slug(slots?.fig_label || template));
    writeFileSync(path, png);
    return jsonContent({ ok: true, template, path, width: tpl.width, height: tpl.height, px: `${tpl.width * 2}x${tpl.height * 2}`, bytes: png.length });
  },
);

// ── render_cover ──────────────────────────────────────────────────────────────
server.registerTool(
  'render_cover',
  {
    title: 'Render the featured cover',
    description:
      'Render the 1200x630 featured/hero cover (OG ratio): the brand wordmark, kit shapes wired to an accent hub, and the headline with one word in the accent colour. Returns the file path. AFTER rendering, show the PNG inline in the chat so the user can see it — never just report the path.',
    inputSchema: {
      title: z.string().max(300).describe('The headline (usually the article title).'),
      kicker: z.string().max(120).optional().describe('Short topic label in caps, e.g. "AI-NATIVE MARKETING".'),
      highlight: z.string().max(120).optional().describe('One word/phrase copied exactly from the title to print in the accent colour.'),
      sub: z.string().max(300).optional().describe('One-line standfirst under the headline.'),
      out_path: z.string().max(512).optional(),
    },
  },
  async ({ title, kicker, highlight, sub, out_path }) => {
    const svg = FEATURED_TEMPLATE.build({ title, kicker, highlight, sub });
    const png = await renderPng(svg, FEATURED_TEMPLATE.width);
    const path = resolveOut(out_path, `${slug(title)}-cover`);
    writeFileSync(path, png);
    return jsonContent({ ok: true, path, width: FEATURED_TEMPLATE.width, height: FEATURED_TEMPLATE.height, px: `${FEATURED_TEMPLATE.width * 2}x${FEATURED_TEMPLATE.height * 2}`, bytes: png.length });
  },
);

// ── render_set ────────────────────────────────────────────────────────────────
server.registerTool(
  'render_set',
  {
    title: 'Render a whole figure set + cover',
    description:
      'Render a full article set in one call: an array of figures (each { template, slots }) plus an optional cover. Returns the list of written paths. Convenience over calling render_figure repeatedly. AFTER rendering, show EVERY rendered PNG inline in the chat so the user can see them — never just report paths.',
    inputSchema: {
      figures: z.array(z.object({ template: z.enum(FIGURE_TEMPLATE_NAMES), slots: z.record(z.any()) })).max(12).optional(),
      cover: z.object({ title: z.string().max(300), kicker: z.string().max(120).optional(), highlight: z.string().max(120).optional(), sub: z.string().max(300).optional() }).optional(),
      out_dir: z.string().max(512).optional().describe('Optional sub-directory (confined to the output dir) for this set.'),
    },
  },
  async ({ figures = [], cover, out_dir }) => {
    // Confine the whole set to a directory under OUT_DIR; filenames are
    // server-built (never caller-controlled), so nothing escapes.
    const baseDir = out_dir ? safeUnder(out_dir) : OUT_DIR;
    mkdirSync(baseDir, { recursive: true });
    const stamp = out_dir ? '' : `-${Date.now()}`;
    const results = [];
    let i = 0;
    for (const f of figures) {
      const tpl = FIGURE_TEMPLATES[f.template];
      if (!tpl) { results.push({ ok: false, template: f.template, error: 'unknown template' }); continue; }
      i += 1;
      const png = await renderPng(tpl.build(f.slots || {}), tpl.width);
      const path = join(baseDir, `fig-${i}-${slug(f.slots?.fig_label || f.template)}${stamp}.png`);
      writeFileSync(path, png);
      results.push({ ok: true, template: f.template, path });
    }
    let coverResult = null;
    if (cover) {
      const png = await renderPng(FEATURED_TEMPLATE.build(cover), FEATURED_TEMPLATE.width);
      const path = join(baseDir, `${slug(cover.title)}-cover${stamp}.png`);
      writeFileSync(path, png);
      coverResult = { ok: true, path };
    }
    return jsonContent({ ok: true, figures: results, cover: coverResult });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
