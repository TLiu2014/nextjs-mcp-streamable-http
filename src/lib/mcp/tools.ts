/**
 * Example tool catalog. Replace these with your own — the shape is all the MCP
 * server needs: a JSON-schema definition for tools/list and a handler for
 * tools/call.
 */

import type { CallToolResult, Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * Per-request context. Here it comes from a request header (see route.ts), so a
 * trusted caller — like the loopback client in /api/demo — can pass things such
 * as a user id or a bring-your-own API key without the server persisting them.
 */
export interface RequestContext {
  caller?: string;
}

export const TOOL_DEFINITIONS: Tool[] = [
  {
    name: "add",
    description: "Add two numbers and return the sum.",
    inputSchema: {
      type: "object",
      properties: {
        a: { type: "number", description: "First addend" },
        b: { type: "number", description: "Second addend" },
      },
      required: ["a", "b"],
    },
  },
  {
    name: "get_time",
    description: "Return the server's current time as an ISO-8601 string.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "whoami",
    description:
      "Echo the per-request context the server received (demonstrates header forwarding).",
    inputSchema: { type: "object", properties: {} },
  },
];

function text(value: unknown): CallToolResult {
  return {
    content: [
      {
        type: "text",
        text: typeof value === "string" ? value : JSON.stringify(value),
      },
    ],
  };
}

function error(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}

/** Dispatch a tools/call by name. */
export async function callTool(
  name: string,
  args: Record<string, unknown> = {},
  ctx: RequestContext = {}
): Promise<CallToolResult> {
  switch (name) {
    case "add": {
      const a = Number(args.a);
      const b = Number(args.b);
      if (!Number.isFinite(a) || !Number.isFinite(b)) {
        return error("add: both 'a' and 'b' must be numbers");
      }
      return text({ sum: a + b });
    }
    case "get_time":
      return text({ now: new Date().toISOString() });
    case "whoami":
      return text({ caller: ctx.caller ?? null });
    default:
      return error(`Unknown tool: ${name}`);
  }
}
