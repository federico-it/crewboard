import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import * as schema from "./schema";

export function createDatabase(connectionString: string) {
  const pool = new Pool({ connectionString, max: 5, connectionTimeoutMillis: 5000, idleTimeoutMillis: 30000 });
  return { pool, db: drizzle(pool, { schema }) };
}
let database: ReturnType<typeof createDatabase> | undefined;
export function getDatabase() {
  if (!database) {
    const url = process.env.DATABASE_URL;
    if (!url || !/^postgres(ql)?:\/\//.test(url)) throw new Error("DATABASE_URL must be configured for PostgreSQL.");
    database = createDatabase(url);
  }
  return database;
}
