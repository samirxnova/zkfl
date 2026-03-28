/**
 * submit-to-chain.ts — Push pre-computed fantasy stats to Aleo testnet
 *
 * Calls zkfl_scoring_v2.aleo/submit_player_stats for each player,
 * then zkfl_scoring_v2.aleo/resolve_match to enable scoring,
 * then auto-PATCHes the backend to mark match as FT/resolved.
 *
 * Usage:
 *   tsx src/submit-to-chain.ts <fixture-json-path> <match_id_field>
 *
 * Example:
 *   tsx src/submit-to-chain.ts data/fixture-demo.json 1field
 */

import { readFileSync } from "fs";
import { execSync } from "child_process";
import { config } from "dotenv";
import { computeMatchFantasy, type PlayerMatchStats, type PlayerFantasyResult } from "./compute-fantasy.js";

config();

const PRIVATE_KEY = process.env.ALEO_PRIVATE_KEY;
const ENDPOINT = process.env.ALEO_ENDPOINT ?? "https://api.explorer.provable.com/v1";
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const SCORING_PROGRAM = "zkfl_scoring_v2";
const CONTRACTS_DIR = "../contracts";

// Map v2 program names to directory names
const DIR_MAP: Record<string, string> = {
  zkfl_scoring_v2: "zkfl_scoring",
};

if (!PRIVATE_KEY) {
  console.error("Missing ALEO_PRIVATE_KEY in .env");
  process.exit(1);
}

// ── Execute a Leo transition on testnet ──

function executeTransition(
  program: string,
  fn: string,
  inputs: string[],
): string {
  const dirName = DIR_MAP[program] ?? program;
  const inputStr = inputs.join(" ");
  const cmd = [
    "leo execute",
    fn,
    inputStr,
    "--network testnet",
    `--private-key ${PRIVATE_KEY}`,
    `--endpoint "${ENDPOINT}"`,
    "--broadcast --yes",
  ].join(" ");

  console.log(`  → ${program}/${fn}(${inputs.join(", ")})`);

  try {
    const output = execSync(cmd, {
      cwd: `${CONTRACTS_DIR}/${dirName}`,
      encoding: "utf-8",
      timeout: 120_000,
    });

    const txMatch = output.match(/at1[a-z0-9]+/);
    const txId = txMatch ? txMatch[0] : "unknown";
    console.log(`    tx: ${txId}`);
    return txId;
  } catch (err: any) {
    console.error(`    FAILED: ${err.message}`);
    throw err;
  }
}

// ── Submit all player stats for a match ──

async function submitPlayerStats(
  matchIdField: string,
  results: PlayerFantasyResult[],
) {
  console.log(`\nSubmitting ${results.length} player stats to ${SCORING_PROGRAM}...`);

  // Submit dummy player 0 first (unused formation slots)
  console.log("\n  Submitting player 0 (dummy for unused slots)...");
  try {
    executeTransition(SCORING_PROGRAM, "submit_player_stats", [
      matchIdField, "0u32", "0i64", "0u32",
    ]);
    console.log("    waiting 10s...");
    await sleep(10_000);
  } catch {
    console.error("    Player 0 failed, continuing...");
  }

  const txIds: string[] = [];
  for (const r of results) {
    const inputs = [
      matchIdField,
      `${r.player_id}u32`,
      `${r.fantasy_points}i64`,
      `${r.minutes_played}u32`,
    ];

    try {
      const txId = executeTransition(SCORING_PROGRAM, "submit_player_stats", inputs);
      txIds.push(txId);
      console.log("    waiting 10s...");
      await sleep(10_000);
    } catch {
      console.error(`    Skipping player ${r.player_id} (${r.name})`);
    }
  }

  return txIds;
}

// ── Resolve match ──

function resolveMatch(matchIdField: string): string {
  console.log(`\nResolving match ${matchIdField}...`);
  return executeTransition(SCORING_PROGRAM, "resolve_match", [matchIdField]);
}

// ── Auto-PATCH backend to mark match as finished/resolved ──

async function patchBackendMatch(matchIdField: string) {
  // Extract numeric match ID from field (e.g., "1field" → 1)
  const numericId = matchIdField.replace("field", "");
  const url = `${BACKEND_URL}/api/matches/${numericId}`;
  console.log(`\nPATCHing backend: ${url}`);

  try {
    const res = await fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "FT", is_resolved: true }),
    });

    if (res.ok) {
      const data = await res.json();
      console.log("  Backend updated:", data.status, "is_resolved:", data.is_resolved);
    } else {
      console.error(`  Backend PATCH failed: ${res.status} ${res.statusText}`);
      console.error("  (Make sure the server is running on port 3001)");
    }
  } catch (err: any) {
    console.error(`  Backend PATCH error: ${err.message}`);
    console.error("  (Make sure the server is running on port 3001)");
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ──

async function main() {
  const fixtureJsonPath = process.argv[2];
  const matchIdField = process.argv[3];

  if (!fixtureJsonPath || !matchIdField) {
    console.log("Usage: tsx src/submit-to-chain.ts <fixture-json> <match_id_field>");
    console.log("Example: tsx src/submit-to-chain.ts data/fixture-demo.json 1field");
    console.log("\nThe fixture JSON should have { players: [...], fixture: {...} } format.");
    process.exit(1);
  }

  if (!matchIdField.endsWith("field")) {
    console.error("match_id_field must end with 'field' (e.g., '1field')");
    process.exit(1);
  }

  // Load fixture data
  const raw = JSON.parse(readFileSync(fixtureJsonPath, "utf-8"));
  const players: PlayerMatchStats[] = raw.players;

  console.log(`Loaded ${players.length} players from ${fixtureJsonPath}`);
  console.log(`Match: ${raw.fixture.home_team.name} ${raw.fixture.home_score}-${raw.fixture.away_score} ${raw.fixture.away_team.name}`);

  // Compute fantasy points
  const results = computeMatchFantasy(players);

  // Show top scorers
  const sorted = [...results].sort((a, b) => b.fantasy_points - a.fantasy_points);
  console.log("\nTop 10 fantasy scorers:");
  for (const r of sorted.slice(0, 10)) {
    console.log(`  ${r.fantasy_points}pts — ${r.name} (${r.position}, ${r.minutes_played}min, bonus: ${r.bonus})`);
  }

  // Submit to chain
  const txIds = await submitPlayerStats(matchIdField, results);
  console.log(`\nSubmitted ${txIds.length}/${results.length} player stats`);

  // Resolve match on-chain
  const resolveTx = resolveMatch(matchIdField);
  console.log(`\nMatch resolved! tx: ${resolveTx}`);

  // Auto-PATCH backend
  await patchBackendMatch(matchIdField);

  // Save results
  const outFile = fixtureJsonPath.replace(".json", "-fantasy.json");
  const { writeFileSync } = await import("fs");
  writeFileSync(outFile, JSON.stringify({ match_id: matchIdField, results: sorted }, null, 2));
  console.log(`\nFantasy results saved to ${outFile}`);
}

main().catch(console.error);
