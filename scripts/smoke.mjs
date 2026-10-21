// Smoke test: an external MCP client round-trip against a running server.
//   pnpm dev            (in one terminal)
//   pnpm smoke          (in another; MCP_URL overrides the default)

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = new URL(process.env.MCP_URL ?? "http://localhost:3000/api/mcp");
const client = new Client({ name: "smoke", version: "0.1.0" });

await client.connect(new StreamableHTTPClientTransport(url));

const { tools } = await client.listTools();
console.log("tools:", tools.map((t) => t.name).join(", "));

const sum = await client.callTool({ name: "add", arguments: { a: 2, b: 3 } });
console.log("add(2, 3):", sum.content[0].text);

const bad = await client.callTool({ name: "add", arguments: { a: "x", b: 1 } });
console.log("add('x', 1) isError:", Boolean(bad.isError));

await client.close();
