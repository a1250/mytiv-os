/**
 * The local SQL endpoint for the Neon HTTP driver — integration tests only. Returns the endpoint only when BOTH the
 * database URL and the endpoint are localhost (127.0.0.1 / localhost / ::1); anything else returns null, so a
 * deployed environment (Neon) can never be redirected by an env variable.
 */
const LOCAL = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const hostOf = (u: string, scheme: RegExp) => { try { return new URL(u.replace(scheme, "http:")).hostname; } catch { return ""; } };

export function localSqlEndpoint(databaseUrl: string | undefined, endpoint: string | undefined): string | null {
  if (!databaseUrl || !endpoint) return null;
  if (!LOCAL.has(hostOf(databaseUrl, /^postgres(ql)?:/))) return null;
  if (!/^http:\/\//.test(endpoint) || !LOCAL.has(hostOf(endpoint, /^http:/))) return null;
  return endpoint;
}
