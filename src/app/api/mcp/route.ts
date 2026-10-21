/**
 * MCP endpoint — Streamable HTTP transport, stateless.
 *
 * Uses the SDK's `WebStandardStreamableHTTPServerTransport`, which implements
 * the MCP Streamable HTTP spec (POST for JSON-RPC, SSE for streamed responses)
 * on Web-standard Request/Response — exactly what an App Router route handler
 * receives. The older `SSEServerTransport` is deprecated and needs a raw Node
 * `http.ServerResponse`, which the App Router never exposes.
 *
 * Stateless: a fresh Server + transport per request, no session id. That's the
 * simplest correct model for serverless route handlers — any instance can serve
 * any request.
 */

import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";

import { createMcpServer } from "@/lib/mcp/server";
import { contextFromHeader } from "@/lib/mcp/context";

// The SDK needs the Node.js runtime (not Edge), and MCP must never be cached.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function handle(req: Request): Promise<Response> {
  const server = createMcpServer(contextFromHeader(req));

  // No sessionIdGenerator => stateless (no session tracking between requests).
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });

  await server.connect(transport);
  const response = await transport.handleRequest(req);

  // Tear the per-request server down once the response is consumed.
  transport.onclose = () => {
    void server.close();
  };

  return response;
}

// Streamable HTTP multiplexes everything over these verbs:
//   POST   — JSON-RPC requests (initialize, tools/list, tools/call)
//   GET    — server->client SSE stream
//   DELETE — terminate a session (no-op when stateless)
export { handle as GET, handle as POST, handle as DELETE };
