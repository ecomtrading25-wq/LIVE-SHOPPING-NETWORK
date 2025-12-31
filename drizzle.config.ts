import { defineConfig } from "drizzle-kit";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is required to run drizzle commands");
}

// Auto-detect database type from connection string
// PostgreSQL: postgres:// or postgresql://
// MySQL: mysql://
const isPostgres = connectionString.startsWith("postgres://") || connectionString.startsWith("postgresql://");
const dialect = isPostgres ? "postgresql" : "mysql";

console.log(`[Drizzle] Using ${dialect} dialect`);

export default defineConfig({
  schema: "./drizzle/schema.ts",
  out: "./drizzle",
  dialect: dialect,
  dbCredentials: {
    url: connectionString,
  },
});
