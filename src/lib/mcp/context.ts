import type { RequestContext } from "./tools";

/**
 * Header a trusted caller can use to pass per-request context to the MCP
 * route. (Route files may only export handlers and route config, so shared
 * constants live here.)
 */
export const CONTEXT_HEADER = "x-mcp-context";

export function contextFromHeader(req: Request): RequestContext {
  const raw = req.headers.get(CONTEXT_HEADER);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as RequestContext) : {};
  } catch {
    return {};
  }
}
