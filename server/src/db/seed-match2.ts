/**
 * seed-match2.ts — Add Man City vs Liverpool (match 2) to Supabase
 *
 * Safe to run alongside existing data — uses upsert on unique keys.
 * Does NOT drop or modify the Arsenal vs Chelsea match.
 *
 * Usage: tsx src/db/seed-match2.ts
 *
 * Run oracle/src/seed-match2.ts first to generate the fixture JSON,
 * then run setup-match-onchain.ts --fixture data/fixture-match2-fantasy.json
 * to register on-chain and get the contest_id hash.
 * Update CONTEST_ON_CHAIN_ID below with that hash before running this script.
 */

import { supabase } from "./supabase.js";

// ── Paste the contest_id hash from setup-match-onchain.ts step 6 output here ──
const CONTEST_ON_CHAIN_ID = "8184218403260942832359254752265460321009866478667199204618940750116699577167field";

async function seed() {
  console.log("Seeding Match 2 (Man City vs Liverpool)...\n");

  // ── Clubs ──
  console.log("Inserting clubs...");
  const { error: clubErr } = await supabase.from("clubs").upsert(
    [
      { on_chain_id: 3, name: "Manchester City", short_name: "MCI", api_football_team_id: 50, crest_url: "https://media.api-sports.io/football/teams/50.png" },
      { on_chain_id: 4, name: "Liverpool",        short_name: "LIV", api_football_team_id: 40, crest_url: "https://media.api-sports.io/football/teams/40.png" },
    ],
    { onConflict: "on_chain_id" },
  );
  if (clubErr) console.error("  clubs error:", clubErr.message);

  const { data: clubs } = await supabase.from("clubs").select("id, on_chain_id");
  const clubMap = new Map(clubs?.map((c) => [c.on_chain_id, c.id]) ?? []);
  const mciId = clubMap.get(3)!;
  const livId = clubMap.get(4)!;

  // ── Players ──
  console.log("Inserting players...");
  const playerRows = [
    // Man City
    { on_chain_id: 301, name: "Ederson",              web_name: "Ederson",       club_id: mciId, position: "GK"  },
    { on_chain_id: 302, name: "Kyle Walker",           web_name: "Walker",        club_id: mciId, position: "DEF" },
    { on_chain_id: 303, name: "Rúben Dias",            web_name: "Dias",          club_id: mciId, position: "DEF" },
    { on_chain_id: 304, name: "Manuel Akanji",         web_name: "Akanji",        club_id: mciId, position: "DEF" },
    { on_chain_id: 305, name: "Joško Gvardiol",        web_name: "Gvardiol",      club_id: mciId, position: "DEF" },
    { on_chain_id: 306, name: "Rodri",                 web_name: "Rodri",         club_id: mciId, position: "MID" },
    { on_chain_id: 307, name: "Kevin De Bruyne",       web_name: "De Bruyne",     club_id: mciId, position: "MID" },
    { on_chain_id: 308, name: "Bernardo Silva",        web_name: "B.Silva",       club_id: mciId, position: "MID" },
    { on_chain_id: 309, name: "Phil Foden",            web_name: "Foden",         club_id: mciId, position: "MID" },
    { on_chain_id: 310, name: "Erling Haaland",        web_name: "Haaland",       club_id: mciId, position: "FWD" },
    { on_chain_id: 311, name: "Jérémy Doku",           web_name: "Doku",          club_id: mciId, position: "FWD" },
    { on_chain_id: 312, name: "John Stones",           web_name: "Stones",        club_id: mciId, position: "DEF" },
    { on_chain_id: 313, name: "Oscar Bobb",            web_name: "Bobb",          club_id: mciId, position: "MID" },
    // Liverpool
    { on_chain_id: 401, name: "Alisson",               web_name: "Alisson",       club_id: livId, position: "GK"  },
    { on_chain_id: 402, name: "Trent Alexander-Arnold",web_name: "T.Alexander-Arnold", club_id: livId, position: "DEF" },
    { on_chain_id: 403, name: "Ibrahima Konaté",       web_name: "Konate",        club_id: livId, position: "DEF" },
    { on_chain_id: 404, name: "Virgil van Dijk",       web_name: "Van Dijk",      club_id: livId, position: "DEF" },
    { on_chain_id: 405, name: "Andy Robertson",        web_name: "Robertson",     club_id: livId, position: "DEF" },
    { on_chain_id: 406, name: "Ryan Gravenberch",      web_name: "Gravenberch",   club_id: livId, position: "MID" },
    { on_chain_id: 407, name: "Alexis Mac Allister",   web_name: "Mac Allister",  club_id: livId, position: "MID" },
    { on_chain_id: 408, name: "Dominik Szoboszlai",    web_name: "Szoboszlai",    club_id: livId, position: "MID" },
    { on_chain_id: 409, name: "Mohamed Salah",         web_name: "Salah",         club_id: livId, position: "FWD" },
    { on_chain_id: 410, name: "Luis Díaz",             web_name: "Diaz",          club_id: livId, position: "FWD" },
    { on_chain_id: 411, name: "Cody Gakpo",            web_name: "Gakpo",         club_id: livId, position: "FWD" },
    { on_chain_id: 412, name: "Curtis Jones",          web_name: "Jones",         club_id: livId, position: "MID" },
  ];

  const { error: playerErr } = await supabase.from("players").upsert(playerRows, { onConflict: "on_chain_id" });
  if (playerErr) console.error("  players error:", playerErr.message);

  // ── Match ──
  console.log("Inserting match...");
  const { data: matchData, error: matchErr } = await supabase.from("matches").upsert(
    [{
      api_football_fixture_id: 1098765,
      on_chain_match_id: "2field",
      home_club_id: mciId,
      away_club_id: livId,
      kickoff: "2025-05-10T16:30:00+00:00",
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
    301: 5_000_000,
    302: 5_000_000,
    303: 5_500_000,
    304: 5_000_000,
    305: 5_500_000,
    306: 6_500_000,
    307: 10_000_000,
    308: 7_000_000,
    309: 8_000_000,
    310: 14_000_000,
    311: 6_500_000,
    312: 5_000_000,
    313: 4_500_000,
    401: 5_500_000,
    402: 8_000_000,
    403: 5_000_000,
    404: 6_000_000,
    405: 6_000_000,
    406: 5_500_000,
    407: 5_500_000,
    408: 5_500_000,
    409: 13_000_000,
    410: 7_000_000,
    411: 6_500_000,
    412: 4_500_000,
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
    // Man City
    { on_chain_id: 301, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 4,  penalty_saves: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 5,  bps_score: 22, bonus: 0 },
    { on_chain_id: 307, minutes_played: 90, goals: 0, assists: 2, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 14, bps_score: 52, bonus: 3 },
    { on_chain_id: 309, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 9,  bps_score: 35, bonus: 0 },
    { on_chain_id: 310, minutes_played: 90, goals: 2, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 14, bps_score: 54, bonus: 2 },
    { on_chain_id: 305, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 2, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 5,  bps_score: 26, bonus: 0 },
    // Liverpool
    { on_chain_id: 401, minutes_played: 90, goals: 0, assists: 0, clean_sheet: false, saves: 6,  penalty_saves: 0, goals_conceded: 3, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 4,  bps_score: 24, bonus: 0 },
    { on_chain_id: 404, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 3, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 8,  bps_score: 30, bonus: 1 },
    { on_chain_id: 402, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 3, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 5,  bps_score: 28, bonus: 0 },
    { on_chain_id: 409, minutes_played: 90, goals: 1, assists: 0, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 9,  bps_score: 36, bonus: 0 },
    { on_chain_id: 410, minutes_played: 90, goals: 0, assists: 1, clean_sheet: false, saves: 0,  penalty_saves: 0, goals_conceded: 0, yellow_cards: 0, red_card: false, own_goals: 0, fantasy_points: 5,  bps_score: 20, bonus: 0 },
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
      deadline: "2025-05-10T16:30:00+00:00",
      status: "open",
      total_entries: 0,
      total_pool_credits: 0,
    }],
    { onConflict: "on_chain_id" },
  );
  if (contestErr) console.error("  contest error:", contestErr.message);
  else console.log("  Contest inserted with on_chain_id:", CONTEST_ON_CHAIN_ID);

  console.log("\nMatch 2 seed complete!");
}

seed().catch(console.error);
