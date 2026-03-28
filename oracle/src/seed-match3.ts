/**
 * seed-match3.ts — Generate demo data for Real Madrid vs Barcelona (match 3)
 *
 * Real Madrid 2-1 Barcelona — El Clásico
 * Vinicius Jr scores, Bellingham adds second, Lewandowski consolation.
 *
 * Usage: tsx src/seed-match3.ts
 * Output: data/fixture-match3.json  +  data/fixture-match3-fantasy.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { computeMatchFantasy, type PlayerMatchStats } from "./compute-fantasy.js";

const FIXTURE_ID = 1098766;

const fixture = {
  fixture_id: FIXTURE_ID,
  home_team: { id: 541, name: "Real Madrid" },
  away_team: { id: 529, name: "Barcelona" },
  home_score: 2,
  away_score: 1,
  status: "FT",
  date: "2025-05-17T19:45:00+00:00",
};

// On-chain IDs
const REAL_MADRID_CLUB_ID = 5;
const BARCELONA_CLUB_ID = 6;

// ── Player Stats ──
// Real Madrid IDs: 501-513
// Barcelona IDs: 601-612

const players: PlayerMatchStats[] = [

  // ════ Real Madrid (home, won 2-1) ════

  // GK
  {
    player_id: 501, name: "Courtois", position: "GK",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 5, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 3, blocks: 0, interceptions: 0, tackles: 0, recoveries: 3,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // DEF
  {
    player_id: 502, name: "Carvajal", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 3, blocks: 1, interceptions: 2, tackles: 3, recoveries: 3,
    key_passes: 2, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 2, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 503, name: "Militao", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 7, blocks: 3, interceptions: 3, tackles: 2, recoveries: 5,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 504, name: "Alaba", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 5, blocks: 1, interceptions: 2, tackles: 2, recoveries: 4,
    key_passes: 3, big_chances_created: 1, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 505, name: "Mendy", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 4, blocks: 1, interceptions: 2, tackles: 3, recoveries: 3,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // MID
  {
    player_id: 506, name: "Kroos", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 1, interceptions: 3, tackles: 2, recoveries: 5,
    key_passes: 5, big_chances_created: 2, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 507, name: "Modric", position: "MID",
    minutes_played: 80, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 4, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 508, name: "Valverde", position: "MID",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 1, interceptions: 3, tackles: 4, recoveries: 5,
    key_passes: 4, big_chances_created: 2, shots_on_target: 2,
    dribbles_completed: 4, fouls_committed: 1, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 509, name: "Bellingham", position: "MID",
    minutes_played: 90, goals: 1, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 5, big_chances_created: 2, shots_on_target: 4,
    dribbles_completed: 5, fouls_committed: 0, fouls_drawn: 4,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // FWD
  {
    player_id: 510, name: "Vinicius", position: "FWD",
    minutes_played: 90, goals: 1, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 4, big_chances_created: 2, shots_on_target: 5,
    dribbles_completed: 8, fouls_committed: 0, fouls_drawn: 5,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 511, name: "Rodrygo", position: "FWD",
    minutes_played: 75, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 2, big_chances_created: 1, shots_on_target: 2,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // Subs
  {
    player_id: 512, name: "Camavinga", position: "MID",
    minutes_played: 10, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 1,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 513, name: "Tchouameni", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 2, blocks: 2, interceptions: 4, tackles: 5, recoveries: 6,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 3, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },

  // ════ Barcelona (away, lost 1-2) ════

  // GK
  {
    player_id: 601, name: "Ter Stegen", position: "GK",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 4, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // DEF
  {
    player_id: 602, name: "Araujo", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 6, blocks: 2, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 2, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 603, name: "Kounde", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 5, blocks: 2, interceptions: 3, tackles: 2, recoveries: 4,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 604, name: "I.Martinez", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 4, blocks: 1, interceptions: 2, tackles: 2, recoveries: 3,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 605, name: "Balde", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 3, big_chances_created: 1, shots_on_target: 0,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // MID
  {
    player_id: 606, name: "Pedri", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 5, big_chances_created: 2, shots_on_target: 2,
    dribbles_completed: 4, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 607, name: "Gavi", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 0, blocks: 1, interceptions: 3, tackles: 4, recoveries: 5,
    key_passes: 3, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 3, fouls_committed: 2, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 608, name: "De Jong", position: "MID",
    minutes_played: 85, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 1, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 3, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // FWD
  {
    player_id: 609, name: "Yamal", position: "FWD",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 3, big_chances_created: 1, shots_on_target: 3,
    dribbles_completed: 6, fouls_committed: 0, fouls_drawn: 4,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 2,
  },
  {
    player_id: 610, name: "Lewandowski", position: "FWD",
    minutes_played: 90, goals: 1, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 2, big_chances_created: 0, shots_on_target: 4,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 2,
  },
  {
    player_id: 611, name: "Raphinha", position: "FWD",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 2, big_chances_created: 1, shots_on_target: 2,
    dribbles_completed: 4, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // Sub
  {
    player_id: 612, name: "F.Torres", position: "FWD",
    minutes_played: 5, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
];

// ── Player Prices (microcredits) ──

export const playerPrices: Record<number, number> = {
  // Real Madrid
  501: 5_500_000,  // Courtois
  502: 6_000_000,  // Carvajal
  503: 6_000_000,  // Militao
  504: 5_500_000,  // Alaba
  505: 5_500_000,  // Mendy
  506: 9_000_000,  // Kroos
  507: 8_000_000,  // Modric
  508: 8_500_000,  // Valverde
  509: 11_000_000, // Bellingham
  510: 13_000_000, // Vinicius
  511: 8_000_000,  // Rodrygo
  512: 5_000_000,  // Camavinga
  513: 5_500_000,  // Tchouameni
  // Barcelona
  601: 5_500_000,  // Ter Stegen
  602: 6_500_000,  // Araujo
  603: 6_000_000,  // Kounde
  604: 5_000_000,  // I.Martinez
  605: 5_500_000,  // Balde
  606: 9_000_000,  // Pedri
  607: 7_500_000,  // Gavi
  608: 7_500_000,  // De Jong
  609: 10_000_000, // Yamal
  610: 12_000_000, // Lewandowski
  611: 8_500_000,  // Raphinha
  612: 4_500_000,  // F.Torres
};

// ── Player Club Mapping ──

export const playerClubs: Record<number, number> = {};
for (const p of players) {
  playerClubs[p.player_id] = p.player_id < 600 ? REAL_MADRID_CLUB_ID : BARCELONA_CLUB_ID;
}

// ── Main ──

function main() {
  const results = computeMatchFantasy(players);
  const sorted = [...results].sort((a, b) => b.fantasy_points - a.fantasy_points);

  console.log("═══════════════════════════════════════════════");
  console.log("Real Madrid 2-1 Barcelona — Fantasy Points");
  console.log("═══════════════════════════════════════════════\n");

  for (const r of sorted) {
    const bonus = r.bonus > 0 ? ` (+${r.bonus} bonus)` : "";
    console.log(
      `  ${String(r.fantasy_points).padStart(3)} pts  ${r.name.padEnd(18)} ${r.position.padEnd(3)}  ${r.minutes_played}min${bonus}`,
    );
  }

  mkdirSync("data", { recursive: true });

  const rawOut = { fixture, players };
  writeFileSync("data/fixture-match3.json", JSON.stringify(rawOut, null, 2));
  console.log("\nSaved raw fixture to data/fixture-match3.json");

  writeFileSync(
    "data/fixture-match3-fantasy.json",
    JSON.stringify(
      {
        match_id: "3field",
        home_club_id: REAL_MADRID_CLUB_ID,
        away_club_id: BARCELONA_CLUB_ID,
        player_prices: playerPrices,
        player_clubs: playerClubs,
        results: sorted,
      },
      null,
      2,
    ),
  );
  console.log("Saved fantasy results to data/fixture-match3-fantasy.json");

  console.log(`\nTotal players: ${results.length}`);
  console.log(`Players who played: ${results.filter((r) => r.minutes_played > 0).length}`);
  console.log(`Highest scorer: ${sorted[0].name} (${sorted[0].fantasy_points}pts)`);
}

main();
