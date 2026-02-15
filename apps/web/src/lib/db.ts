import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "@cargo/db/src/schema";

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/cargo_marketplace";

// Singleton pattern for serverless/edge
const globalForDb = globalThis as unknown as {
  _pgClient: ReturnType<typeof postgres> | undefined;
};

if (!globalForDb._pgClient) {
  globalForDb._pgClient = postgres(connectionString);
}

export const db = drizzle(globalForDb._pgClient, { schema });
export { schema };
