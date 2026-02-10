import {
  createServer,
  type IncomingMessage,
  type Server as HttpServer,
  type ServerResponse,
} from "node:http";
import { URL } from "node:url";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

type StartSseServerOptions = {
  createMcpServer: () => Server;
  port: number;
  serverLabel?: string;
  ssePath?: string;
  postPath?: string;
};

type SessionRecord = {
  server: Server;
  transport: SSEServerTransport;
};

function setCorsHeaders(res: ServerResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "content-type");
}

function getRequestUrl(req: IncomingMessage): URL | null {
  if (!req.url) {
    return null;
  }

  return new URL(req.url, `http://${req.headers.host ?? "localhost"}`);
}

async function connectSseSession(
  res: ServerResponse,
  postPath: string,
  sessions: Map<string, SessionRecord>,
  createMcpServer: () => Server,
) {
  setCorsHeaders(res);
  const server = createMcpServer();
  const transport = new SSEServerTransport(postPath, res);
  const sessionId = transport.sessionId;

  sessions.set(sessionId, { server, transport });

  transport.onclose = async () => {
    sessions.delete(sessionId);
    await server.close();
  };

  transport.onerror = (error) => {
    console.error("SSE transport error", error);
  };

  try {
    await server.connect(transport);
  } catch (error) {
    sessions.delete(sessionId);
    console.error("Failed to start SSE session", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to establish SSE connection");
    }
  }
}

async function handleMessagePost(
  req: IncomingMessage,
  res: ServerResponse,
  url: URL,
  sessions: Map<string, SessionRecord>,
) {
  setCorsHeaders(res);
  const sessionId = url.searchParams.get("sessionId");

  if (!sessionId) {
    res.writeHead(400).end("Missing sessionId query parameter");
    return;
  }

  const session = sessions.get(sessionId);

  if (!session) {
    res.writeHead(404).end("Unknown session");
    return;
  }

  try {
    await session.transport.handlePostMessage(req, res);
  } catch (error) {
    console.error("Failed to process message", error);
    if (!res.headersSent) {
      res.writeHead(500).end("Failed to process message");
    }
  }
}

export function startSseServer(options: StartSseServerOptions): HttpServer {
  const ssePath = options.ssePath ?? "/mcp";
  const postPath = options.postPath ?? "/mcp/messages";
  const sessions = new Map<string, SessionRecord>();

  const httpServer = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = getRequestUrl(req);

    if (!url) {
      res.writeHead(400).end("Missing URL");
      return;
    }

    if (
      req.method === "OPTIONS" &&
      (url.pathname === ssePath || url.pathname === postPath)
    ) {
      res.writeHead(204, {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "content-type",
      });
      res.end();
      return;
    }

    if (req.method === "GET" && url.pathname === ssePath) {
      await connectSseSession(
        res,
        postPath,
        sessions,
        options.createMcpServer,
      );
      return;
    }

    if (req.method === "POST" && url.pathname === postPath) {
      await handleMessagePost(req, res, url, sessions);
      return;
    }

    res.writeHead(404).end("Not Found");
  });

  httpServer.on("clientError", (error: Error, socket) => {
    console.error("HTTP client error", error);
    socket.end("HTTP/1.1 400 Bad Request\r\n\r\n");
  });

  httpServer.listen(options.port, () => {
    const label = options.serverLabel ?? "MCP server";
    console.log(`${label} listening on http://localhost:${options.port}`);
    console.log(`  SSE stream: GET http://localhost:${options.port}${ssePath}`);
    console.log(
      `  Message post endpoint: POST http://localhost:${options.port}${postPath}?sessionId=...`,
    );
  });

  return httpServer;
}
