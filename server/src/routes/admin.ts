/**
 * admin.ts — Protected admin endpoints for judges / demo use
 *
 * Requires header:  x-admin-secret: <ADMIN_SECRET env var>
 *
 * Endpoints:
 *   POST /api/admin/resolve-match/:matchId   — mark match FT + is_resolved in DB
 *   POST /api/admin/distribute/:contestId    — distribute prizes in DB
 *   GET  /api/admin/status                   — list all matches + contests state
 */

import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const adminRouter = Router();

// ── Auth middleware ──
adminRouter.use((req, res, next) => {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    res.status(503).json({ error: "Admin endpoint not configured (ADMIN_SECRET not set)" });
    return;
  }
  if (req.headers["x-admin-secret"] !== secret) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }
  next();
});

// GET /api/admin/status — overview of all matches + contests
adminRouter.get("/status", async (_req, res) => {
  const { data: matches } = await supabase
    .from("matches")
    .select(`
      id, on_chain_match_id, status, is_resolved, home_score, away_score,
      home_club:clubs!matches_home_club_id_fkey(short_name),
      away_club:clubs!matches_away_club_id_fkey(short_name)
    `)
    .order("kickoff", { ascending: false });

  const { data: contests } = await supabase
    .from("contests")
    .select("id, on_chain_id, status, total_entries, total_pool_credits, match_id")
    .order("deadline", { ascending: false });

  res.json({ matches, contests });
});

// POST /api/admin/resolve-match/:matchId
// Body (optional): { home_score: 3, away_score: 2 }
// Marks match as FT + is_resolved in DB (simulates oracle resolve_match)
adminRouter.post("/resolve-match/:matchId", async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { home_score, away_score } = req.body;

  const { data, error } = await supabase
    .from("matches")
    .update({
      status: "FT",
      is_resolved: true,
      ...(home_score !== undefined && { home_score }),
      ...(away_score !== undefined && { away_score }),
    })
    .eq("id", matchId)
    .select(`
      id, on_chain_match_id, status, is_resolved, home_score, away_score,
      home_club:clubs!matches_home_club_id_fkey(short_name),
      away_club:clubs!matches_away_club_id_fkey(short_name)
    `)
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({
    success: true,
    message: `Match ${data.on_chain_match_id} marked as FT + resolved in DB`,
    note: "On-chain match_resolved mapping is NOT updated here — compute_score will still need oracle for real ZK proof",
    match: data,
  });
});

// POST /api/admin/distribute/:contestId
// Calculates and records prize distribution in DB
adminRouter.post("/distribute/:contestId", async (req, res) => {
  const contestId = req.params.contestId;

  const { data: contest, error: contestErr } = await supabase
    .from("contests")
    .select("*")
    .eq("id", contestId)
    .single();

  if (contestErr || !contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }

  if (contest.status === "settled") {
    res.status(400).json({ error: "Contest already settled" });
    return;
  }

  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("contest_id", contestId)
    .not("score", "is", null)
    .order("score", { ascending: false });

  if (!entries || entries.length === 0) {
    res.status(400).json({ error: "No scored entries to distribute. Users must compute their ZK scores first." });
    return;
  }

  const pool = contest.total_pool_credits ?? (entries.length * (contest.entry_fee_credits ?? 0));
  const rake = Math.floor(pool * 10 / 100);
  const distributable = pool - rake;
  const split = contest.prize_split as Record<string, number>;

  const winners: { rank: number; address: string; prize: number }[] = [];

  for (const [rankStr, pct] of Object.entries(split)) {
    const idx = parseInt(rankStr) - 1;
    if (idx >= entries.length) continue;
    const prize = Math.floor(distributable * pct / 100);
    winners.push({ rank: idx + 1, address: entries[idx].user_address, prize });

    await supabase
      .from("entries")
      .update({ prize_won_credits: prize, rank: idx + 1 })
      .eq("contest_id", contestId)
      .eq("user_address", entries[idx].user_address);
  }

  await supabase
    .from("contests")
    .update({ status: "settled" })
    .eq("id", contestId);

  res.json({
    success: true,
    pool,
    rake,
    distributable,
    winners,
    note: "Prizes recorded in DB. On-chain pay_winner calls still require oracle with Leo CLI.",
  });
});

// POST /api/admin/set-score — manually set a score for an entry (for testing)
// Body: { contest_id, user_address, score }
adminRouter.post("/set-score", async (req, res) => {
  const { contest_id, user_address, score } = req.body;
  if (!contest_id || !user_address || score === undefined) {
    res.status(400).json({ error: "contest_id, user_address, score required" });
    return;
  }

  const { error } = await supabase
    .from("entries")
    .update({ score })
    .eq("contest_id", contest_id)
    .eq("user_address", user_address);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Re-rank all entries
  const { data: allEntries } = await supabase
    .from("entries")
    .select("user_address, score")
    .eq("contest_id", contest_id)
    .order("score", { ascending: false, nullsFirst: false });

  if (allEntries) {
    for (let i = 0; i < allEntries.length; i++) {
      await supabase
        .from("entries")
        .update({ rank: i + 1 })
        .eq("contest_id", contest_id)
        .eq("user_address", allEntries[i].user_address);
    }
  }

  res.json({ success: true, score, rank: (allEntries?.findIndex((e) => e.user_address === user_address) ?? 0) + 1 });
});
