import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

export const hasDatabase = Boolean(connectionString);

export const pool = connectionString
  ? new Pool({
      connectionString,
      ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
    })
  : null;

export async function ensureTables(): Promise<void> {
  if (!pool) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL,
      company_name TEXT,
      role TEXT,
      team_size INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS shared_reports (
      id TEXT PRIMARY KEY,
      payload JSONB NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);
}

