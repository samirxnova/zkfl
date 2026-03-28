/**
 * seed-match2.ts — Generate demo data for Man City vs Liverpool (match 2)
 *
 * Man City 3-2 Liverpool — high-scoring, demo-friendly fixture.
 * Haaland bags a brace, Salah grabs one back.
 *
 * Usage: tsx src/seed-match2.ts
 * Output: data/fixture-match2.json  +  data/fixture-match2-fantasy.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { computeMatchFantasy, type PlayerMatchStats } from "./compute-fantasy.js";

const FIXTURE_ID = 1098765;

const fixture = {
  fixture_id: FIXTURE_ID,
  home_team: { id: 50, name: "Manchester City" },
  away_team: { id: 40, name: "Liverpool" },
  home_score: 3,
  away_score: 2,
  status: "FT",
  date: "2025-05-10T16:30:00+00:00",
};

// On-chain IDs
const MAN_CITY_CLUB_ID = 3;
const LIVERPOOL_CLUB_ID = 4;

// ── Player Stats ──
// Man City IDs: 301-313
// Liverpool IDs: 401-412

const players: PlayerMatchStats[] = [

  // ════ Man City (home, won 3-2) ════

  // GK
  {
    player_id: 301, name: "Ederson", position: "GK",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 4, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 0, tackles: 0, recoveries: 2,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // DEF
  {
    player_id: 302, name: "Walker", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 3, blocks: 1, interceptions: 2, tackles: 4, recoveries: 3,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 303, name: "Dias", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 6, blocks: 2, interceptions: 3, tackles: 2, recoveries: 4,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 304, name: "Akanji", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 4, blocks: 2, interceptions: 2, tackles: 3, recoveries: 3,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 2, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 305, name: "Gvardiol", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 2,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 1, tackles: 3, recoveries: 3,
    key_passes: 2, big_chances_created: 1, shots_on_target: 0,
    dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // MID
  {
    player_id: 306, name: "Rodri", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 2, blocks: 2, interceptions: 4, tackles: 5, recoveries: 7,
    key_passes: 2, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 3, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 307, name: "De Bruyne", position: "MID",
    minutes_played: 90, goals: 0, assists: 2, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 2,
    key_passes: 7, big_chances_created: 3, shots_on_target: 2,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 4,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 308, name: "B.Silva", position: "MID",
    minutes_played: 85, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 2, recoveries: 3,
    key_passes: 4, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 3, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 309, name: "Foden", position: "MID",
    minutes_played: 90, goals: 1, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 3, big_chances_created: 1, shots_on_target: 3,
    dribbles_completed: 4, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // FWD
  {
    player_id: 310, name: "Haaland", position: "FWD",
    minutes_played: 90, goals: 2, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 1, big_chances_created: 0, shots_on_target: 5,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 311, name: "Doku", position: "FWD",
    minutes_played: 72, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 2, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 5, fouls_committed: 0, fouls_drawn: 4,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // Subs
  {
    player_id: 312, name: "Stones", position: "DEF",
    minutes_played: 18, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 313, name: "Bobb", position: "MID",
    minutes_played: 5, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },

  // ════ Liverpool (away, lost 2-3) ════

  // GK
  {
    player_id: 401, name: "Alisson", position: "GK",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 6, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 0, tackles: 0, recoveries: 2,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // DEF
  {
    player_id: 402, name: "Alexander-Arnold", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 4, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 403, name: "Konate", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 5, blocks: 2, interceptions: 3, tackles: 2, recoveries: 3,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 2, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 404, name: "Van Dijk", position: "DEF",
    minutes_played: 90, goals: 1, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 7, blocks: 3, interceptions: 2, tackles: 1, recoveries: 4,
    key_passes: 0, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 405, name: "Robertson", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 3, blocks: 1, interceptions: 2, tackles: 3, recoveries: 3,
    key_passes: 2, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // MID
  {
    player_id: 406, name: "Gravenberch", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 1, interceptions: 3, tackles: 4, recoveries: 5,
    key_passes: 2, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 2, fouls_committed: 2, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 407, name: "Mac Allister", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 1, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 3, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 408, name: "Szoboszlai", position: "MID",
    minutes_played: 75, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 2, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // FWD
  {
    player_id: 409, name: "Salah", position: "FWD",
    minutes_played: 90, goals: 1, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 3, big_chances_created: 1, shots_on_target: 4,
    dribbles_completed: 5, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 2,
  },
  {
    player_id: 410, name: "Diaz", position: "FWD",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 2, big_chances_created: 0, shots_on_target: 2,
    dribbles_completed: 4, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 411, name: "Gakpo", position: "FWD",
    minutes_played: 68, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0,
    key_passes: 1, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // Sub
  {
    player_id: 412, name: "Jones", position: "MID",
    minutes_played: 22, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 1,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
];

// ── Player Prices (microcredits) ──

export const playerPrices: Record<number, number> = {
  // Man City
  301: 5_000_000,  // Ederson
  302: 5_000_000,  // Walker
  303: 5_500_000,  // Dias
  304: 5_000_000,  // Akanji
  305: 5_500_000,  // Gvardiol
  306: 6_500_000,  // Rodri
  307: 10_000_000, // De Bruyne
  308: 7_000_000,  // B.Silva
  309: 8_000_000,  // Foden
  310: 14_000_000, // Haaland
  311: 6_500_000,  // Doku
  312: 5_000_000,  // Stones
  313: 4_500_000,  // Bobb
  // Liverpool
  401: 5_500_000,  // Alisson
  402: 8_000_000,  // Alexander-Arnold
  403: 5_000_000,  // Konate
  404: 6_000_000,  // Van Dijk
  405: 6_000_000,  // Robertson
  406: 5_500_000,  // Gravenberch
  407: 5_500_000,  // Mac Allister
  408: 5_500_000,  // Szoboszlai
  409: 13_000_000, // Salah
  410: 7_000_000,  // Diaz
  411: 6_500_000,  // Gakpo
  412: 4_500_000,  // Jones
};

// ── Player Club Mapping ──

export const playerClubs: Record<number, number> = {};
for (const p of players) {
  playerClubs[p.player_id] = p.player_id < 400 ? MAN_CITY_CLUB_ID : LIVERPOOL_CLUB_ID;
}

// ── Main ──

function main() {
  const results = computeMatchFantasy(players);
  const sorted = [...results].sort((a, b) => b.fantasy_points - a.fantasy_points);

  console.log("═══════════════════════════════════════════════");
  console.log("Man City 3-2 Liverpool — Fantasy Points");
  console.log("═══════════════════════════════════════════════\n");

  for (const r of sorted) {
    const bonus = r.bonus > 0 ? ` (+${r.bonus} bonus)` : "";
    console.log(
      `  ${String(r.fantasy_points).padStart(3)} pts  ${r.name.padEnd(18)} ${r.position.padEnd(3)}  ${r.minutes_played}min${bonus}`,
    );
  }

  mkdirSync("data", { recursive: true });

  // Raw fixture (for submit-to-chain.ts)
  const rawOut = { fixture, players };
  writeFileSync("data/fixture-match2.json", JSON.stringify(rawOut, null, 2));
  console.log("\nSaved raw fixture to data/fixture-match2.json");

  // Fantasy results (for setup-match-onchain.ts)
  writeFileSync(
    "data/fixture-match2-fantasy.json",
    JSON.stringify(
      {
        match_id: "2field",
        home_club_id: MAN_CITY_CLUB_ID,
        away_club_id: LIVERPOOL_CLUB_ID,
        player_prices: playerPrices,
        player_clubs: playerClubs,
        results: sorted,
      },
      null,
      2,
    ),
  );
  console.log("Saved fantasy results to data/fixture-match2-fantasy.json");

  console.log(`\nTotal players: ${results.length}`);
  console.log(`Players who played: ${results.filter((r) => r.minutes_played > 0).length}`);
  console.log(`Highest scorer: ${sorted[0].name} (${sorted[0].fantasy_points}pts)`);
}

main();
