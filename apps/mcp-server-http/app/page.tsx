export default function Home() {
  return (
    <main style={{ fontFamily: "monospace", padding: "2rem" }}>
      <h1>csmf-blog MCP server</h1>
      <p>
        This app hosts the Streamable HTTP transport for{" "}
        <code>@csmf/mcp-server</code>. There is nothing to see here in a
        browser — point an MCP client at <code>/api/mcp</code> with an{" "}
        <code>Authorization: Bearer &lt;token&gt;</code> header.
      </p>
    </main>
  );
}
