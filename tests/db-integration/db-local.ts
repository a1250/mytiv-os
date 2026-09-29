// Test-only stand-in for lib/db: the same schema on a node-postgres Drizzle, pointed at the throwaway DB
// (PGHOST/PGPORT/PGUSER + ITEST_DB) instead of the neon-http production driver.
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../../lib/db/schema';
export const pool = new pg.Pool({ database: process.env.ITEST_DB, max: 4 });
export const db = drizzle(pool, { schema });
