# Install (agent-friendly)

This guide is written so an AI agent (Claude Code, Cursor, Claude Desktop in agent mode) can install **nyyon-figures** end to end. Steps are deterministic and each ends with a check you can assert on. Run them in order; stop and report if a check fails.

## 0. Requirements
- **Node.js ≥ 18** and **git**. Verify:
  ```bash
  node -v && git --version
  ```
  If either is missing, install Node from nodejs.org and git from git-scm.com, then re-check.
- An MCP client that launches local stdio servers (Claude Code CLI, Claude Desktop, Cursor, …).

## 1. Clone
```bash
git clone https://github.com/LevNyyon/nyyon-figures.git
cd nyyon-figures
```
Record the **absolute path** to this directory — you need it later:
```bash
pwd   # e.g. /Users/you/nyyon-figures  → call this <DIR>
```

## 2. Install dependencies
```bash
npm install
```
**Check:** the command exits 0 and `node_modules/@resvg/resvg-wasm` and `node_modules/@modelcontextprotocol/sdk` both exist.

## 3. Verify it renders (no MCP client needed)
```bash
npm test
```
**Check:** output ends with `17 passed, 0 failed`. PNGs are written to `tmp-smoke/`. If this fails, do not proceed — the renderer itself is broken; report the error.

## 4. Register with your MCP client

Pick the one that matches the host.

### Claude Code (CLI)
```bash
claude mcp add nyyon-figures -- node <DIR>/src/index.js
```
**Check:** `claude mcp list` shows `nyyon-figures`.

### Claude Desktop / Cursor / generic (config JSON)
Add this server to the client's MCP config (`claude_desktop_config.json` for Claude Desktop), then fully quit and reopen the app:
```json
{
  "mcpServers": {
    "nyyon-figures": {
      "command": "node",
      "args": ["<DIR>/src/index.js"]
    }
  }
}
```
Replace `<DIR>` with the absolute path from step 1. Optional theming via `"env"`: `NYYON_FIGURES_ACCENT`, `NYYON_FIGURES_PAPER`, `NYYON_FIGURES_INK`, `NYYON_FIGURES_OUT`.

**Check:** after restart, the client lists six tools: `list_templates`, `get_reasoning_prompt`, `get_settings`, `render_figure`, `render_cover`, `render_set`.

## 5. Smoke-test the live tools
From the MCP client, call:
1. `list_templates` → **Check:** returns 16 figure templates + a cover.
2. `render_cover` with `{ "title": "Hello From Nyyon Figures", "kicker": "FIELD NOTE", "highlight": "Nyyon", "sub": "install check" }` → **Check:** returns a `path`; open it and confirm a 1200×630 PNG with a purple hub and the headline.

If both pass, installation is complete.

## 6. How to use it (the normal flow)
1. Call `get_reasoning_prompt` with the article (`title`, `excerpt`, `body_text`). It returns nyyon's figure-design prompt + the template menu.
2. Following that prompt, produce a JSON spec: 3–4 figures (each a different template, each anchored to a verbatim sentence) plus a `cover`.
3. Call `render_set` with `{ figures: [{ template, slots }…], cover: { title, kicker, highlight, sub } }` (or `render_figure` / `render_cover` individually). Each returns a PNG path.
4. Embed each figure after its anchor sentence; use the cover as the post's featured / `og:image`.

## Notes
- Fully local: no network calls, no API key, no model runs inside the server — the calling agent does the design reasoning. Nothing leaves the machine except the file paths it returns.
- Re-theme globally by editing `src/settings.js` or setting the `NYYON_FIGURES_*` env vars.
- Output PNGs default to `$TMPDIR/nyyon-figures/`; override with `NYYON_FIGURES_OUT`.
