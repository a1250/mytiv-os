// LOCAL TEST TOOLING ONLY — a localhost HTTP endpoint speaking the Neon serverless driver's SQL-over-HTTP format,
// backed by a throwaway local PostgreSQL. The app reaches it only through lib/db/local-endpoint.ts (both URLs must be
// localhost). Usage: DATABASE_URL=postgresql://postgres@127.0.0.1:55432/focus_int ITEST_PG_MODULE=/path/to/pg \
//   node scripts/focus/int/neon-local-sql.mjs [port]
import http from "node:http";
import { createRequire } from "node:module";

const LOCAL = new Set(["127.0.0.1", "localhost", "::1", "[::1]"]);
const host = (u) => { try { return new URL(u.replace(/^postgres(ql)?:/, "http:")).hostname; } catch { return ""; } };
if (!LOCAL.has(host(process.env.DATABASE_URL ?? ""))) { console.error("neon-local-sql: refusing — DATABASE_URL is not local"); process.exit(2); }
if (!process.env.ITEST_PG_MODULE) { console.error("neon-local-sql: set ITEST_PG_MODULE=/path/to/node_modules/pg"); process.exit(2); }
const pg = createRequire(import.meta.url)(process.env.ITEST_PG_MODULE);
const types = { getTypeParser: () => (v) => v }; // raw text: the Neon client parses values by dataTypeID itself
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, max: 10, types });

const fieldsOf = (r) => (r.fields ?? []).map((f) => ({ name: f.name, dataTypeID: f.dataTypeID, tableID: f.tableID, columnID: f.columnID, dataTypeSize: f.dataTypeSize, dataTypeModifier: f.dataTypeModifier, format: "text" }));
const shape = (r) => ({ command: r.command, rowCount: r.rowCount, rows: r.rows, fields: fieldsOf(r), rowAsArray: true });
const run = (c, q) => c.query({ text: q.query, values: q.params ?? [], rowMode: "array", types });
const pgError = (e) => ({ message: e.message, code: e.code, severity: e.severity, detail: e.detail, hint: e.hint, position: e.position, where: e.where, schema: e.schema, table: e.table, column: e.column, dataType: e.dataType, constraint: e.constraint, routine: e.routine });

const server = http.createServer(async (req, res) => {
  const send = (status, body) => { res.writeHead(status, { "content-type": "application/json" }); res.end(JSON.stringify(body)); };
  if (req.method !== "POST" || !req.url?.endsWith("/sql")) return send(404, { message: "not found" });
  if (!LOCAL.has(host(String(req.headers["neon-connection-string"] ?? "")))) return send(400, { message: "refusing a non-local connection string" });
  let raw = ""; for await (const ch of req) raw += ch;
  const body = JSON.parse(raw);
  const client = await pool.connect();
  try {
    if (Array.isArray(body.queries)) {
      const iso = req.headers["neon-batch-isolation-level"];
      const ro = req.headers["neon-batch-read-only"] === "true";
      await client.query(`BEGIN${iso ? ` ISOLATION LEVEL ${String(iso).replace(/([a-z])([A-Z])/g, "$1 $2").toUpperCase()}` : ""}${ro ? " READ ONLY" : ""}`);
      try {
        const results = [];
        for (const q of body.queries) results.push(shape(await run(client, q)));
        await client.query("COMMIT");
        return send(200, { results });
      } catch (e) { await client.query("ROLLBACK").catch(() => {}); return send(400, pgError(e)); }
    }
    return send(200, shape(await run(client, body)));
  } catch (e) { return send(400, pgError(e)); } finally { client.release(); }
});
const port = Number(process.argv[2] ?? 4444);
server.listen(port, "127.0.0.1", () => console.log(`neon-local-sql on http://127.0.0.1:${port}/sql`));
