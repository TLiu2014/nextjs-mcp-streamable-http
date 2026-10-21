/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // The MCP SDK ships optional transports (Express/stdio) and a JSON-schema
  // validator that Next's bundler shouldn't try to inline. Keep it external so
  // the route bundle stays lean and loads the SDK at runtime.
  serverExternalPackages: ["@modelcontextprotocol/sdk"],
};

export default nextConfig;
