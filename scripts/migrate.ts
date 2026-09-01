// Standalone migration entrypoint for the production runner image.
//
// Intentionally dependency-light: it imports only the PostgreSQL driver and the
// Drizzle migrator (no Better Auth, schema or app modules), so esbuild can emit a
// single self-contained file that the minimal `runner` stage executes on startup
// without tsx or the full node_modules tree. Schema-aware operations (seed) stay
// in scripts/db.ts and the separate `operations` image.
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url || !/^postgres(ql)?:\/\//.test(url)) {
    throw new Error("DATABASE_URL must be configured for PostgreSQL.");
  }
  const migrationsFolder = process.env.MIGRATIONS_DIR ?? "./drizzle";
  const pool = new Pool({ connectionString: url, max: 1, connectionTimeoutMillis: 5000 });
  const db = drizzle(pool);
  try {
    await migrate(db, { migrationsFolder });
    console.log("Migrations applied.");
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "Migration failed.");
  process.exit(1);
});
