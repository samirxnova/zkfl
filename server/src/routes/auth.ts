import { Router } from "express";
import { supabase } from "../db/supabase.js";

export const authRouter = Router();

// POST /api/auth/login — login or register by wallet address
// Called automatically when wallet connects on frontend
authRouter.post("/login", async (req, res) => {
  const { address } = req.body;

  if (!address || typeof address !== "string" || !address.startsWith("aleo1")) {
    res.status(400).json({ error: "Valid Aleo address required" });
    return;
  }

  // Check if user exists
  const { data: existing } = await supabase
    .from("users")
    .select("*")
    .eq("address", address)
    .single();

  if (existing) {
    // Update last_seen
    await supabase
      .from("users")
      .update({ last_seen_at: new Date().toISOString() })
      .eq("address", address);

    res.json({ user: existing, is_new: false });
    return;
  }

  // Register new user
  const { data: newUser, error } = await supabase
    .from("users")
    .insert({
      address,
      username: null,
      avatar_url: null,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  res.json({ user: newUser, is_new: true });
});

// GET /api/auth/user/:address — get user profile
authRouter.get("/user/:address", async (req, res) => {
  const { data: user, error } = await supabase
    .from("users")
    .select("*")
    .eq("address", req.params.address)
    .single();

  if (error || !user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(user);
});

// PATCH /api/auth/user/:address — update username / avatar
// Requires caller_address in body to match URL param (basic spoofing guard)
authRouter.patch("/user/:address", async (req, res) => {
  const { username, avatar_url, caller_address } = req.body;

  if (!caller_address || caller_address !== req.params.address) {
    res.status(403).json({ error: "Address mismatch — you can only update your own profile" });
    return;
  }

  const updates: Record<string, any> = {};

  if (username !== undefined) {
    // Validate username
    if (username && (username.length < 3 || username.length > 32)) {
      res.status(400).json({ error: "Username must be 3-32 characters" });
      return;
    }
    if (username && !/^[a-zA-Z0-9_]+$/.test(username)) {
      res.status(400).json({ error: "Username can only contain letters, numbers, and underscores" });
      return;
    }
    updates.username = username;
  }
  if (avatar_url !== undefined) updates.avatar_url = avatar_url;

  const { data, error } = await supabase
    .from("users")
    .update(updates)
    .eq("address", req.params.address)
    .select()
    .single();

  if (error) {
    // Check for unique constraint violation on username
    if (error.code === "23505") {
      res.status(409).json({ error: "Username already taken" });
      return;
    }
    res.status(500).json({ error: error.message });
    return;
  }

  res.json(data);
});

// GET /api/auth/user/:address/stats — aggregated user stats
authRouter.get("/user/:address/stats", async (req, res) => {
  const address = req.params.address;

  const { data: entries } = await supabase
    .from("entries")
    .select("score, rank, prize_won_credits")
    .eq("user_address", address);

  if (!entries) {
    res.json({ total_contests: 0, total_wins: 0, total_earnings_credits: 0, best_score: null });
    return;
  }

  const total_contests = entries.length;
  const total_wins = entries.filter((e) => e.rank === 1).length;
  const total_earnings_credits = entries.reduce(
    (sum, e) => sum + (parseInt(String(e.prize_won_credits)) || 0),
    0
  );
  const best_score = entries.reduce(
    (max, e) => (e.score !== null && e.score > max ? e.score : max),
    0
  );

  // Update cached stats in users table
  await supabase
    .from("users")
    .update({ total_contests, total_wins, total_earnings_credits })
    .eq("address", address);

  res.json({ total_contests, total_wins, total_earnings_credits, best_score });
});
