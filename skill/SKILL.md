---
name: nyyon-figures
description: Generate nyyon-brand editorial diagrams and a featured cover for an article or post. Use when the user wants figures, diagrams, illustrations, or a hero/OG/featured image for a blog post or article in nyyon's visual style. Backed by the nyyon-figures MCP server (templates + brand settings + reasoning prompt).
---

# Making nyyon figures for an article

Use the **nyyon-figures** MCP tools to turn an article into a set of editorial diagrams + a featured cover, in nyyon's paper/ink + cool-purple style. Everything renders locally; you do the design reasoning, the tools draw and write the PNGs.

## Steps

1. **Learn the kit.** Call `list_templates` once to see the 16 diagram shapes and the cover, each with its slot schema.

2. **Reason out the set.** Call `get_reasoning_prompt` with the article (`title`, `excerpt`, `body_text`). Follow the prompt it returns to produce a JSON spec:
   - 3–4 figures, each a *different* template chosen to match the SHAPE of one idea (a comparison → `contrast`/`table`, a process → `pipeline`/`cycle`, an architecture → `layers`/`radial`, a number → `bigstat`, a matrix → `quadrant`/`grid`, a maturity arc → `pyramid`/`progression`, a sequence in time → `timeline`, a shared zone → `venn`, one→many → `fanout`).
   - Each figure carries an `anchor`: a short verbatim phrase from the body marking the sentence it illustrates. Spread anchors across the article — not all at the top.
   - Mark exactly one figure `featured: true`.
   - Design the `cover`: `kicker`, `highlight` (one word copied from the title, printed in the accent), `sub` (a one-line standfirst).

3. **Render.** Call `render_set` with `{ figures: [{template, slots}…], cover: {title, kicker, highlight, sub} }` — or `render_figure` / `render_cover` individually. Each returns a PNG file path (rendered at 2×).

4. **Place them.** Embed each figure right after its anchor sentence in the post body. Use the cover as the post's featured / `og:image`.

## Notes

- The accent (`#6C5CE7`) and theme are global; see `get_settings`. Override per-run with `NYYON_FIGURES_ACCENT` etc.
- Labels must be terse and CAPS where the slot says so. Respect each slot's character limits — overlong text auto-shrinks and reads weak.
- Don't repeat a template within one set unless the article genuinely has two instances of that exact shape.
