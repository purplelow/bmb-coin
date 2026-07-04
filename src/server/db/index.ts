/**
 * Database handle (SQLite file via libsql) — SERVER ONLY.
 * Module-level singleton; the file lives at the project root (gitignored).
 */

import { createClient } from '@libsql/client';
import { drizzle } from 'drizzle-orm/libsql';
import * as schema from './schema';

const client = createClient({
  url: process.env.DATABASE_URL ?? 'file:koinlab.db',
});

export const db = drizzle(client, { schema });
export { schema };
