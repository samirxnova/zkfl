/**
 * seed.ts — Populate Supabase with Arsenal vs Chelsea demo data
 *
 * Usage: tsx src/db/seed.ts
 */

import { supabase } from "./supabase.js";

async function seed() {
  console.log("Seeding database...\n");

  // ── Clubs ──
  console.log("Inserting clubs...");
  const { error: clubErr } = await supabase.from("clubs").upsert([
    { on_chain_id: 1, name: "Arsenal", short_name: "ARS", api_football_team_id: 42, crest_url: "https://media.api-sports.io/football/teams/42.png" },
    { on_chain_id: 2, name: "Chelsea", short_name: "CHE", api_football_team_id: 49, crest_url: "https://media.api-sports.io/football/teams/49.png" },
  ], { onConflict: "on_chain_id" });
  if (clubErr) console.error("  clubs error:", clubErr.message);

  // Get club DB IDs
  const { data: clubs } = await supabase.from("clubs").select("id, on_chain_id");
  const clubMap = new Map(clubs?.map((c) => [c.on_chain_id, c.id]) ?? []);
  const arsId = clubMap.get(1)!;
  const cheId = clubMap.get(2)!;

  // ── Players ──
  console.log("Inserting players...");
  const playerRows = [
    // Arsenal
    { on_chain_id: 101, name: "David Raya", web_name: "Raya", club_id: arsId, position: "GK" },
    { on_chain_id: 102, name: "Ben White", web_name: "White", club_id: arsId, position: "DEF" },
    { on_chain_id: 103, name: "William Saliba", web_name: "Saliba", club_id: arsId, position: "DEF" },
    { on_chain_id: 104, name: "Gabriel Magalhães", web_name: "Gabriel", club_id: arsId, position: "DEF" },
    { on_chain_id: 105, name: "Jurriën Timber", web_name: "Timber", club_id: arsId, position: "DEF" },
    { on_chain_id: 106, name: "Declan Rice", web_name: "Rice", club_id: arsId, position: "MID" },
    { on_chain_id: 107, name: "Martin Ødegaard", web_name: "Ødegaard", club_id: arsId, position: "MID" },
    { on_chain_id: 108, name: "Kai Havertz", web_name: "Havertz", club_id: arsId, position: "MID" },
    { on_chain_id: 109, name: "Bukayo Saka", web_name: "Saka", club_id: arsId, position: "FWD" },
    { on_chain_id: 110, name: "Gabriel Martinelli", web_name: "Martinelli", club_id: arsId, position: "FWD" },
    { on_chain_id: 111, name: "Leandro Trossard", web_name: "Trossard", club_id: arsId, position: "FWD" },
    { on_chain_id: 112, name: "Eddie Nketiah", web_name: "Nketiah", club_id: arsId, position: "FWD" },
    { on_chain_id: 113, name: "Oleksandr Zinchenko", web_name: "Zinchenko", club_id: arsId, position: "DEF" },
    // Chelsea
    { on_chain_id: 201, name: "Robert Sánchez", web_name: "Sánchez", club_id: cheId, position: "GK" },
    { on_chain_id: 202, name: "Reece James", web_name: "James", club_id: cheId, position: "DEF" },
    { on_chain_id: 203, name: "Thiago Silva", web_name: "T.Silva", club_id: cheId, position: "DEF" },
    { on_chain_id: 204, name: "Levi Colwill", web_name: "Colwill", club_id: cheId, position: "DEF" },
    { on_chain_id: 205, name: "Marc Cucurella", web_name: "Cucurella", club_id: cheId, position: "DEF" },
    { on_chain_id: 206, name: "Moisés Caicedo", web_name: "Caicedo", club_id: cheId, position: "MID" },
    { on_chain_id: 207, name: "Enzo Fernández", web_name: "Enzo", club_id: cheId, position: "MID" },
    { on_chain_id: 208, name: "Cole Palmer", web_name: "Palmer", club_id: cheId, position: "MID" },
    { on_chain_id: 209, name: "Nicolas Jackson", web_name: "Jackson", club_id: cheId, position: "FWD" },
    { on_chain_id: 210, name: "Raheem Sterling", web_name: "Sterling", club_id: cheId, position: "FWD" },
    { on_chain_id: 211, name: "Mykhailo Mudryk", web_name: "Mudryk", club_id: cheId, position: "FWD" },
    { on_chain_id: 212, name: "Conor Gallagher", web_name: "Gallagher", club_id: cheId, position: "MID" },
  ];

  const { error: playerErr } = await supabase.from("players").upsert(playerRows, { onConflict: "on_chain_id" });
  if (playerErr) console.error("  players error:", playerErr.message);

  // ── Match ──
  console.log("Inserting match...");
  const { data: matchData, error: matchErr } = await supabase.from("matches").upsert([{
    api_football_fixture_id: 1035057,
    on_chain_match_id: "1field",
    home_club_id: arsId,
    away_club_id: cheId,
    kickoff: "2025-04-15T16:30:00+00:00",
    status: "SCHEDULED",
    home_score: null,
    away_score: null,
    is_resolved: false,
  }], { onConflict: "api_football_fixture_id" }).select();
  if (matchErr) console.error("  match error:", matchErr.message);

  const matchId = matchData?.[0]?.id;
  if (!matchId) {
    console.error("Failed to get match ID");
    return;
  }

  // ── Player Prices ──
  console.log("Inserting player prices...");
  const { data: dbPlayers } = await supabase.from("players").select("id, on_chain_id");
  const playerMap = new Map(dbPlayers?.map((p) => [p.on_chain_id, p.id]) ?? []);

  const prices: Record<number, number> = {
    101: 5_500_000, 102: 5_000_000, 103: 5_500_000, 104: 5_000_000, 105: 4_500_000,
    106: 6_000_000, 107: 8_000_000, 108: 7_500_000, 109: 8_500_000, 110: 7_000_000,
    111: 6_500_000, 112: 5_000_000, 113: 4_500_000,
    201: 4_500_000, 202: 5_000_000, 203: 5_000_000, 204: 4_500_000, 205: 5_000_000,
    206: 5_500_000, 207: 6_000_000, 208: 9_000_000, 209: 7_000_000, 210: 6_000_000,
    211: 5_500_000, 212: 5_000_000,
  };

  const priceRows = Object.entries(prices)
    .filter(([onChainId]) => playerMap.has(Number(onChainId)))
    .map(([onChainId, price]) => ({
      match_id: matchId,
      player_id: playerMap.get(Number(onChainId))!,
      price_credits: price,
    }));

  const { error: priceErr } = await supabase.from("match_player_prices").upsert(priceRows, {
    onConflict: "match_id,player_id",
  });
  if (priceErr) console.error("  prices error:", priceErr.message);

  // ── Player Stats ──
  console.log("Inserting player stats...");
  const statsData = [
    { on_chain_id: 101, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 5, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 3, bps_score: 20, bonus: 0 },
    { on_chain_id: 104, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 8, bps_score: 28, bonus: 0 },
    { on_chain_id: 107, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 8, bps_score: 35, bonus: 3 },
    { on_chain_id: 108, minutes_played: 78, goals: 1, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 7, bps_score: 20, bonus: 0 },
    { on_chain_id: 109, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 6, bps_score: 26, bonus: 1 },
    { on_chain_id: 208, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0, penalty_saves: 0, penalty_misses: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 9, bps_score: 33, bonus: 2 },
  ];

  const statsRows = statsData
    .filter((s) => playerMap.has(s.on_chain_id))
    .map((s) => ({
      player_id: playerMap.get(s.on_chain_id)!,
      match_id: matchId,
      ...s,
      on_chain_id: undefined,
    }));

  // Insert only key players for demo (the rest get default 0s)
  for (const row of statsRows) {
    const { on_chain_id, ...insertRow } = row as any;
    const { error } = await supabase.from("player_match_stats").upsert(insertRow, {
      onConflict: "player_id,match_id",
    });
    if (error) console.error(`  stats error for player:`, error.message);
  }

  // ── Demo Contest ──
  console.log("Inserting demo contest...");
  const { error: contestErr } = await supabase.from("contests").upsert([{
    on_chain_id: "5622599938287340955314218888251884005964792045382263630126017545486724441981field",
    match_id: matchId,
    is_admin_created: true,
    contest_type: "classic",
    entry_fee_credits: 1_000_000,
    max_entries: 100,
    prize_split: { "1": 60, "2": 25, "3": 15 },
    deadline: "2025-04-15T16:30:00+00:00",
    status: "open",
    total_entries: 0,
    total_pool_credits: 0,
  }], { onConflict: "on_chain_id" });
  if (contestErr) console.error("  contest error:", contestErr.message);

  console.log("\nSeed complete!");
}

seed().catch(console.error);
