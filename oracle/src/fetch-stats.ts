/**
 * fetch-stats.ts — Pull fixture + player stats from API-Football v3
 *
 * Usage:
 *   API_FOOTBALL_KEY=xxx tsx src/fetch-stats.ts <fixture_id>
 *
 * Outputs a JSON file with all player stats for both teams,
 * ready for compute-fantasy.ts to process.
 */

import axios from "axios";
import { writeFileSync } from "fs";
import { config } from "dotenv";
import type { PlayerMatchStats, Position } from "./compute-fantasy.js";

config();

const API_KEY = process.env.API_FOOTBALL_KEY;
const BASE_URL = "https://v3.football.api-sports.io";

if (!API_KEY) {
  console.error("Missing API_FOOTBALL_KEY in .env");
  process.exit(1);
}

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "x-apisports-key": API_KEY },
});

// ── Map API-Football position to our Position type ──

function mapPosition(pos: string): Position {
  switch (pos) {
    case "G": return "GK";
    case "D": return "DEF";
    case "M": return "MID";
    case "F": return "FWD";
    default: return "MID"; // fallback
  }
}

// ── Fetch fixture details ──

interface FixtureInfo {
  fixture_id: number;
  home_team: { id: number; name: string };
  away_team: { id: number; name: string };
  home_score: number;
  away_score: number;
  status: string;
  date: string;
}

async function fetchFixture(fixtureId: number): Promise<FixtureInfo> {
  const res = await api.get("/fixtures", { params: { id: fixtureId } });
  const f = res.data.response[0];
  return {
    fixture_id: f.fixture.id,
    home_team: { id: f.teams.home.id, name: f.teams.home.name },
    away_team: { id: f.teams.away.id, name: f.teams.away.name },
    home_score: f.goals.home,
    away_score: f.goals.away,
    status: f.fixture.status.short,
    date: f.fixture.date,
  };
}

// ── Fetch player stats for a fixture ──

async function fetchPlayerStats(fixtureId: number): Promise<PlayerMatchStats[]> {
  const res = await api.get("/fixtures/players", { params: { fixture: fixtureId } });
  const teams = res.data.response as any[];
  const allStats: PlayerMatchStats[] = [];

  for (const team of teams) {
    const homeScore = team.team.id; // we'll compute clean sheet from goals
    for (const p of team.players) {
      const stat = p.statistics[0]; // first stat entry (usually the main one)
      if (!stat) continue;

      const position = mapPosition(stat.games.position);
      const minutes = stat.games.minutes ?? 0;

      // API-Football doesn't directly give clean_sheet per player.
      // We derive it: if the team conceded 0 goals and player played 60+ min
      // This will be set correctly after we know the final score
      const teamGoalsConceded = 0; // placeholder, set after

      allStats.push({
        player_id: p.player.id,
        name: p.player.name,
        position,
        minutes_played: minutes,
        goals: stat.goals.total ?? 0,
        assists: stat.goals.assists ?? 0,
        clean_sheet: false, // set below
        saves: stat.goals.saves ?? 0,
        penalty_saves: 0, // API-Football doesn't separate this cleanly
        penalty_misses: stat.penalty.missed ?? 0,
        goals_conceded: stat.goals.conceded ?? 0,
        yellow_cards: stat.cards.yellow ?? 0,
        red_card: (stat.cards.red ?? 0) > 0,
        own_goals: 0, // API-Football tracks this in events, not player stats
        clearances: stat.tackles?.total ?? 0, // approximate
        blocks: stat.tackles?.blocks ?? 0,
        interceptions: stat.tackles?.interceptions ?? 0,
        tackles: stat.tackles?.total ?? 0,
        recoveries: 0, // not directly available
        key_passes: stat.passes?.key ?? 0,
        big_chances_created: 0, // not in API-Football
        shots_on_target: stat.shots?.on ?? 0,
        dribbles_completed: stat.dribbles?.success ?? 0,
        fouls_committed: stat.fouls?.committed ?? 0,
        fouls_drawn: stat.fouls?.drawn ?? 0,
        penalties_committed: stat.penalty?.committed ?? 0,
        was_fouled_for_penalty: (stat.penalty?.won ?? 0) > 0,
        big_chances_missed: 0,
      });
    }
  }

  return allStats;
}

// ── Fetch events (own goals, penalty saves) ──

async function fetchEvents(fixtureId: number): Promise<Map<number, { own_goals: number; penalty_saves: number }>> {
  const res = await api.get("/fixtures/events", { params: { fixture: fixtureId } });
  const events = res.data.response as any[];
  const map = new Map<number, { own_goals: number; penalty_saves: number }>();

  for (const e of events) {
    const playerId = e.player?.id;
    if (!playerId) continue;

    const entry = map.get(playerId) ?? { own_goals: 0, penalty_saves: 0 };

    if (e.type === "Goal" && e.detail === "Own Goal") {
      entry.own_goals++;
    }
    if (e.type === "Goal" && e.detail === "Missed Penalty" && e.comments === "Penalty saved") {
      // The GK who saved it — check assist player
      const gkId = e.assist?.id;
      if (gkId) {
        const gkEntry = map.get(gkId) ?? { own_goals: 0, penalty_saves: 0 };
        gkEntry.penalty_saves++;
        map.set(gkId, gkEntry);
      }
    }

    map.set(playerId, entry);
  }

  return map;
}

// ── Main: fetch + enrich all stats for a fixture ──

export async function fetchMatchData(fixtureId: number) {
  console.log(`Fetching fixture ${fixtureId}...`);
  const fixture = await fetchFixture(fixtureId);
  console.log(`${fixture.home_team.name} ${fixture.home_score}-${fixture.away_score} ${fixture.away_team.name}`);

  if (fixture.status !== "FT" && fixture.status !== "AET" && fixture.status !== "PEN") {
    console.warn(`Warning: fixture status is ${fixture.status}, not finished.`);
  }

  console.log("Fetching player stats...");
  const stats = await fetchPlayerStats(fixtureId);

  console.log("Fetching events (own goals, pen saves)...");
  const eventMap = await fetchEvents(fixtureId);

  // Enrich stats with clean sheet and event data
  const enriched = stats.map((s) => {
    const events = eventMap.get(s.player_id);
    const isHomePlayer = true; // We'll need team info to determine this properly

    // Clean sheet: GK/DEF who played 60+ min and team conceded 0
    // We use goals_conceded from the API (per player, but it's actually team goals)
    const teamConceded = s.goals_conceded;
    const cleanSheet =
      (s.position === "GK" || s.position === "DEF" || s.position === "MID") &&
      s.minutes_played >= 60 &&
      teamConceded === 0;

    return {
      ...s,
      clean_sheet: cleanSheet,
      own_goals: events?.own_goals ?? 0,
      penalty_saves: events?.penalty_saves ?? s.penalty_saves,
    };
  });

  return {
    fixture,
    players: enriched,
  };
}

// ── CLI ──

async function main() {
  const fixtureId = parseInt(process.argv[2] ?? "");
  if (isNaN(fixtureId)) {
    console.log("Usage: tsx src/fetch-stats.ts <fixture_id>");
    console.log("Example: tsx src/fetch-stats.ts 1035057");
    console.log("\nTo find fixture IDs, use API-Football fixtures endpoint:");
    console.log("  GET /fixtures?league=39&season=2024&round=Regular Season - 15");
    process.exit(1);
  }

  const data = await fetchMatchData(fixtureId);
  const outFile = `data/fixture-${fixtureId}.json`;

  // Ensure data dir exists
  const { mkdirSync } = await import("fs");
  mkdirSync("data", { recursive: true });

  writeFileSync(outFile, JSON.stringify(data, null, 2));
  console.log(`\nSaved ${data.players.length} players to ${outFile}`);
}

main().catch(console.error);
