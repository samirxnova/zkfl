/**
 * migrate.ts — Run schema.sql against Supabase
 *
 * Usage: tsx src/db/migrate.ts
 *
 * Note: For Supabase, you can also paste schema.sql directly
 * into the SQL Editor in the dashboard. This script is for convenience.
 */

import { readFileSync } from "fs";
import { supabase } from "./supabase.js";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const sql = readFileSync(join(__dirname, "schema.sql"), "utf-8");

  console.log("Running migration...");
  const { error } = await supabase.rpc("exec_sql", { sql_string: sql });

  if (error) {
    // If the RPC doesn't exist, tell user to run manually
    console.error("Migration via RPC failed:", error.message);
    console.log("\nPlease run the schema.sql manually in the Supabase SQL Editor:");
    console.log(`  File: ${join(__dirname, "schema.sql")}`);
    return;
  }

  console.log("Migration complete!");
}

migrate().catch(console.error);
