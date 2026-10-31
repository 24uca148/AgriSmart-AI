import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "@shared/schema";

// Real PostgreSQL connection. Set DATABASE_URL to a Postgres connection
// string, e.g. postgres://user:password@localhost:5432/agrismart
//
// If DATABASE_URL isn't set, server/storage.ts falls back to an in-memory
// store instead of importing this module, so this file only runs (and only
// needs a reachable Postgres server) once a real database is configured.
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set to a PostgreSQL connection string, e.g. postgres://user:password@localhost:5432/agrismart",
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle(pool, { schema });
