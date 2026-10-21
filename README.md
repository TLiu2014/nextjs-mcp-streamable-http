# nextjs-mcp-streamable-http

A minimal, **stateless MCP server on the Next.js App Router** over the
**Streamable HTTP** transport, plus a **loopback MCP client** that forwards
per-request context in a header.

It's the setup I wanted when building
[RealityAnchor](https://github.com/TLiu2014/reality-anchor), an Alexa+ MCP add-on.
I pulled it out into a small template so you don't have to work through the same
transport and bundling issues yourself.

- One route (`/api/mcp`) speaks MCP over Streamable HTTP (spec 2025-11-25)
- Stateless: a fresh server per request, so it runs on any serverless host
- Works with Claude Code, Claude Desktop, MCP Inspector, Cursor, Gemini, and others
- A loopback client (`/api/demo`) shows how your app can call its own MCP server
- No model, no API keys, no database. Three example tools you can replace

## Quick start

```bash
pnpm install
pnpm dev                 # http://localhost:3000
pnpm smoke               # in a second terminal: list tools + call one
```

Connect a real MCP client:

```bash
# Claude Code
claude mcp add --transport http nextjs-mcp http://localhost:3000/api/mcp
claude mcp list          # → nextjs-mcp … ✔ Connected

# MCP Inspector (GUI)
npx @modelcontextprotocol/inspector
# Transport: Streamable HTTP · URL: http://localhost:3000/api/mcp
```

Try the loopback client: <http://localhost:3000/api/demo?a=2&b=3&caller=alice>

```json
{ "tools": ["add", "get_time", "whoami"], "add": { "sum": 5 }, "whoami": { "caller": "alice" } }
```

## Layout

```
src/
  app/api/mcp/route.ts    MCP endpoint (Streamable HTTP, stateless)
  app/api/demo/route.ts   Loopback MCP client + header forwarding
  lib/mcp/server.ts       Builds the MCP Server, registers tools/list + tools/call
  lib/mcp/tools.ts        Example tools: add, get_time, whoami  ← replace these
  lib/mcp/context.ts      Per-request context header helpers
scripts/smoke.mjs         External-client smoke test
```

To add a tool, add a definition to `TOOL_DEFINITIONS` and a `case` in `callTool`
in `src/lib/mcp/tools.ts`. Nothing else needs to change.

## How it works and why

**Streamable HTTP, not the old SSE transport.** The SDK's `SSEServerTransport` is
deprecated and needs a raw Node `http.ServerResponse`, which App Router handlers
never get. `WebStandardStreamableHTTPServerTransport` works directly on
Web-standard `Request`/`Response`, which is what a route handler receives. It
still streams over SSE, so you get streaming with the current transport.

**Stateless by default.** `sessionIdGenerator: undefined` means no session state
between requests. Each request builds a fresh `Server` and closes it when the
response finishes. Any instance can serve any request, so it fits serverless
hosting. If you need server-to-client push or long-lived sessions, switch to
stateful mode and keep sessions in a shared store.

**One handler for three verbs.** Streamable HTTP uses `POST` (JSON-RPC), `GET`
(the SSE stream), and `DELETE` (end a session), so the route exports the same
handler for all three.

**Route config that matters.**
- `runtime = "nodejs"`: the SDK doesn't run on the Edge runtime.
- `dynamic = "force-dynamic"`: MCP responses must never be cached.
- `serverExternalPackages: ["@modelcontextprotocol/sdk"]` in `next.config.mjs`:
  stops Next from bundling the SDK's optional transports and schema validator
  into the route.

**Loopback client + header forwarding.** An in-app agent can be a real MCP client
of your own server (`new URL("/api/mcp", origin)`), so the tool calls it shows
are actual MCP round-trips. `StreamableHTTPClientTransport` accepts
`requestInit.headers`, so you can pass per-request context such as a user id or a
browser-supplied API key (BYOK). The server reads it for that one request and
never stores it. RealityAnchor uses this to send a user's own Amazon Bedrock key
through its in-app agent's MCP call.

> Only trust the context header from callers you control. External MCP clients
> can set any header they want. If the context carries anything sensitive or
> privileged, authenticate the caller first.

## Gotchas I ran into

- **Route files can only export handlers and route config.** Put shared constants
  (like the context header name) in `lib/`, or `next build` will fail.
- **A stateless server has no push channel.** Tool calls from an external client
  (say, in a terminal) can't update a browser UI by themselves. Use a separate
  path, such as a shared store plus SSE, if you need that.
- **Check which port you're on.** If another app is already on `:3000`, the client
  connects to it, gets HTML back, and the error doesn't make that clear.
  `PORT=3030 pnpm dev` avoids it.

## License

[MIT](./LICENSE)
