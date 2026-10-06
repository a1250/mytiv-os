import { drizzle } from "drizzle-orm/neon-http";
import { neon, neonConfig } from "@neondatabase/serverless";
import * as schema from "./schema";
import { localSqlEndpoint } from "./local-endpoint";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set — copy .env.example to .env.local and fill it in.");
}

// Local integration only: a throwaway PostgreSQL behind scripts/focus/int/neon-local-sql.mjs. Never set in any
// deployed environment, and refused unless DATABASE_URL itself is a localhost URL (see local-endpoint.ts).
const local = localSqlEndpoint(process.env.DATABASE_URL, process.env.NEON_LOCAL_SQL_ENDPOINT);
if (local) neonConfig.fetchEndpoint = () => local;

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
