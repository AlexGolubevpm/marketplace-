import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export * from "./schema";
export { schema };

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/cargo_marketplace";

// Lazy connection — don't crash if DB is unavailable at import time
let _client: ReturnType<typeof postgres> | null = null;
let _db: ReturnType<typeof drizzle> | null = null;

export function getDb() {
  if (!_db) {
    _client = postgres(connectionString);
    _db = drizzle(_client, { schema });
  }
  return _db;
}

// For backward compatibility — creates connection on first access
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export type Database = ReturnType<typeof drizzle>;
