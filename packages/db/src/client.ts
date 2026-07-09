import { drizzle, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Creates a Drizzle client bound to `connectionString`. The underlying
 * postgres.js client connects lazily on first query, so this is safe to call
 * without a live database (e.g. at module load time).
 */
export function createDb(connectionString: string): Database {
  const client = postgres(connectionString);
  return drizzle(client, { schema });
}
