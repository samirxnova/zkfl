/**
 * distribute-prizes.ts — Distribute Aleo credit prizes to winners
 *
 * Reads leaderboard from backend, calculates prizes, calls
 * zkfl_prize_v2.aleo/pay_winner for each winner (real credit payouts).
 *
 * Usage: npx tsx src/distribute-prizes.ts <contest_uuid>
 *
 * Requires backend running on localhost:3001
 */

import { execSync } from "child_process";
import { config } from "dotenv";

config();

const ENDPOINT = process.env.ALEO_ENDPOINT ?? "https://api.explorer.provable.com/v1";
const PRIVATE_KEY = process.env.ALEO_PRIVATE_KEY;
const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:3001";
const CONTRACTS_DIR = process.env.CONTRACTS_DIR ?? "../contracts";

if (!PRIVATE_KEY) {
  console.error("Missing ALEO_PRIVATE_KEY in .env");
  process.exit(1);
}

interface Entry {
  user_address: string;
  score: number | null;
  rank: number | null;
  prize_won_credits: string;
}

interface Contest {
  id: string;
  on_chain_id: string;
  entry_fee_credits: number;
  total_entries: number;
  total_pool_credits: number;
  prize_split: Record<string, number>;
  match?: { on_chain_match_id: string; is_resolved: boolean };
}

function leo(fn: string, inputs: string[]): string {
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

  console.log(`  → zkfl_prize_v2/${fn}(${inputs.join(", ")})`);

  const output = execSync(cmd, {
    cwd: `${CONTRACTS_DIR}/zkfl_prize`,
    encoding: "utf-8",
    timeout: 120_000,
  });

  const txMatch = output.match(/at1[a-z0-9]+/);
  const txId = txMatch ? txMatch[0] : "unknown";
  console.log(`    tx: ${txId}`);
  return txId;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const contestUuid = process.argv[2];

  if (!contestUuid) {
    console.error("Usage: tsx src/distribute-prizes.ts <contest_uuid>");
    console.error("  e.g.: tsx src/distribute-prizes.ts 106d36b2-db96-40c7-a405-ad1ac1a46c9f");
    process.exit(1);
  }

  console.log(`\n=== Prize Distribution ===`);
  console.log(`Contest UUID: ${contestUuid}\n`);

  // 1. Fetch contest info from backend
  const contestRes = await fetch(`${BACKEND_URL}/api/contests/${contestUuid}`);
  if (!contestRes.ok) {
    console.error(`Failed to fetch contest: ${contestRes.status}`);
    process.exit(1);
  }
  const contest: Contest = await contestRes.json();
  console.log(`Contest: ${contest.on_chain_id}`);
  console.log(`Entry fee: ${contest.entry_fee_credits} microcredits (${(contest.entry_fee_credits / 1_000_000).toFixed(2)} credits)`);
  console.log(`Entries: ${contest.total_entries}`);
  console.log(`Prize split: ${JSON.stringify(contest.prize_split)}`);

  // 2. Check match is resolved
  if (!contest.match?.is_resolved) {
    console.error("\nERROR: Match is not resolved yet. Run submit-to-chain first.");
    process.exit(1);
  }
  console.log("Match is resolved.");

  // 3. Fetch leaderboard from backend
  const lbRes = await fetch(`${BACKEND_URL}/api/contests/${contestUuid}/leaderboard`);
  if (!lbRes.ok) {
    console.error(`Failed to fetch leaderboard: ${lbRes.status}`);
    process.exit(1);
  }
  const leaderboard: Entry[] = await lbRes.json();
  const scoredEntries = leaderboard.filter((e) => e.score !== null).sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  if (scoredEntries.length === 0) {
    console.error("\nERROR: No scored entries. Users need to compute_score first.");
    process.exit(1);
  }

  console.log(`\nLeaderboard (${scoredEntries.length} scored entries):`);
  for (const e of scoredEntries) {
    console.log(`  ${e.user_address.slice(0, 16)}... → ${e.score} pts`);
  }

  // 4. Calculate prizes
  const totalPool = contest.entry_fee_credits * contest.total_entries;
  const rake = Math.floor(totalPool * 10 / 100);
  const distributable = totalPool - rake;

  console.log(`\nTotal pool: ${totalPool} microcredits (${(totalPool / 1_000_000).toFixed(2)} credits)`);
  console.log(`Rake (10%): ${rake} microcredits`);
  console.log(`Distributable: ${distributable} microcredits`);

  if (distributable === 0) {
    console.log("\nNo prizes to distribute (free contest or 0 pool).");
    // Still update backend status
    await patchContestSettled(contestUuid);
    return;
  }

  // Parse prize split: { "1": 60, "2": 25, "3": 15 }
  const splitKeys = Object.keys(contest.prize_split).sort((a, b) => Number(a) - Number(b));
  const winners: { address: string; amount: number; rank: number }[] = [];

  for (const key of splitKeys) {
    const rank = Number(key);
    const pct = contest.prize_split[key];
    const entryIdx = rank - 1;
    if (entryIdx >= scoredEntries.length) break;

    const amount = Math.floor(distributable * pct / 100);
    winners.push({
      address: scoredEntries[entryIdx].user_address,
      amount,
      rank,
    });
  }

  console.log("\nPrize distribution:");
  for (const w of winners) {
    console.log(`  #${w.rank}: ${w.address.slice(0, 16)}... → ${w.amount} microcredits (${(w.amount / 1_000_000).toFixed(2)} credits)`);
  }

  // 5. Pay winners on-chain
  const contestIdField = contest.on_chain_id;

  for (const w of winners) {
    console.log(`\nPaying #${w.rank}...`);
    try {
      leo("pay_winner", [contestIdField, w.address, `${w.amount}u64`]);
      await sleep(10_000);

      // Update backend entry
      await fetch(`${BACKEND_URL}/api/contests/${contestUuid}/enter`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_address: w.address,
          prize_won_credits: w.amount,
          rank: w.rank,
        }),
      });
    } catch (err: any) {
      console.error(`  Failed to pay #${w.rank}: ${err.message}`);
    }
  }

  // 6. Mark contest as settled
  await patchContestSettled(contestUuid);

  console.log("\n=== Distribution Complete ===");
}

async function patchContestSettled(contestUuid: string) {
  try {
    const res = await fetch(`${BACKEND_URL}/api/contests/${contestUuid}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "settled" }),
    });
    if (res.ok) {
      console.log("\nContest marked as settled in backend.");
    }
  } catch {
    console.error("\nFailed to update contest status in backend.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
