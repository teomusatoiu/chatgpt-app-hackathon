# Wedding Planner MCP Demo

Deterministic ChatGPT Apps SDK + MCP connector for a 4-step wedding planning flow
plus a final planner pitch.

## What this repo does

The server exposes 5 read-only tools:

1. `wedding-context-builder`
2. `wedding-venue-strategy`
3. `wedding-budget-architecture`
4. `wedding-design-direction`
5. `wedding-planner-pitch`

Each tool returns:

- `structuredContent` for both model and widget
- concise `content` narration
- widget rendering metadata via tool `_meta`

The logic is deterministic and template-based, with no external planning APIs.

## Project layout

- `index.ts` - MCP server entrypoint (SSE + tool wiring)
- `tools/` - tool definitions and wedding planning engine
- `tools/wedding-domain/` - schemas, types, and deterministic planning logic
- `utils/` - generic MCP server plumbing/helpers
- `ui/` - React widget source code for each planning step
- `assets/` - built widget HTML/JS/CSS output (generated)
- `build-all.mts` - widget production build script
- `vite.config.mts` - local widget dev server config

## Prerequisites

- Node.js 18+
- pnpm

## Install

```bash
pnpm install
```

Optional local config:

```bash
cp .env.example .env
```

- `MCP_PORT` controls MCP server port (default `8000`)

## Local development

Run full loop (build + watch + MCP):

```bash
pnpm run dev
```

Build widget assets once:

```bash
pnpm run build
```

Run MCP server:

```bash
pnpm run mcp:start
```

## Quality checks

Run type checks:

```bash
pnpm run lint
```

Run deterministic engine tests:

```bash
pnpm run test
```

## Demo flow script

Use the same couple context for each tool call in order.

### Step 1 - Context Builder

Prompt:

```text
Run wedding-context-builder for Lisbon, 2027-07-10, 120 guests, budget 35000-45000,
priorities [food, elegance, photos], vibe words [modern, romantic, minimalist],
non-negotiable: exceptional culinary experience.
```

### Step 2 - Venue Strategy

Prompt:

```text
Run wedding-venue-strategy with the same couple context.
```

### Step 3 - Budget Architecture

Prompt:

```text
Run wedding-budget-architecture with the same couple context.
```

### Step 4 - Design Direction

Prompt:

```text
Run wedding-design-direction with the same couple context.
```

### Final - Planner Pitch

Prompt:

```text
Run wedding-planner-pitch with the same couple context.
```

## MCP endpoints

Default (`MCP_PORT=8000`):

- `GET /mcp`
- `POST /mcp/messages?sessionId=...`
- `GET /assets/*`

## ChatGPT connector (local)

Run locally:

```bash
pnpm run dev
```

Expose with ngrok in another terminal:

```bash
ngrok http 8000
```

Use the URL in ChatGPT developer mode:

```text
https://<your-tunnel-domain>/mcp
```
