import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '@shared/schema';
import 'dotenv/config';

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL must be set.");
}

// 👇 This is the magic that works with CommonJS pg in ESM Node
const pg = await import('pg');
const pool = new pg.default.Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
