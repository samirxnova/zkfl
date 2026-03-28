/**
 * setup.ts — Create all database tables from schema.sql
 *
 * Usage: npx tsx src/db/setup.ts
 *
 * This runs the schema SQL against your Supabase database.
 * Optionally pass --reset to drop all tables first.
 */

import { readFileSync } from "fs";
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";

config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const doReset = process.argv.includes("--reset");

async function run() {
  if (doReset) {
    console.log("Dropping existing tables...");
    const dropSQL = `
      DROP TABLE IF EXISTS entries CASCADE;
      DROP TABLE IF EXISTS player_match_stats CASCADE;
      DROP TABLE IF EXISTS match_player_prices CASCADE;
      DROP TABLE IF EXISTS contests CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS matches CASCADE;
      DROP TABLE IF EXISTS players CASCADE;
      DROP TABLE IF EXISTS clubs CASCADE;
      DROP FUNCTION IF EXISTS increment_contest_entries;
    `;
    const { error } = await supabase.rpc("exec_sql", { sql: dropSQL });
    if (error) {
      // rpc may not exist, try raw fetch
      console.log("  (rpc not available, using REST endpoint)");
      const res = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
        body: JSON.stringify({ sql: dropSQL }),
      });
      if (!res.ok) {
        console.error("  Drop failed via REST. Run this SQL manually in Supabase SQL Editor:");
        console.error(dropSQL);
      }
    }
    console.log("  Done.\n");
  }

  console.log("Creating tables from schema.sql...");
  const schemaSQL = readFileSync(new URL("./schema.sql", import.meta.url), "utf-8");

  // Supabase JS client can't run raw SQL directly.
  // The schema needs to be run in the Supabase SQL Editor.
  // Print instructions:
  console.log("\n═══════════════════════════════════════════════");
  console.log("Supabase does not allow raw SQL via the JS client.");
  console.log("Please run the following in your Supabase SQL Editor:");
  console.log("  Dashboard → SQL Editor → New Query → Paste & Run");
  console.log("═══════════════════════════════════════════════\n");

  if (doReset) {
    console.log("--- STEP 1: DROP (paste this first) ---\n");
    console.log(`DROP TABLE IF EXISTS entries CASCADE;
DROP TABLE IF EXISTS player_match_stats CASCADE;
DROP TABLE IF EXISTS match_player_prices CASCADE;
DROP TABLE IF EXISTS contests CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS matches CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS clubs CASCADE;
DROP FUNCTION IF EXISTS increment_contest_entries;`);
    console.log("\n--- STEP 2: CREATE (paste this second) ---\n");
  }

  console.log("Schema file: zkfl/server/src/db/schema.sql");
  console.log("Then run: npx tsx src/db/seed.ts\n");
}

run().catch(console.error);
