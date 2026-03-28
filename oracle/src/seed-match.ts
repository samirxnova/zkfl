/**
 * seed-match.ts — Generate hardcoded demo data for a real EPL match
 *
 * For the buildathon demo, we don't need a live API-Football key.
 * This script creates realistic player stats for Arsenal vs Chelsea,
 * computes fantasy points, and writes the fixture JSON that
 * submit-to-chain.ts can consume.
 *
 * Usage: tsx src/seed-match.ts
 */

import { writeFileSync, mkdirSync } from "fs";
import { computeMatchFantasy, type PlayerMatchStats } from "./compute-fantasy.js";

// ── Arsenal vs Chelsea — Example GW15 data ──
// Based on a realistic EPL match with plausible stats

const FIXTURE_ID = 1035057; // Placeholder

const fixture = {
  fixture_id: FIXTURE_ID,
  home_team: { id: 42, name: "Arsenal" },
  away_team: { id: 49, name: "Chelsea" },
  home_score: 2,
  away_score: 1,
  status: "FT",
  date: "2024-12-15T16:30:00+00:00",
};

// On-chain IDs: we use simple sequential IDs for demo
// Arsenal club_id = 1, Chelsea club_id = 2
const ARSENAL_CLUB_ID = 1;
const CHELSEA_CLUB_ID = 2;

// Player IDs (on-chain u32) — using API-Football-style IDs
const players: PlayerMatchStats[] = [
  // ── Arsenal (home, won 2-1) ──
  // GK
  { player_id: 101, name: "Raya", position: "GK", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 5, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 1, blocks: 0, interceptions: 0, tackles: 0, recoveries: 2, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  // DEF
  { player_id: 102, name: "White", position: "DEF", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 1, red_card: false, own_goals: 0, clearances: 3, blocks: 1, interceptions: 2, tackles: 3, recoveries: 4, key_passes: 1, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 103, name: "Saliba", position: "DEF", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 5, blocks: 2, interceptions: 3, tackles: 2, recoveries: 3, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 104, name: "Gabriel", position: "DEF", minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 4, blocks: 1, interceptions: 1, tackles: 1, recoveries: 2, key_passes: 0, big_chances_created: 0, shots_on_target: 1, dribbles_completed: 0, fouls_committed: 2, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 105, name: "Timber", position: "DEF", minutes_played: 82, goals: 0, assists: 1, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 2, blocks: 0, interceptions: 2, tackles: 4, recoveries: 3, key_passes: 2, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 2, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  // MID
  { player_id: 106, name: "Rice", position: "MID", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 1, red_card: false, own_goals: 0, clearances: 2, blocks: 1, interceptions: 3, tackles: 5, recoveries: 6, key_passes: 2, big_chances_created: 0, shots_on_target: 1, dribbles_completed: 1, fouls_committed: 2, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 107, name: "Odegaard", position: "MID", minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 2, key_passes: 5, big_chances_created: 2, shots_on_target: 2, dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 3, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 108, name: "Havertz", position: "MID", minutes_played: 78, goals: 1, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1, key_passes: 1, big_chances_created: 0, shots_on_target: 2, dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 2, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1 },
  // FWD
  { player_id: 109, name: "Saka", position: "FWD", minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1, key_passes: 3, big_chances_created: 1, shots_on_target: 1, dribbles_completed: 4, fouls_committed: 0, fouls_drawn: 3, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 110, name: "Martinelli", position: "FWD", minutes_played: 72, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1, key_passes: 1, big_chances_created: 0, shots_on_target: 1, dribbles_completed: 3, fouls_committed: 1, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1 },
  { player_id: 111, name: "Trossard", position: "FWD", minutes_played: 18, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  // Subs
  { player_id: 112, name: "Nketiah", position: "FWD", minutes_played: 12, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 113, name: "Zinchenko", position: "DEF", minutes_played: 8, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },

  // ── Chelsea (away, lost 1-2) ──
  // GK
  { player_id: 201, name: "Sanchez", position: "GK", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 3, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 1, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  // DEF
  { player_id: 202, name: "James", position: "DEF", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2, yellow_cards: 1, red_card: false, own_goals: 0, clearances: 2, blocks: 1, interceptions: 1, tackles: 3, recoveries: 2, key_passes: 1, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 1, fouls_committed: 2, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 203, name: "Thiago Silva", position: "DEF", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 6, blocks: 2, interceptions: 4, tackles: 1, recoveries: 3, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 204, name: "Colwill", position: "DEF", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 3, blocks: 1, interceptions: 2, tackles: 2, recoveries: 2, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 205, name: "Cucurella", position: "DEF", minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 2, blocks: 0, interceptions: 1, tackles: 2, recoveries: 3, key_passes: 2, big_chances_created: 1, shots_on_target: 0, dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  // MID
  { player_id: 206, name: "Caicedo", position: "MID", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 1, red_card: false, own_goals: 0, clearances: 1, blocks: 2, interceptions: 4, tackles: 4, recoveries: 5, key_passes: 1, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 1, fouls_committed: 3, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 207, name: "Enzo", position: "MID", minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 1, interceptions: 2, tackles: 3, recoveries: 3, key_passes: 3, big_chances_created: 1, shots_on_target: 1, dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 208, name: "Palmer", position: "MID", minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1, key_passes: 4, big_chances_created: 1, shots_on_target: 3, dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 2, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1 },
  // FWD
  { player_id: 209, name: "Jackson", position: "FWD", minutes_played: 85, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1, key_passes: 0, big_chances_created: 0, shots_on_target: 1, dribbles_completed: 1, fouls_committed: 2, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 2 },
  { player_id: 210, name: "Sterling", position: "FWD", minutes_played: 68, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0, key_passes: 1, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 1, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  { player_id: 211, name: "Mudryk", position: "FWD", minutes_played: 22, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 1, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
  // Sub
  { player_id: 212, name: "Gallagher", position: "MID", minutes_played: 5, goals: 0, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0, key_passes: 0, big_chances_created: 0, shots_on_target: 0, dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0, penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0 },
];

// Player prices (USDCx units, 6 decimals — e.g., 10_000_000 = $10)
export const playerPrices: Record<number, number> = {
  // Arsenal
  101: 5_500_000, // Raya
  102: 5_000_000, // White
  103: 5_500_000, // Saliba
  104: 5_000_000, // Gabriel
  105: 4_500_000, // Timber
  106: 6_000_000, // Rice
  107: 8_000_000, // Odegaard
  108: 7_500_000, // Havertz
  109: 8_500_000, // Saka
  110: 7_000_000, // Martinelli
  111: 6_500_000, // Trossard
  112: 5_000_000, // Nketiah
  113: 4_500_000, // Zinchenko
  // Chelsea
  201: 4_500_000, // Sanchez
  202: 5_000_000, // James
  203: 5_000_000, // Thiago Silva
  204: 4_500_000, // Colwill
  205: 5_000_000, // Cucurella
  206: 5_500_000, // Caicedo
  207: 6_000_000, // Enzo
  208: 9_000_000, // Palmer
  209: 7_000_000, // Jackson
  210: 6_000_000, // Sterling
  211: 5_500_000, // Mudryk
  212: 5_000_000, // Gallagher
};

// Player club mapping
export const playerClubs: Record<number, number> = {};
for (const p of players) {
  playerClubs[p.player_id] = p.player_id < 200 ? ARSENAL_CLUB_ID : CHELSEA_CLUB_ID;
}

// ── Main ──

function main() {
  // Compute fantasy points
  const results = computeMatchFantasy(players);

  // Sort by points
  const sorted = [...results].sort((a, b) => b.fantasy_points - a.fantasy_points);

  console.log("═══════════════════════════════════════════════");
  console.log("Arsenal 2-1 Chelsea — Fantasy Points");
  console.log("═══════════════════════════════════════════════\n");

  for (const r of sorted) {
    const bonus = r.bonus > 0 ? ` (+${r.bonus} bonus)` : "";
    console.log(`  ${String(r.fantasy_points).padStart(3)} pts  ${r.name.padEnd(16)} ${r.position.padEnd(3)}  ${r.minutes_played}min${bonus}`);
  }

  // Write fixture JSON
  mkdirSync("data", { recursive: true });
  const outData = { fixture, players };
  writeFileSync("data/fixture-demo.json", JSON.stringify(outData, null, 2));
  console.log("\nSaved fixture data to data/fixture-demo.json");

  // Write fantasy results
  writeFileSync(
    "data/fixture-demo-fantasy.json",
    JSON.stringify({
      match_id: "1field",
      home_club_id: ARSENAL_CLUB_ID,
      away_club_id: CHELSEA_CLUB_ID,
      player_prices: playerPrices,
      player_clubs: playerClubs,
      results: sorted,
    }, null, 2),
  );
  console.log("Saved fantasy results to data/fixture-demo-fantasy.json");

  // Summary
  console.log(`\nTotal players: ${results.length}`);
  console.log(`Players who played: ${results.filter((r) => r.minutes_played > 0).length}`);
  console.log(`Highest scorer: ${sorted[0].name} (${sorted[0].fantasy_points}pts)`);
}

main();
