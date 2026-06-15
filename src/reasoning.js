// The reasoning prompt — how to turn an article into a SET of editorial figures
// (which template per idea, anchored to the sentence it illustrates, with a
// cover). The MCP server hands this to the CALLING agent, which does the
// reasoning and then calls render_figure / render_cover. No model runs here.

import { FIGURE_TEMPLATES, FIGURE_TEMPLATE_NAMES, FEATURED_TEMPLATE } from './templates.js';

export const REASONING_PROMPT = `You are a technical figure designer. You turn an article into a SET of editorial diagrams that TELL THE ARTICLE'S STORY — each diagram placed at the exact point it illustrates.

You receive the article (title, excerpt, body text) and a menu of 17 diagram templates. Each template is a STORY SHAPE — pick the one that matches the shape of the idea, not by habit:

- contrast: TWO things compared side by side — old vs new, A vs B, the wrong way vs the right way.
- layers: a STACKED architecture or a boundary between planes — tiers, build-plane over operate-plane, a trust boundary.
- cycle: a LOOP or repeating process — a feedback loop, stages that circle a central goal, learn-and-adapt.
- fanout: ONE thing branching into MANY — one event → many outcomes, one input → many states, one capability used by many teams.
- columns: a CATEGORIZED breakdown into 3-4 parallel groups — tiers, pillars, model types, job categories.
- grid: a CONTROL ROOM of 4 panels — dashboards, four named views/jobs each with a list of rows.
- funnel: a NARROWING sequence — a demand/conversion funnel, stages that shrink (impressions → clicks → pipeline → won).
- timeline: events along TIME — phases, a rollout, a week-by-week or before→after sequence on a horizontal axis.
- quadrant: a 2x2 POSITIONING MATRIX with two named axes — where to be vs not be, plotted on two dimensions.
- pyramid: a HIERARCHY of tiers, wide base to narrow apex — a maturity model, a hierarchy of needs/value.
- venn: an INTERSECTION of two things — where human + AI overlap, the shared zone between two domains.
- venn3: an INTERSECTION of THREE things — what all three share at the center (the sweet spot), with optional pairwise overlaps.
- table: a CRITERIA × OPTIONS comparison — rows of attributes scored across 2-3 options (yes/no, short cells).
- pipeline: a LINEAR left→right process — a production line of stages, each with one job (NOT a loop; use cycle for loops).
- radial: a CENTRAL hub with radiating members — an ecosystem, a data spine every tool plugs into, dependencies around a core.
- bigstat: 2-4 OVERSIZED NUMBERS — headline metrics or a stark quantified claim (cost, speed, percentage).
- progression: ASCENDING steps — growth/escalation/maturity stages rising left to right (headcount → leverage).

RULES — follow all of them:
1. Design 3-4 figures (5 only for very long articles).
2. USE A WIDE VARIETY OF SHAPES from the FULL menu of 17 above. A strong set uses 3-4 DIFFERENT templates and reaches beyond the obvious contrast+columns — if the article has a number worth enlarging use bigstat, a process use pipeline/cycle, a maturity arc use pyramid/progression, two dimensions use quadrant, a shared zone use venn, a sequence in time use timeline, a hub use radial. Do NOT repeat a template in one set unless the article genuinely contains two separate instances of that exact shape.
3. Map the article's KEY MOVES to templates: the central comparison, the mechanism/architecture, the process or loop, the breakdown of parts, the headline number, the maturity arc. Build one figure per real move — pick the shape that fits that move best.
4. For EACH figure, set "anchor": copy a SHORT EXACT phrase (6-12 words) from the article body, VERBATIM (same words, same order), marking the sentence that figure illustrates. The figure is placed right after that sentence. Choose anchors SPREAD ACROSS the article — intro, middle, and later sections — NEVER all near the top. Two figures must not share an anchor.
5. Mark exactly ONE figure "featured": true — the one that best captures the article's central idea (usually the main mechanism or the core comparison).
6. Set "alt": one plain-English sentence describing the figure, for accessibility.
7. Fill every slot the template needs. Respect character limits. Use CAPS where a slot says caps. Keep labels terse and concrete — declarative, specific, zero hype.
8. Also design the "cover" — the article's hero/featured image. Provide: "kicker" (a short topic label in caps, <=26 chars, e.g. "AI-NATIVE MARKETING" or "FIELD NOTE"); "highlight" (ONE word or short phrase copied EXACTLY from the article title that carries the idea — it prints in the accent colour, <=24 chars); "sub" (a one-line standfirst, <=84 chars — usually a sharpened version of the excerpt). The title itself is supplied separately; do not repeat it.

Output ONLY valid JSON, no markdown:
{ "figures": [ { "template": "<name>", "anchor": "<exact phrase from body>", "featured": false, "alt": "<one sentence>", "slots": { ... } } ], "cover": { "kicker": "...", "highlight": "...", "sub": "..." } }

Then call render_figure for each figure (template + slots) and render_cover for the cover.`;

// "<name>: <slot description>" for every template — the live menu.
export function templateMenu() {
  return FIGURE_TEMPLATE_NAMES
    .map((name) => `${name}: ${FIGURE_TEMPLATES[name].slots}`)
    .join('\n\n');
}

// The full prompt: the reasoning rules + the live menu, and (when article text
// is supplied) the article itself, ready to hand to a model.
export function buildReasoningPrompt({ title, excerpt, body_text } = {}) {
  const parts = [REASONING_PROMPT, '', '── TEMPLATES AND THEIR SLOTS ──', templateMenu()];
  if (title || body_text || excerpt) {
    parts.push(
      '', '── THE ARTICLE ──',
      `Title: ${title || ''}`,
      `Excerpt: ${excerpt || '(none)'}`,
      '', 'Body (copy anchors verbatim from this):',
      String(body_text || '').replace(/<[^>]+>/g, '').slice(0, 6000),
      '', 'Design 3-4 figures with varied shapes, each anchored to the sentence it illustrates, spread across the article. Then render them.',
    );
  }
  return parts.join('\n');
}

const slotLine = (name) => `${name}: ${FIGURE_TEMPLATES[name].slots}`;

// Design-aware, token-lean brief for the figures_for_article entry point.
// `design`: 'auto' (3-4 varied + cover), 'all' (one of every template),
// 'cover' (just the cover), or a specific template name (just that shape).
// Only the slot schema(s) actually needed are included, to keep tokens minimal.
export function buildArticleBrief({ title = '', body = '', design = 'auto' } = {}) {
  const article = `ARTICLE\nTitle: ${title || '(untitled)'}\nBody:\n${String(body || '').replace(/<[^>]+>/g, '').slice(0, 6000)}`;
  const render = '\n\nThen call render_set with your figures (and the cover if any) and SHOW every returned PNG in the chat — never just report paths.';
  const d = String(design || 'auto').trim();

  if (d === 'all') {
    return [
      'Make ONE figure for EACH of the 17 templates below — a showcase of every shape for this article. Reuse the same few extracted points across shapes where natural to keep token use low. Anchors are not needed for a showcase.',
      '', 'TEMPLATES (name: slots):', FIGURE_TEMPLATE_NAMES.map(slotLine).join('\n'),
      '', article,
      '', 'Produce JSON: { "figures": [ { "template": "<name>", "slots": { … } }, … one per template … ] }',
      render,
    ].join('\n');
  }
  if (d === 'cover') {
    return [
      'Design the featured cover for this article.',
      `COVER slots — ${FEATURED_TEMPLATE.slots}`,
      '', article,
      '', 'Call render_cover with { style?, kicker, title, highlight, sub } and show the PNG.',
    ].join('\n');
  }
  if (FIGURE_TEMPLATES[d]) {
    return [
      `Make ONE "${d}" figure for this article.`,
      `SLOTS — ${slotLine(d)}`,
      '', article,
      '', `Produce JSON: { "figures": [ { "template": "${d}", "slots": { … }, "alt": "<one sentence>" } ] }`,
      render,
    ].join('\n');
  }
  // 'auto' (default): curated, varied 3-4 set + cover
  return [
    REASONING_PROMPT, '', '── TEMPLATES (name: slots) ──', templateMenu(),
    '', article,
    '', 'Design 3-4 VARIED figures, each anchored to a verbatim sentence, plus a cover.',
    render,
  ].join('\n');
}
