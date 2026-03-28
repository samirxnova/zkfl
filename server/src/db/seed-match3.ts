/**
 * seed-match3.ts — Add Real Madrid vs Barcelona (match 3) to Supabase
 *
 * Safe to run alongside existing data — uses upsert on unique keys.
 *
 * Usage: tsx src/db/seed-match3.ts
 *
 * Run oracle/src/seed-match3.ts first to generate the fixture JSON,
 * then run setup-match3-onchain.ts to register on-chain and get the contest_id hash.
 * Update CONTEST_ON_CHAIN_ID below with that hash before running this script.
 */

import { supabase } from "./supabase.js";

// ── Paste the contest_id hash from setup-match3-onchain.ts step 6 output here ──
const CONTEST_ON_CHAIN_ID = "PASTE_CONTEST_ID_HASH_HERE";

async function seed() {
  if (CONTEST_ON_CHAIN_ID === "PASTE_CONTEST_ID_HASH_HERE") {
    console.error("❌ Update CONTEST_ON_CHAIN_ID with the hash from setup-match3-onchain.ts step 6");
    process.exit(1);
  }

  console.log("Seeding Match 3 (Real Madrid vs Barcelona)...\n");

  // ── Clubs ──
  console.log("Inserting clubs...");
  const { error: clubErr } = await supabase.from("clubs").upsert(
    [
      { on_chain_id: 5, name: "Real Madrid",   short_name: "RMA", api_football_team_id: 541, crest_url: "https://media.api-sports.io/football/teams/541.png" },
      { on_chain_id: 6, name: "Barcelona",     short_name: "BAR", api_football_team_id: 529, crest_url: "https://media.api-sports.io/football/teams/529.png" },
    ],
    { onConflict: "on_chain_id" },
  );
  if (clubErr) console.error("  clubs error:", clubErr.message);

  const { data: clubs } = await supabase.from("clubs").select("id, on_chain_id");
  const clubMap = new Map(clubs?.map((c) => [c.on_chain_id, c.id]) ?? []);
  const rmaId = clubMap.get(5)!;
  const barId = clubMap.get(6)!;

  // ── Players ──
  console.log("Inserting players...");
  const playerRows = [
    // Real Madrid
    { on_chain_id: 501, name: "Thibaut Courtois",    web_name: "Courtois",   club_id: rmaId, position: "GK"  },
    { on_chain_id: 502, name: "Dani Carvajal",        web_name: "Carvajal",   club_id: rmaId, position: "DEF" },
    { on_chain_id: 503, name: "Eder Militao",         web_name: "Militao",    club_id: rmaId, position: "DEF" },
    { on_chain_id: 504, name: "David Alaba",          web_name: "Alaba",      club_id: rmaId, position: "DEF" },
    { on_chain_id: 505, name: "Ferland Mendy",        web_name: "Mendy",      club_id: rmaId, position: "DEF" },
    { on_chain_id: 506, name: "Toni Kroos",           web_name: "Kroos",      club_id: rmaId, position: "MID" },
    { on_chain_id: 507, name: "Luka Modric",          web_name: "Modric",     club_id: rmaId, position: "MID" },
    { on_chain_id: 508, name: "Federico Valverde",    web_name: "Valverde",   club_id: rmaId, position: "MID" },
    { on_chain_id: 509, name: "Jude Bellingham",      web_name: "Bellingham", club_id: rmaId, position: "MID" },
    { on_chain_id: 510, name: "Vinicius Junior",      web_name: "Vinicius",   club_id: rmaId, position: "FWD" },
    { on_chain_id: 511, name: "Rodrygo Goes",         web_name: "Rodrygo",    club_id: rmaId, position: "FWD" },
    { on_chain_id: 512, name: "Eduardo Camavinga",    web_name: "Camavinga",  club_id: rmaId, position: "MID" },
    { on_chain_id: 513, name: "Aurelien Tchouameni",  web_name: "Tchouameni", club_id: rmaId, position: "MID" },
    // Barcelona
    { on_chain_id: 601, name: "Marc-Andre ter Stegen",web_name: "Ter Stegen", club_id: barId, position: "GK"  },
    { on_chain_id: 602, name: "Ronald Araujo",         web_name: "Araujo",     club_id: barId, position: "DEF" },
    { on_chain_id: 603, name: "Jules Kounde",          web_name: "Kounde",     club_id: barId, position: "DEF" },
    { on_chain_id: 604, name: "Inigo Martinez",        web_name: "I.Martinez", club_id: barId, position: "DEF" },
    { on_chain_id: 605, name: "Alejandro Balde",       web_name: "Balde",      club_id: barId, position: "DEF" },
    { on_chain_id: 606, name: "Pedri",                 web_name: "Pedri",      club_id: barId, position: "MID" },
    { on_chain_id: 607, name: "Gavi",                  web_name: "Gavi",       club_id: barId, position: "MID" },
    { on_chain_id: 608, name: "Frenkie de Jong",       web_name: "De Jong",    club_id: barId, position: "MID" },
    { on_chain_id: 609, name: "Lamine Yamal",          web_name: "Yamal",      club_id: barId, position: "FWD" },
    { on_chain_id: 610, name: "Robert Lewandowski",    web_name: "Lewandowski",club_id: barId, position: "FWD" },
    { on_chain_id: 611, name: "Raphinha",              web_name: "Raphinha",   club_id: barId, position: "FWD" },
    { on_chain_id: 612, name: "Ferran Torres",         web_name: "F.Torres",   club_id: barId, position: "FWD" },
  ];

  const { error: playerErr } = await supabase.from("players").upsert(playerRows, { onConflict: "on_chain_id" });
  if (playerErr) console.error("  players error:", playerErr.message);

  // ── Match ──
  console.log("Inserting match...");
  const { data: matchData, error: matchErr } = await supabase.from("matches").upsert(
    [{
      api_football_fixture_id: 1098766,
      on_chain_match_id: "3field",
      home_club_id: rmaId,
      away_club_id: barId,
      kickoff: "2025-05-17T19:45:00+00:00",
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
    501: 5_500_000,
    502: 6_000_000,
    503: 6_000_000,
    504: 5_500_000,
    505: 5_500_000,
    506: 9_000_000,
    507: 8_000_000,
    508: 8_500_000,
    509: 11_000_000,
    510: 13_000_000,
    511: 8_000_000,
    512: 5_000_000,
    513: 5_500_000,
    601: 5_500_000,
    602: 6_500_000,
    603: 6_000_000,
    604: 5_000_000,
    605: 5_500_000,
    606: 9_000_000,
    607: 7_500_000,
    608: 7_500_000,
    609: 10_000_000,
    610: 12_000_000,
    611: 8_500_000,
    612: 4_500_000,
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
    // Real Madrid
    { on_chain_id: 501, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 5,  penalty_saves: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 6,  bps_score: 24, bonus: 0 },
    { on_chain_id: 508, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 9,  bps_score: 38, bonus: 0 },
    { on_chain_id: 509, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 9,  bps_score: 40, bonus: 0 },
    { on_chain_id: 510, minutes_played: 90, goals: 1, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 15, bps_score: 58, bonus: 3 },
    { on_chain_id: 504, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 1, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 6,  bps_score: 28, bonus: 0 },
    // Barcelona
    { on_chain_id: 601, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 4,  penalty_saves: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 20, bonus: 0 },
    { on_chain_id: 606, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 5,  bps_score: 32, bonus: 0 },
    { on_chain_id: 610, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 9,  bps_score: 36, bonus: 1 },
    { on_chain_id: 605, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 5,  bps_score: 22, bonus: 0 },
    { on_chain_id: 609, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 26, bonus: 0 },
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
      deadline: "2025-05-17T19:45:00+00:00",
      status: "open",
      total_entries: 0,
      total_pool_credits: 0,
    }],
    { onConflict: "on_chain_id" },
  );
  if (contestErr) console.error("  contest error:", contestErr.message);
  else console.log("  Contest inserted with on_chain_id:", CONTEST_ON_CHAIN_ID);

  console.log("\nMatch 3 seed complete!");
}

seed().catch(console.error);
