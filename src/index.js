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
import { writeFileSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, isAbsolute } from 'node:path';

import { FIGURE_TEMPLATES, FIGURE_TEMPLATE_NAMES, FEATURED_TEMPLATE } from './templates.js';
import { renderPng } from './render.js';
import { SETTINGS } from './settings.js';
import { REASONING_PROMPT, templateMenu, buildReasoningPrompt } from './reasoning.js';

const OUT_DIR = process.env.NYYON_FIGURES_OUT || join(tmpdir(), 'nyyon-figures');
let seq = 0;

function slug(s) {
  return String(s || 'figure').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60) || 'figure';
}

function resolveOut(outPath, fallbackName) {
  mkdirSync(OUT_DIR, { recursive: true });
  if (outPath) return isAbsolute(outPath) ? outPath : join(OUT_DIR, outPath);
  seq += 1;
  return join(OUT_DIR, `${fallbackName}-${Date.now()}-${seq}.png`);
}

function jsonContent(obj) {
  return { content: [{ type: 'text', text: JSON.stringify(obj, null, 2) }] };
}

const server = new McpServer({ name: 'nyyon-figures', version: '0.1.0' });

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

// ── get_reasoning_prompt ─────────────────────────────────────────────────────
server.registerTool(
  'get_reasoning_prompt',
  {
    title: 'Get the figure-design reasoning prompt',
    description:
      'Return nyyon\'s reasoning prompt for turning an article into a SET of figures + a cover: which template fits which idea, anchoring each to a sentence, and varying shapes. Pass the article (title/excerpt/body_text) to get the full ready-to-use prompt with the article embedded; omit it to get just the rules + template menu. Use the prompt to produce the figure-spec JSON, then call render_figure / render_cover.',
    inputSchema: {
      title: z.string().optional(),
      excerpt: z.string().optional(),
      body_text: z.string().optional(),
    },
  },
  async ({ title, excerpt, body_text }) => ({
    content: [{ type: 'text', text: buildReasoningPrompt({ title, excerpt, body_text }) }],
  }),
);

// ── get_settings ─────────────────────────────────────────────────────────────
server.registerTool(
  'get_settings',
  {
    title: 'Get brand settings',
    description: 'Return the active brand theme — colors (incl. the accent), fonts, canvas sizes, and the env vars that override them.',
    inputSchema: {},
  },
  async () => jsonContent(SETTINGS),
);

// ── render_figure ─────────────────────────────────────────────────────────────
server.registerTool(
  'render_figure',
  {
    title: 'Render one diagram',
    description:
      'Render a single in-article diagram to a PNG. Provide the template name and its slots (see list_templates for each template\'s slot schema). Returns the file path. Renders at 2x for crisp output.',
    inputSchema: {
      template: z.enum(FIGURE_TEMPLATE_NAMES),
      slots: z.record(z.any()),
      out_path: z.string().optional().describe('Optional output path (absolute, or a filename written into the output dir).'),
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
      'Render the 1200x630 featured/hero cover (OG ratio): the nyyon wordmark, kit shapes wired to an accent hub, and the headline with one word in the accent colour. Returns the file path.',
    inputSchema: {
      title: z.string().describe('The headline (usually the article title).'),
      kicker: z.string().optional().describe('Short topic label in caps, e.g. "AI-NATIVE MARKETING".'),
      highlight: z.string().optional().describe('One word/phrase copied exactly from the title to print in the accent colour.'),
      sub: z.string().optional().describe('One-line standfirst under the headline.'),
      out_path: z.string().optional(),
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
      'Render a full article set in one call: an array of figures (each { template, slots }) plus an optional cover. Returns the list of written paths. Convenience over calling render_figure repeatedly.',
    inputSchema: {
      figures: z.array(z.object({ template: z.enum(FIGURE_TEMPLATE_NAMES), slots: z.record(z.any()) })).optional(),
      cover: z.object({ title: z.string(), kicker: z.string().optional(), highlight: z.string().optional(), sub: z.string().optional() }).optional(),
      out_dir: z.string().optional().describe('Optional directory for this set (defaults to the server output dir).'),
    },
  },
  async ({ figures = [], cover, out_dir }) => {
    const results = [];
    let i = 0;
    for (const f of figures) {
      const tpl = FIGURE_TEMPLATES[f.template];
      if (!tpl) { results.push({ ok: false, template: f.template, error: 'unknown template' }); continue; }
      i += 1;
      const png = await renderPng(tpl.build(f.slots || {}), tpl.width);
      const name = `fig-${i}-${slug(f.slots?.fig_label || f.template)}.png`;
      const path = out_dir ? join(isAbsolute(out_dir) ? out_dir : join(OUT_DIR, out_dir), name) : resolveOut(name, 'fig');
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, png);
      results.push({ ok: true, template: f.template, path });
    }
    let coverResult = null;
    if (cover) {
      const png = await renderPng(FEATURED_TEMPLATE.build(cover), FEATURED_TEMPLATE.width);
      const path = out_dir ? join(isAbsolute(out_dir) ? out_dir : join(OUT_DIR, out_dir), 'cover.png') : resolveOut(`${slug(cover.title)}-cover`, 'cover');
      mkdirSync(join(path, '..'), { recursive: true });
      writeFileSync(path, png);
      coverResult = { ok: true, path };
    }
    return jsonContent({ ok: true, figures: results, cover: coverResult });
  },
);

const transport = new StdioServerTransport();
await server.connect(transport);
