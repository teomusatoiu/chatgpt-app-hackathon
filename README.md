# Apps SDK Pizzaz Examples

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

This repository is a focused Apps SDK + MCP example centered on the Pizzaz widgets.  
It includes:

- UI widget source code.
- a Node MCP server (`server`) that exposes the widgets as tools.
- build scripts that generate standalone assets in `assets/`.

## What’s in this repo

- `ui/` - Widget source code (React + Apps SDK UI components).
- `assets/` - Built widget HTML/JS/CSS output.
- `server/` - Node MCP server (SSE transport).
- `build-all.mts` - Multi-entry build script for widget assets.
- `vite.config.mts` - Local UI development server config.

## Included widget examples

- `pizzaz` (map + sidebar + inspector)
- `pizzaz-carousel`
- `pizzaz-list`
- `pizzaz-albums`
- `pizzaz-shop`

## Prerequisites

- Node.js 18+
- pnpm (recommended)

## Install dependencies

Install root dependencies:

```bash
pnpm install
```

Install server dependencies:

```bash
cd server
pnpm install
cd ..
```

## Build and serve widget assets

Build:

```bash
pnpm run build
```

Serve static assets (for local development and MCP testing):

```bash
pnpm run serve
```

Assets are served at `http://localhost:4444`.

To iterate on UI without a full build, run:

```bash
pnpm run dev
```

## Run the MCP server

Start the Pizzaz Node server:

```bash
cd server
pnpm start
```

By default, it runs on port `8000` and exposes:

- `GET /mcp` (SSE stream)
- `POST /mcp/messages?sessionId=...` (message endpoint)

## MCP + Apps SDK flow (quick recap)

1. The server lists tools.
2. The model calls a tool with arguments.
3. The tool returns `content` + `structuredContent` + metadata including `_meta.openai/outputTemplate`.
4. ChatGPT renders the matching widget UI.

## Test in ChatGPT (local)

Enable [developer mode](https://platform.openai.com/docs/guides/developer-mode), then add your MCP connector in ChatGPT settings.

If you need a public URL for local testing, tunnel your local server:

```bash
ngrok http 8000
```

Then add:

```text
https://<your-ngrok-domain>/mcp
```

## Deploy notes

If you host assets outside localhost, set `BASE_URL` during build so generated widget HTML points to your hosted asset origin:

```bash
BASE_URL=https://your-server.com pnpm run build
```

## Contributing

PRs and issues are welcome.

## License

MIT. See [LICENSE](./LICENSE).
