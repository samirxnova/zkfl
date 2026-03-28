/**
 * seed-match4.ts — Generate demo data for Bayern Munich vs Dortmund (match 4)
 *
 * Bayern Munich 3-1 Dortmund — Der Klassiker
 * Kane brace, Musiala adds third, Fullkrug consolation.
 *
 * Usage: tsx src/seed-match4.ts
 * Output: data/fixture-match4.json  +  data/fixture-match4-fantasy.json
 */

import { writeFileSync, mkdirSync } from "fs";
import { computeMatchFantasy, type PlayerMatchStats } from "./compute-fantasy.js";

const FIXTURE_ID = 1098767;

const fixture = {
  fixture_id: FIXTURE_ID,
  home_team: { id: 157, name: "Bayern Munich" },
  away_team: { id: 165, name: "Borussia Dortmund" },
  home_score: 3,
  away_score: 1,
  status: "FT",
  date: "2025-05-24T17:30:00+00:00",
};

// On-chain IDs
const BAYERN_CLUB_ID = 7;
const DORTMUND_CLUB_ID = 8;

// ── Player Stats ──
// Bayern IDs: 701-713
// Dortmund IDs: 801-812

const players: PlayerMatchStats[] = [

  // ════ Bayern Munich (home, won 3-1) ════

  // GK
  {
    player_id: 701, name: "Neuer", position: "GK",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 4, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 0, tackles: 0, recoveries: 2,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // DEF
  {
    player_id: 702, name: "Kimmich", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 1, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 5, big_chances_created: 2, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 703, name: "Upamecano", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 6, blocks: 2, interceptions: 3, tackles: 2, recoveries: 4,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 704, name: "Kim", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 5, blocks: 3, interceptions: 3, tackles: 2, recoveries: 4,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 2, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 705, name: "Davies", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 3, blocks: 0, interceptions: 1, tackles: 3, recoveries: 3,
    key_passes: 3, big_chances_created: 1, shots_on_target: 0,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // MID
  {
    player_id: 706, name: "Goretzka", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 1, blocks: 2, interceptions: 4, tackles: 5, recoveries: 6,
    key_passes: 2, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 1, fouls_committed: 2, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 707, name: "Musiala", position: "MID",
    minutes_played: 90, goals: 1, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 6, big_chances_created: 3, shots_on_target: 4,
    dribbles_completed: 7, fouls_committed: 0, fouls_drawn: 4,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 708, name: "Sane", position: "MID",
    minutes_played: 80, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 2,
    key_passes: 3, big_chances_created: 1, shots_on_target: 2,
    dribbles_completed: 4, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 709, name: "Muller", position: "MID",
    minutes_played: 70, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 2,
    key_passes: 4, big_chances_created: 2, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // FWD
  {
    player_id: 710, name: "Kane", position: "FWD",
    minutes_played: 90, goals: 2, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 2, big_chances_created: 0, shots_on_target: 6,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 711, name: "Gnabry", position: "FWD",
    minutes_played: 72, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 2, big_chances_created: 1, shots_on_target: 2,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // Subs
  {
    player_id: 712, name: "Coman", position: "FWD",
    minutes_played: 18, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 1, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 713, name: "Tel", position: "FWD",
    minutes_played: 20, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 0,
    key_passes: 0, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 1, fouls_committed: 0, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },

  // ════ Borussia Dortmund (away, lost 1-3) ════

  // GK
  {
    player_id: 801, name: "Kobel", position: "GK",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 5, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 0, tackles: 0, recoveries: 2,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // DEF
  {
    player_id: 802, name: "Ryerson", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 3, blocks: 1, interceptions: 2, tackles: 2, recoveries: 3,
    key_passes: 1, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 803, name: "Hummels", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 7, blocks: 2, interceptions: 3, tackles: 1, recoveries: 4,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 2, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 804, name: "Schlotterbeck", position: "DEF",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 5, blocks: 2, interceptions: 2, tackles: 2, recoveries: 3,
    key_passes: 0, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 0, fouls_committed: 1, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 805, name: "Maatsen", position: "DEF",
    minutes_played: 90, goals: 0, assists: 1, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 3,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 2, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 2, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 2, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  // MID
  {
    player_id: 806, name: "Brandt", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 1, interceptions: 2, tackles: 3, recoveries: 4,
    key_passes: 3, big_chances_created: 1, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 807, name: "Can", position: "MID",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 1, red_card: false, own_goals: 0,
    clearances: 1, blocks: 2, interceptions: 4, tackles: 5, recoveries: 5,
    key_passes: 2, big_chances_created: 0, shots_on_target: 0,
    dribbles_completed: 1, fouls_committed: 3, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
  {
    player_id: 808, name: "Nmecha", position: "MID",
    minutes_played: 75, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 2, recoveries: 2,
    key_passes: 2, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 2, fouls_committed: 1, fouls_drawn: 1,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // FWD
  {
    player_id: 809, name: "Sancho", position: "FWD",
    minutes_played: 90, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 3, big_chances_created: 1, shots_on_target: 2,
    dribbles_completed: 5, fouls_committed: 0, fouls_drawn: 3,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 2,
  },
  {
    player_id: 810, name: "Fullkrug", position: "FWD",
    minutes_played: 90, goals: 1, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 1, recoveries: 1,
    key_passes: 1, big_chances_created: 0, shots_on_target: 3,
    dribbles_completed: 1, fouls_committed: 2, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  {
    player_id: 811, name: "Malen", position: "FWD",
    minutes_played: 70, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 0, tackles: 0, recoveries: 1,
    key_passes: 2, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 3, fouls_committed: 0, fouls_drawn: 2,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 1,
  },
  // Sub
  {
    player_id: 812, name: "Reus", position: "MID",
    minutes_played: 20, goals: 0, assists: 0, clean_sheet: false,
    saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0,
    yellow_cards: 0, red_card: false, own_goals: 0,
    clearances: 0, blocks: 0, interceptions: 1, tackles: 1, recoveries: 1,
    key_passes: 1, big_chances_created: 0, shots_on_target: 1,
    dribbles_completed: 1, fouls_committed: 0, fouls_drawn: 0,
    penalties_committed: 0, was_fouled_for_penalty: false, big_chances_missed: 0,
  },
];

// ── Player Prices (microcredits) ──

export const playerPrices: Record<number, number> = {
  // Bayern Munich
  701: 5_500_000,  // Neuer
  702: 8_000_000,  // Kimmich
  703: 6_000_000,  // Upamecano
  704: 5_500_000,  // Kim
  705: 6_500_000,  // Davies
  706: 6_500_000,  // Goretzka
  707: 11_000_000, // Musiala
  708: 8_000_000,  // Sane
  709: 7_000_000,  // Muller
  710: 14_000_000, // Kane
  711: 7_500_000,  // Gnabry
  712: 6_000_000,  // Coman
  713: 4_500_000,  // Tel
  // Dortmund
  801: 5_000_000,  // Kobel
  802: 4_500_000,  // Ryerson
  803: 6_000_000,  // Hummels
  804: 5_500_000,  // Schlotterbeck
  805: 5_000_000,  // Maatsen
  806: 6_500_000,  // Brandt
  807: 6_000_000,  // Can
  808: 5_000_000,  // Nmecha
  809: 7_500_000,  // Sancho
  810: 8_000_000,  // Fullkrug
  811: 7_000_000,  // Malen
  812: 5_000_000,  // Reus
};

// ── Player Club Mapping ──

export const playerClubs: Record<number, number> = {};
for (const p of players) {
  playerClubs[p.player_id] = p.player_id < 800 ? BAYERN_CLUB_ID : DORTMUND_CLUB_ID;
}

// ── Main ──

function main() {
  const results = computeMatchFantasy(players);
  const sorted = [...results].sort((a, b) => b.fantasy_points - a.fantasy_points);

  console.log("═══════════════════════════════════════════════");
  console.log("Bayern Munich 3-1 Dortmund — Fantasy Points");
  console.log("═══════════════════════════════════════════════\n");

  for (const r of sorted) {
    const bonus = r.bonus > 0 ? ` (+${r.bonus} bonus)` : "";
    console.log(
      `  ${String(r.fantasy_points).padStart(3)} pts  ${r.name.padEnd(18)} ${r.position.padEnd(3)}  ${r.minutes_played}min${bonus}`,
    );
  }

  mkdirSync("data", { recursive: true });

  const rawOut = { fixture, players };
  writeFileSync("data/fixture-match4.json", JSON.stringify(rawOut, null, 2));
  console.log("\nSaved raw fixture to data/fixture-match4.json");

  writeFileSync(
    "data/fixture-match4-fantasy.json",
    JSON.stringify(
      {
        match_id: "4field",
        home_club_id: BAYERN_CLUB_ID,
        away_club_id: DORTMUND_CLUB_ID,
        player_prices: playerPrices,
        player_clubs: playerClubs,
        results: sorted,
      },
      null,
      2,
    ),
  );
  console.log("Saved fantasy results to data/fixture-match4-fantasy.json");

  console.log(`\nTotal players: ${results.length}`);
  console.log(`Players who played: ${results.filter((r) => r.minutes_played > 0).length}`);
  console.log(`Highest scorer: ${sorted[0].name} (${sorted[0].fantasy_points}pts)`);
}

main();
