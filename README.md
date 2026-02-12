# Apps SDK Pizzaz Examples

Focused Apps SDK + MCP example centered on Pizzaz widgets.

## Project layout

- `index.ts` - MCP server entrypoint (SSE + tool wiring)
- `tools/` - MCP tool definitions (one file per tool)
- `utils/` - generic MCP server plumbing/helpers
- `ui/` - React widget source code
- `assets/` - built widget HTML/JS/CSS output
- `build-all.mts` - widget production build script
- `vite.config.mts` - local widget dev server config

## Prerequisites

- Node.js 18+
- pnpm

## Install

```bash
pnpm install
```

Environment variables:

- `MCP_PORT` controls MCP server port (default `8000`)
- `OPENAI_API_KEY` is required for the wedding tools that generate images/PDFs

Tip: prefer setting `OPENAI_API_KEY` in your shell/session (not in a file you might open in the editor), e.g.:

```bash
export OPENAI_API_KEY="..."
```

## OpenAI Docs MCP

Recommend installing the OpenAI developer docs MCP server.

Server URL (streamable HTTP): `https://developers.openai.com/mcp`

```bash
codex mcp add openaiDeveloperDocs --url https://developers.openai.com/mcp
codex mcp list
```

Alternative config in `~/.codex/config.toml`:

```toml
[mcp_servers.openaiDeveloperDocs]
url = "https://developers.openai.com/mcp"
```

Add this instruction to AGENTS guidance when working with OpenAI platform topics:

```text
Always use the OpenAI developer documentation MCP server if you need to work with the OpenAI API, ChatGPT Apps SDK, Codex,… without me having to explicitly ask.
```

## Smooth local dev

Run everything with one command:

```bash
pnpm run dev
```

This does:

- initial asset build
- UI rebuild watch on `ui/**`
- MCP server watch/restart on backend changes
- serves widget assets from MCP server at `/assets/*`
- serves latest widget template HTML from disk on each resource read, so UI-only
  changes are reflected without restarting MCP

To expose MCP publicly, run ngrok separately:

```bash
pnpm run dev
# in another terminal:
ngrok http 8000
```

## Common commands

Build widget assets:

```bash
pnpm run build
```

## Wedding pitch deck tool (new)

This repo includes a starter wedding-planning tool + widget:

- MCP tool: `wedding-pitch-deck`
- MCP tool: `wedding-planner` (opens intake UI first)
- Widget: `wedding-pitch-deck` (renders slides/venues/budget + export links)

### Required env vars

- `OPENAI_API_KEY`

Optional:

- `OPENAI_TEXT_MODEL` (defaults to `gpt-4o-mini`)

### What it generates

- AI images per slide (saved under `/assets/generated/...`)
- A 16:9 slide deck PDF (`deck-*.pdf`)
- A budget CSV (`budget-*.csv`)
- Venue shortlist with TripAdvisor search links

### Recommended flow

1. Call `wedding-planner` to open the intake UI.
2. Fill in country/budget/guests/theme/colors in the widget and click `Regenerate` to run `wedding-pitch-deck`.

Run MCP server:

```bash
pnpm run mcp:start
```

Run MCP server in watch mode:

```bash
pnpm run mcp:dev
```

Run Vite UI dev server only:

```bash
pnpm run dev:vite
```

Optional separate static asset serving (not needed for normal MCP dev):

```bash
BASE_URL=http://localhost:4444 pnpm run build
pnpm run serve
```

## MCP endpoints

Default (`MCP_PORT=8000`):

- `GET /mcp`
- `POST /mcp/messages?sessionId=...`
- `GET /assets/*`

## ChatGPT connector (local)

Run the MCP app locally:

```bash
pnpm run dev
```

In a separate terminal, expose it with ngrok:

```bash
ngrok http 8000
```

Then add this MCP URL in ChatGPT developer mode:

```text
https://<your-tunnel-domain>/mcp
```

## Deploy note

If assets are hosted elsewhere, override `BASE_URL` when building:

```bash
BASE_URL=https://your-server.com pnpm run build
```
