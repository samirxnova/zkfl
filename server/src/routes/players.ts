import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const playersRouter = Router();

// GET /api/players — list all players (optionally filter by club)
playersRouter.get("/", async (req, res) => {
  let query = supabase
    .from("players")
    .select(`
      id, on_chain_id, name, web_name, position, photo_url,
      club:clubs!players_club_id_fkey(id, name, short_name, crest_url)
    `)
    .order("name");

  const clubId = req.query.club_id;
  if (clubId) {
    query = query.eq("club_id", Number(clubId));
  }

  const position = req.query.position;
  if (position) {
    query = query.eq("position", String(position).toUpperCase());
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// GET /api/players/:id — single player
playersRouter.get("/:id", async (req, res) => {
  const { data, error } = await supabase
    .from("players")
    .select(`
      id, on_chain_id, name, web_name, position, photo_url,
      club:clubs!players_club_id_fkey(id, name, short_name, crest_url)
    `)
    .eq("id", parseInt(req.params.id))
    .single();

  if (error) {
    res.status(404).json({ error: "Player not found" });
    return;
  }
  res.json(data);
});
