/**
 * Database wrapper for Business OS
 * 
 * Provides a consistent db interface for all Business OS components
 */

import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "../../drizzle/schema";

let connection: mysql.Connection | null = null;
let dbInstance: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (dbInstance) return dbInstance;

  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL environment variable is not set");
  }

  connection = await mysql.createConnection(process.env.DATABASE_URL);
  dbInstance = drizzle(connection, { schema, mode: "default" });

  return dbInstance;
}

export const db = {
  query: {} as any,
  insert: async (table: any) => {
    const dbConn = await getDb();
    return dbConn.insert(table);
  },
  update: async (table: any) => {
    const dbConn = await getDb();
    return dbConn.update(table);
  },
  delete: async (table: any) => {
    const dbConn = await getDb();
    return dbConn.delete(table);
  },
  select: async () => {
    const dbConn = await getDb();
    return dbConn.select();
  },
};

// Initialize query interface
(async () => {
  const dbConn = await getDb();
  db.query = dbConn.query;
})();
