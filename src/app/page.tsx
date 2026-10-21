export default function Home() {
  return (
    <main>
      <h1>Next.js MCP · Streamable HTTP</h1>
      <p>
        A stateless MCP server is running at <code>/api/mcp</code>. Point any
        MCP client at it with the Streamable HTTP transport.
      </p>
      <pre>
        claude mcp add --transport http nextjs-mcp http://localhost:3000/api/mcp
      </pre>
      <p>
        Try the loopback client, where this app calls its own MCP server and
        forwards per-request context in a header:{" "}
        <a href="/api/demo?a=2&b=3&caller=alice">/api/demo?a=2&amp;b=3&amp;caller=alice</a>
      </p>
    </main>
  );
}
