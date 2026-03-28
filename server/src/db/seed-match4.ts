/**
 * seed-match4.ts — Add Bayern Munich vs Dortmund (match 4) to Supabase
 *
 * Safe to run alongside existing data — uses upsert on unique keys.
 *
 * Usage: tsx src/db/seed-match4.ts
 *
 * Run oracle/src/seed-match4.ts first to generate the fixture JSON,
 * then run setup-match4-onchain.ts to register on-chain and get the contest_id hash.
 * Update CONTEST_ON_CHAIN_ID below with that hash before running this script.
 */

import { supabase } from "./supabase.js";

// ── Paste the contest_id hash from setup-match4-onchain.ts step 6 output here ──
const CONTEST_ON_CHAIN_ID = "PASTE_CONTEST_ID_HASH_HERE";

async function seed() {
  if (CONTEST_ON_CHAIN_ID === "PASTE_CONTEST_ID_HASH_HERE") {
    console.error("❌ Update CONTEST_ON_CHAIN_ID with the hash from setup-match4-onchain.ts step 6");
    process.exit(1);
  }

  console.log("Seeding Match 4 (Bayern Munich vs Dortmund)...\n");

  // ── Clubs ──
  console.log("Inserting clubs...");
  const { error: clubErr } = await supabase.from("clubs").upsert(
    [
      { on_chain_id: 7, name: "Bayern Munich",      short_name: "BAY", api_football_team_id: 157, crest_url: "https://media.api-sports.io/football/teams/157.png" },
      { on_chain_id: 8, name: "Borussia Dortmund",  short_name: "DOR", api_football_team_id: 165, crest_url: "https://media.api-sports.io/football/teams/165.png" },
    ],
    { onConflict: "on_chain_id" },
  );
  if (clubErr) console.error("  clubs error:", clubErr.message);

  const { data: clubs } = await supabase.from("clubs").select("id, on_chain_id");
  const clubMap = new Map(clubs?.map((c) => [c.on_chain_id, c.id]) ?? []);
  const bayId = clubMap.get(7)!;
  const dorId = clubMap.get(8)!;

  // ── Players ──
  console.log("Inserting players...");
  const playerRows = [
    // Bayern Munich
    { on_chain_id: 701, name: "Manuel Neuer",         web_name: "Neuer",         club_id: bayId, position: "GK"  },
    { on_chain_id: 702, name: "Joshua Kimmich",        web_name: "Kimmich",       club_id: bayId, position: "DEF" },
    { on_chain_id: 703, name: "Dayot Upamecano",       web_name: "Upamecano",     club_id: bayId, position: "DEF" },
    { on_chain_id: 704, name: "Min-jae Kim",           web_name: "Kim",           club_id: bayId, position: "DEF" },
    { on_chain_id: 705, name: "Alphonso Davies",       web_name: "Davies",        club_id: bayId, position: "DEF" },
    { on_chain_id: 706, name: "Leon Goretzka",         web_name: "Goretzka",      club_id: bayId, position: "MID" },
    { on_chain_id: 707, name: "Jamal Musiala",         web_name: "Musiala",       club_id: bayId, position: "MID" },
    { on_chain_id: 708, name: "Leroy Sane",            web_name: "Sane",          club_id: bayId, position: "MID" },
    { on_chain_id: 709, name: "Thomas Muller",         web_name: "Muller",        club_id: bayId, position: "MID" },
    { on_chain_id: 710, name: "Harry Kane",            web_name: "Kane",          club_id: bayId, position: "FWD" },
    { on_chain_id: 711, name: "Serge Gnabry",          web_name: "Gnabry",        club_id: bayId, position: "FWD" },
    { on_chain_id: 712, name: "Kingsley Coman",        web_name: "Coman",         club_id: bayId, position: "FWD" },
    { on_chain_id: 713, name: "Mathys Tel",            web_name: "Tel",           club_id: bayId, position: "FWD" },
    // Borussia Dortmund
    { on_chain_id: 801, name: "Gregor Kobel",          web_name: "Kobel",         club_id: dorId, position: "GK"  },
    { on_chain_id: 802, name: "Julian Ryerson",        web_name: "Ryerson",       club_id: dorId, position: "DEF" },
    { on_chain_id: 803, name: "Mats Hummels",          web_name: "Hummels",       club_id: dorId, position: "DEF" },
    { on_chain_id: 804, name: "Nico Schlotterbeck",    web_name: "Schlotterbeck", club_id: dorId, position: "DEF" },
    { on_chain_id: 805, name: "Ian Maatsen",           web_name: "Maatsen",       club_id: dorId, position: "DEF" },
    { on_chain_id: 806, name: "Julian Brandt",         web_name: "Brandt",        club_id: dorId, position: "MID" },
    { on_chain_id: 807, name: "Emre Can",              web_name: "Can",           club_id: dorId, position: "MID" },
    { on_chain_id: 808, name: "Felix Nmecha",          web_name: "Nmecha",        club_id: dorId, position: "MID" },
    { on_chain_id: 809, name: "Jadon Sancho",          web_name: "Sancho",        club_id: dorId, position: "FWD" },
    { on_chain_id: 810, name: "Niclas Fullkrug",       web_name: "Fullkrug",      club_id: dorId, position: "FWD" },
    { on_chain_id: 811, name: "Donyell Malen",         web_name: "Malen",         club_id: dorId, position: "FWD" },
    { on_chain_id: 812, name: "Marco Reus",            web_name: "Reus",          club_id: dorId, position: "MID" },
  ];

  const { error: playerErr } = await supabase.from("players").upsert(playerRows, { onConflict: "on_chain_id" });
  if (playerErr) console.error("  players error:", playerErr.message);

  // ── Match ──
  console.log("Inserting match...");
  const { data: matchData, error: matchErr } = await supabase.from("matches").upsert(
    [{
      api_football_fixture_id: 1098767,
      on_chain_match_id: "4field",
      home_club_id: bayId,
      away_club_id: dorId,
      kickoff: "2025-05-24T17:30:00+00:00",
      status: "SCHEDULED",
      home_score: null,
      away_score: null,
      is_resolved: false,
    }],
    { onConflict: "api_football_fixture_id" },
  ).select();
  if (matchErr) console.error("  match error:", matchErr.message);

  const matchId = matchData?.[0]?.id;
  if (!matchId) {
    console.error("Failed to get match ID — aborting");
    return;
  }

  // ── Player Prices ──
  console.log("Inserting player prices...");
  const { data: dbPlayers } = await supabase.from("players").select("id, on_chain_id");
  const playerMap = new Map(dbPlayers?.map((p) => [p.on_chain_id, p.id]) ?? []);

  const prices: Record<number, number> = {
    701: 5_500_000,
    702: 8_000_000,
    703: 6_000_000,
    704: 5_500_000,
    705: 6_500_000,
    706: 6_500_000,
    707: 11_000_000,
    708: 8_000_000,
    709: 7_000_000,
    710: 14_000_000,
    711: 7_500_000,
    712: 6_000_000,
    713: 4_500_000,
    801: 5_000_000,
    802: 4_500_000,
    803: 6_000_000,
    804: 5_500_000,
    805: 5_000_000,
    806: 6_500_000,
    807: 6_000_000,
    808: 5_000_000,
    809: 7_500_000,
    810: 8_000_000,
    811: 7_000_000,
    812: 5_000_000,
  };

  const priceRows = Object.entries(prices)
    .filter(([id]) => playerMap.has(Number(id)))
    .map(([id, price]) => ({
      match_id: matchId,
      player_id: playerMap.get(Number(id))!,
      price_credits: price,
    }));

  const { error: priceErr } = await supabase.from("match_player_prices").upsert(priceRows, {
    onConflict: "match_id,player_id",
  });
  if (priceErr) console.error("  prices error:", priceErr.message);

  // ── Player Stats (key performers) ──
  console.log("Inserting player stats...");
  const statsData = [
    // Bayern Munich
    { on_chain_id: 701, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 4,  penalty_saves: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 6,  bps_score: 22, bonus: 0 },
    { on_chain_id: 707, minutes_played: 90, goals: 1, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 14, bps_score: 55, bonus: 3 },
    { on_chain_id: 710, minutes_played: 90, goals: 2, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 13, bps_score: 52, bonus: 2 },
    { on_chain_id: 702, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 6,  bps_score: 30, bonus: 0 },
    { on_chain_id: 705, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 6,  bps_score: 28, bonus: 0 },
    // Dortmund
    { on_chain_id: 801, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 5,  penalty_saves: 0, goals_conceded: 3, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 20, bonus: 0 },
    { on_chain_id: 810, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 8,  bps_score: 30, bonus: 1 },
    { on_chain_id: 805, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 3, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 20, bonus: 0 },
    { on_chain_id: 809, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 24, bonus: 0 },
    { on_chain_id: 806, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 26, bonus: 0 },
  ];

  for (const s of statsData) {
    const playerId = playerMap.get(s.on_chain_id);
    if (!playerId) continue;
    const { on_chain_id, ...rest } = s;
    const { error } = await supabase.from("player_match_stats").upsert(
      { player_id: playerId, match_id: matchId, ...rest },
      { onConflict: "player_id,match_id" },
    );
    if (error) console.error(`  stats error for player ${s.on_chain_id}:`, error.message);
  }

  // ── Contest ──
  console.log("Inserting contest...");
  const { error: contestErr } = await supabase.from("contests").upsert(
    [{
      on_chain_id: CONTEST_ON_CHAIN_ID,
      match_id: matchId,
      is_admin_created: true,
      contest_type: "classic",
      entry_fee_credits: 1_000_000,
      max_entries: 100,
      prize_split: { "1": 60, "2": 25, "3": 15 },
      deadline: "2025-05-24T17:30:00+00:00",
      status: "open",
      total_entries: 0,
      total_pool_credits: 0,
    }],
    { onConflict: "on_chain_id" },
  );
  if (contestErr) console.error("  contest error:", contestErr.message);
  else console.log("  Contest inserted with on_chain_id:", CONTEST_ON_CHAIN_ID);

  console.log("\nMatch 4 seed complete!");
}

seed().catch(console.error);
