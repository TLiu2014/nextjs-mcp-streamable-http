/**
 * Loopback MCP client.
 *
 * Your own app can be an MCP client of its own MCP server — useful for an
 * in-app agent or simulator, so the tool calls it shows are real MCP
 * round-trips, not mock-ups. This route connects to /api/mcp on the same
 * origin, lists the tools, calls a couple, and forwards per-request context in
 * a header (the same trick works for a browser-supplied BYOK API key: it rides
 * along per request and is never written to the server).
 *
 * GET /api/demo?a=2&b=3&caller=alice
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

import { CONTEXT_HEADER } from "@/lib/mcp/context";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function firstText(content: unknown): string {
  if (!Array.isArray(content)) return "";
  const first = content[0] as { type?: string; text?: string } | undefined;
  return first?.type === "text" ? (first.text ?? "") : "";
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const a = Number(url.searchParams.get("a") ?? 2);
  const b = Number(url.searchParams.get("b") ?? 3);
  const caller = url.searchParams.get("caller") ?? "loopback-demo";

  const mcpUrl = new URL("/api/mcp", url.origin);
  const client = new Client({ name: "loopback-demo", version: "0.1.0" });
  const transport = new StreamableHTTPClientTransport(mcpUrl, {
    requestInit: { headers: { [CONTEXT_HEADER]: JSON.stringify({ caller }) } },
  });

  try {
    await client.connect(transport);
    const { tools } = await client.listTools();
    const sum = await client.callTool({ name: "add", arguments: { a, b } });
    const who = await client.callTool({ name: "whoami", arguments: {} });

    return Response.json({
      tools: tools.map((t) => t.name),
      add: JSON.parse(firstText(sum.content)),
      whoami: JSON.parse(firstText(who.content)),
    });
  } catch (err) {
    return Response.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  } finally {
    await client.close();
  }
}
