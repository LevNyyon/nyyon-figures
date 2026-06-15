---
name: nyyon-figures
description: Generate editorial diagrams and a featured cover for an article or post, in a clean paper/ink style with a single accent. Brand-themeable (colors, accent, wordmark, URL) — defaults to nyyon's look, works for any brand. Use when the user wants figures, diagrams, illustrations, or a hero/OG/featured image for a blog post or article. Backed by the nyyon-figures MCP server (templates + brand settings + reasoning prompt).
---

# Making editorial figures for an article

Use the **nyyon-figures** MCP tools to turn an article into a set of editorial diagrams + a featured cover, in a clean paper/ink style with a single accent. Everything renders locally; you do the design reasoning, the tools draw and write the PNGs. The look is brand-themeable (see `get_settings` / the `NYYON_FIGURES_*` env vars) and defaults to nyyon.

## Article → figures

1. Call `figures_for_article` with the article (`body`, optional `title`) and a `design`:
   - `auto` — 3–4 varied figures anchored to the article + a cover (the usual)
   - `all` — one figure of every template (a showcase of all shapes)
   - `cover` — just the featured cover
   - a template name — just that one shape
2. Follow the returned brief to produce the JSON spec, then call `render_set` (or `render_cover`).
3. **Show every rendered PNG in the chat.** Then place each figure after its anchor sentence and use the cover as featured / `og:image`.

## Ad-hoc one-off

For a direct request like *"a venn of X and Y overlapping Z"* or *"a 3-step pipeline A→B→C"*, skip the article flow: map it to a template + slots (see `list_templates`) and call `render_figure` directly, then show the PNG. For a three-way overlap use `venn3`.

## Animated figures

For web/inline use, pass `format: "svg"` + `animate: true` to `render_figure` / `render_set` → a self-animating SVG (staggered entrance → hold → exit, looping; `timeline`/`cycle`/`radial` also get a gliding accent dot). Pure SVG, no JS. Keep PNG for og:images, email, and link previews — animation doesn't survive those.

## Adjust the look

`set_theme` changes colors / fonts / brand globally for all later renders (e.g. `{ accent: "#DC2626" }`). `get_settings` shows the active theme. Defaults are neutral (slate/blue + IBM Plex), not nyyon.

## Notes

- Labels must be terse and CAPS where the slot says so. Respect each slot's character limits — overlong text auto-shrinks and reads weak.
- Don't repeat a template within one set unless the article genuinely has two instances of that exact shape.
