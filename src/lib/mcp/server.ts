/**
 * Builds the MCP `Server` (low-level API) and registers tools/list and
 * tools/call. A fresh Server is created per request (stateless mode) — see
 * src/app/api/mcp/route.ts.
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { TOOL_DEFINITIONS, callTool, type RequestContext } from "./tools";

export function createMcpServer(ctx: RequestContext = {}): Server {
  const server = new Server(
    { name: "nextjs-mcp-streamable-http", version: "0.1.0" },
    {
      capabilities: { tools: {} },
      instructions:
        "Example MCP server. Use `add` for arithmetic, `get_time` for the " +
        "current server time, and `whoami` to see the request context.",
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: TOOL_DEFINITIONS,
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    return callTool(name, args as Record<string, unknown> | undefined, ctx);
  });

  return server;
}
