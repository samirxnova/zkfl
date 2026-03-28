import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const matchesRouter = Router();

// GET /api/matches — list all matches
matchesRouter.get("/", async (_req, res) => {
  const { data, error } = await supabase
    .from("matches")
    .select(`
      *,
      home_club:clubs!matches_home_club_id_fkey(id, name, short_name, crest_url),
      away_club:clubs!matches_away_club_id_fkey(id, name, short_name, crest_url)
    `)
    .order("kickoff", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// GET /api/matches/:id — single match with player prices
matchesRouter.get("/:id", async (req, res) => {
  const matchId = parseInt(req.params.id);

  const { data: match, error: matchErr } = await supabase
    .from("matches")
    .select(`
      *,
      home_club:clubs!matches_home_club_id_fkey(id, name, short_name, on_chain_id, crest_url),
      away_club:clubs!matches_away_club_id_fkey(id, name, short_name, on_chain_id, crest_url)
    `)
    .eq("id", matchId)
    .single();

  if (matchErr) {
    res.status(404).json({ error: "Match not found" });
    return;
  }
  res.json(match);
});

// GET /api/matches/:id/players — players with prices for a match
matchesRouter.get("/:id/players", async (req, res) => {
  const matchId = parseInt(req.params.id);

  // Get match to find the two clubs
  const { data: match } = await supabase
    .from("matches")
    .select("home_club_id, away_club_id")
    .eq("id", matchId)
    .single();

  if (!match) {
    res.status(404).json({ error: "Match not found" });
    return;
  }

  // Get players from both clubs with their prices
  const { data: players, error } = await supabase
    .from("players")
    .select(`
      id, on_chain_id, name, web_name, position, photo_url,
      club:clubs!players_club_id_fkey(id, name, short_name, on_chain_id, crest_url)
    `)
    .in("club_id", [match.home_club_id, match.away_club_id])
    .order("position")
    .order("name");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Get prices
  const { data: prices } = await supabase
    .from("match_player_prices")
    .select("player_id, price_credits")
    .eq("match_id", matchId);

  const priceMap = new Map(prices?.map((p) => [p.player_id, p.price_credits]) ?? []);

  const enriched = players?.map((p) => ({
    ...p,
    price_credits: priceMap.get(p.id)?.toString() ?? "0",
  }));

  res.json(enriched);
});

// PATCH /api/matches/:id — update match status
matchesRouter.patch("/:id", async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { status, is_resolved, home_score, away_score } = req.body;

  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;
  if (is_resolved !== undefined) updates.is_resolved = is_resolved;
  if (home_score !== undefined) updates.home_score = home_score;
  if (away_score !== undefined) updates.away_score = away_score;

  const { data, error } = await supabase
    .from("matches")
    .update(updates)
    .eq("id", matchId)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// GET /api/matches/:id/stats — player stats after match
matchesRouter.get("/:id/stats", async (req, res) => {
  const matchId = parseInt(req.params.id);

  const { data, error } = await supabase
    .from("player_match_stats")
    .select(`
      *,
      player:players!player_match_stats_player_id_fkey(id, name, web_name, position, on_chain_id,
        club:clubs!players_club_id_fkey(short_name)
      )
    `)
    .eq("match_id", matchId)
    .order("fantasy_points", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});
