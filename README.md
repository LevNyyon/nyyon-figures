# nyyon-figures

A **local MCP server** that renders nyyon's editorial diagrams and featured covers from a spec. No network, no model, nothing leaves the machine — the calling assistant does the thinking, this tool does the drawing.

It ships three things:

- **Templates** — 16 parametric diagram shapes + a 1200×630 featured cover, drawn as code (SVG → PNG via resvg at 2×).
- **Settings** — the global brand theme: paper/ink with a single cool-purple accent (`#6C5CE7`), Inter + JetBrains Mono. One token re-themes everything.
- **Reasoning prompt** — how to map an article to a *set* of figures (which shape per idea, anchored to the sentence it illustrates, varied across the piece) + a cover.

## The 16 templates

`contrast` · `layers` · `cycle` · `fanout` · `columns` · `grid` · `funnel` · `timeline` · `quadrant` · `pyramid` · `venn` · `table` · `pipeline` · `radial` · `bigstat` · `progression`

Each uses the accent as a *signal*: the `FIG.` mark, the primary arrowheads, and the single focal "point" of the diagram (the goal node, the source, the winning quadrant, the apex…).

## Tools

| tool | what it does |
|------|--------------|
| `list_templates` | List all templates + the cover with their slot schemas. Call first. |
| `get_reasoning_prompt` | Get the figure-design prompt (pass the article to embed it). Use it to produce the figure-spec JSON. |
| `get_settings` | The active theme — colors, fonts, sizes, env overrides. |
| `render_figure` | `{ template, slots }` → a diagram PNG. Returns the file path. |
| `render_cover` | `{ title, kicker?, highlight?, sub? }` → the 1200×630 cover PNG. |
| `render_set` | A whole article set (`figures[]` + optional `cover`) in one call. |

## Typical flow

1. `get_reasoning_prompt` with the article → reason out the figure set + cover as JSON (per the prompt).
2. `render_set` with that JSON → PNGs written locally; embed them in the post and use the cover as the featured/OG image.

(Or call `render_figure` / `render_cover` directly when you already have a spec.)

## Install (Claude / MCP)

```bash
npm install
```

Then add to your MCP client config:

```json
{
  "mcpServers": {
    "nyyon-figures": { "command": "node", "args": ["/ABSOLUTE/PATH/nyyon-figures/src/index.js"] }
  }
}
```

Or with the CLI: `claude mcp add nyyon-figures -- node /ABSOLUTE/PATH/nyyon-figures/src/index.js`

## Settings & overrides

Edit `src/settings.js`, or override at runtime via env:

- `NYYON_FIGURES_ACCENT` — accent hex (default `#6C5CE7`)
- `NYYON_FIGURES_PAPER` / `NYYON_FIGURES_INK` — background / foreground
- `NYYON_FIGURES_OUT` — directory for rendered PNGs (default `$TMPDIR/nyyon-figures`)

## Test

```bash
npm test   # renders one of every template + the cover into tmp-smoke/
```
