import { Router } from "express";
import { supabase } from "../db/supabase.js";
import { verifyAleoTransaction } from "../lib/aleo-verify.js";

export const contestsRouter = Router();

// GET /api/contests — list contests (optionally filter by match_id or status)
contestsRouter.get("/", async (req, res) => {
  let query = supabase
    .from("contests")
    .select(`
      *,
      match:matches!contests_match_id_fkey(
        id, on_chain_match_id, kickoff, status, is_resolved, home_score, away_score,
        home_club:clubs!matches_home_club_id_fkey(short_name, crest_url),
        away_club:clubs!matches_away_club_id_fkey(short_name, crest_url)
      )
    `)
    .order("deadline", { ascending: false });

  if (req.query.match_id) {
    query = query.eq("match_id", Number(req.query.match_id));
  }
  if (req.query.status) {
    query = query.eq("status", String(req.query.status));
  }

  const { data, error } = await query;

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// Helper: resolve contest by UUID or on_chain_id
async function resolveContestId(idOrOnChainId: string): Promise<string | null> {
  // UUID format check (8-4-4-4-12)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrOnChainId)) {
    return idOrOnChainId;
  }
  // Lookup by on_chain_id
  const { data } = await supabase
    .from("contests")
    .select("id")
    .eq("on_chain_id", idOrOnChainId)
    .single();
  return data?.id ?? null;
}

// GET /api/contests/:id — single contest with entries
contestsRouter.get("/:id", async (req, res) => {
  const uuid = await resolveContestId(req.params.id);
  if (!uuid) { res.status(404).json({ error: "Contest not found" }); return; }

  const { data: contest, error: contestErr } = await supabase
    .from("contests")
    .select(`
      *,
      match:matches!contests_match_id_fkey(
        id, on_chain_match_id, kickoff, status, is_resolved, home_score, away_score,
        home_club:clubs!matches_home_club_id_fkey(name, short_name, crest_url),
        away_club:clubs!matches_away_club_id_fkey(name, short_name, crest_url)
      )
    `)
    .eq("id", uuid)
    .single();

  if (contestErr) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }
  res.json(contest);
});

// GET /api/contests/:id/leaderboard — entries ranked by score
contestsRouter.get("/:id/leaderboard", async (req, res) => {
  const uuid = await resolveContestId(req.params.id);
  if (!uuid) { res.status(404).json({ error: "Contest not found" }); return; }

  const { data, error } = await supabase
    .from("entries")
    .select(`
      *,
      user:users!entries_user_address_fkey(username, avatar_url)
    `)
    .eq("contest_id", uuid)
    .order("score", { ascending: false });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Add ranks (handle ties)
  const ranked = data?.map((entry, idx) => ({
    ...entry,
    rank: idx + 1,
    prize_won_credits: entry.prize_won_credits?.toString() ?? "0",
  }));

  res.json(ranked);
});

// POST /api/contests/:id/enter — record a contest entry with on-chain verification
contestsRouter.post("/:id/enter", async (req, res) => {
  const uuid = await resolveContestId(req.params.id);
  if (!uuid) { res.status(404).json({ error: "Contest not found" }); return; }

  const { user_address, team_hash } = req.body;

  if (!user_address || !team_hash) {
    res.status(400).json({ error: "user_address and team_hash required" });
    return;
  }

  // Verify the draft_team transaction on-chain
  const verification = await verifyAleoTransaction(
    team_hash,
    "zkfl_team_v2.aleo",
    "draft_team",
  );
  if (!verification.valid) {
    res.status(402).json({ error: `Transaction verification failed: ${verification.error}` });
    return;
  }

  // Ensure user exists (auto-register if needed)
  await supabase.from("users").upsert(
    { address: user_address },
    { onConflict: "address", ignoreDuplicates: true }
  );

  const { error } = await supabase.from("entries").upsert({
    user_address,
    contest_id: uuid,
    team_hash,
    score: null,
    rank: null,
    prize_won_credits: 0,
  }, { onConflict: "user_address,contest_id" });

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Increment total_entries
  await supabase.rpc("increment_contest_entries", { contest_uuid: req.params.id });

  res.json({ success: true });
});

// POST /api/contests — create a contest (off-chain tracking)
contestsRouter.post("/", async (req, res) => {
  const {
    on_chain_id,
    match_id,
    contest_type,
    entry_fee_credits,
    max_entries,
    prize_split,
    invite_code,
  } = req.body;

  if (!match_id || !contest_type) {
    res.status(400).json({ error: "match_id and contest_type required" });
    return;
  }

  // Look up the match to get deadline
  const { data: match } = await supabase
    .from("matches")
    .select("kickoff")
    .eq("id", match_id)
    .single();

  const { data, error } = await supabase
    .from("contests")
    .insert({
      on_chain_id: on_chain_id ?? null,
      match_id,
      is_admin_created: contest_type === "free" || contest_type === "classic",
      contest_type,
      entry_fee_credits: entry_fee_credits ?? 0,
      max_entries: max_entries ?? 10,
      prize_split: prize_split ?? { "1": 100 },
      invite_code: invite_code ?? null,
      deadline: match?.kickoff ?? new Date().toISOString(),
      status: "open",
      total_entries: 0,
      total_pool_credits: 0,
    })
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// POST /api/contests/:id/sync-scores — sync on-chain scores to backend
contestsRouter.post("/:id/sync-scores", async (req, res) => {
  const { scores } = req.body;
  // scores: [{ user_address: string, score: number }]

  if (!scores || !Array.isArray(scores)) {
    res.status(400).json({ error: "scores array required" });
    return;
  }

  const contestId = req.params.id;
  const errors: string[] = [];

  for (const { user_address, score } of scores) {
    const { error } = await supabase
      .from("entries")
      .update({ score })
      .eq("contest_id", contestId)
      .eq("user_address", user_address);

    if (error) errors.push(`${user_address}: ${error.message}`);
  }

  // Re-rank entries
  const { data: entries } = await supabase
    .from("entries")
    .select("user_address, score")
    .eq("contest_id", contestId)
    .order("score", { ascending: false });

  if (entries) {
    for (let i = 0; i < entries.length; i++) {
      await supabase
        .from("entries")
        .update({ rank: i + 1 })
        .eq("contest_id", contestId)
        .eq("user_address", entries[i].user_address);
    }
  }

  if (errors.length > 0) {
    res.status(207).json({ partial: true, errors });
    return;
  }
  res.json({ success: true });
});

// POST /api/contests/:id/distribute — calculate and record prize distribution
contestsRouter.post("/:id/distribute", async (req, res) => {
  const contestId = req.params.id;

  // Get contest info
  const { data: contest, error: contestErr } = await supabase
    .from("contests")
    .select("*")
    .eq("id", contestId)
    .single();

  if (contestErr || !contest) {
    res.status(404).json({ error: "Contest not found" });
    return;
  }

  // Get ranked entries
  const { data: entries } = await supabase
    .from("entries")
    .select("*")
    .eq("contest_id", contestId)
    .order("score", { ascending: false });

  if (!entries || entries.length === 0) {
    res.status(400).json({ error: "No entries to distribute" });
    return;
  }

  const pool = contest.total_pool_credits;
  const rake = Math.floor(pool * 10 / 100);
  const distributable = pool - rake;
  const split = contest.prize_split as Record<string, number>;

  // Distribute prizes based on split
  const updates: { user_address: string; prize: number }[] = [];
  for (const [rank, pct] of Object.entries(split)) {
    const idx = parseInt(rank) - 1;
    if (idx < entries.length) {
      const prize = Math.floor(distributable * pct / 100);
      updates.push({ user_address: entries[idx].user_address, prize });
    }
  }

  // Update entries with prizes
  for (const { user_address, prize } of updates) {
    await supabase
      .from("entries")
      .update({ prize_won_credits: prize })
      .eq("contest_id", contestId)
      .eq("user_address", user_address);
  }

  // Close contest
  await supabase
    .from("contests")
    .update({ status: "settled" })
    .eq("id", contestId);

  res.json({
    success: true,
    pool,
    rake,
    distributable,
    winners: updates,
  });
});

// PATCH /api/contests/:id — update contest status
contestsRouter.patch("/:id", async (req, res) => {
  const uuid = await resolveContestId(req.params.id);
  if (!uuid) { res.status(404).json({ error: "Contest not found" }); return; }

  const { status } = req.body;
  const updates: Record<string, any> = {};
  if (status !== undefined) updates.status = status;

  const { data, error } = await supabase
    .from("contests")
    .update(updates)
    .eq("id", uuid)
    .select()
    .single();

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});

// POST /api/contests/:id/submit-score — user submits their compute_score tx, backend extracts score
contestsRouter.post("/:id/submit-score", async (req, res) => {
  const uuid = await resolveContestId(req.params.id);
  if (!uuid) { res.status(404).json({ error: "Contest not found" }); return; }

  const { user_address, tx_id } = req.body;
  if (!user_address || !tx_id) {
    res.status(400).json({ error: "user_address and tx_id required" });
    return;
  }

  // Fetch transaction from explorer to extract team lineup from the future output,
  // then compute the score off-chain using player stats from DB
  const EXPLORER_API = process.env.ALEO_EXPLORER_API ?? "https://api.explorer.provable.com/v1";
  let playerIds: number[] = [];
  let captainId: number | null = null;
  let viceCaptainId: number | null = null;
  let matchIdField: string | null = null;

  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const txRes = await fetch(`${EXPLORER_API}/testnet/transaction/${tx_id}`);
      if (txRes.status === 404) {
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      if (!txRes.ok) break;

      const tx = await txRes.json();
      const transitions = tx?.execution?.transitions ?? [];
      for (const t of transitions) {
        if (t.program === "zkfl_scoring_v2.aleo" && t.function === "compute_score") {
          const futureOutput = t.outputs?.find((o: any) => o.type === "future");
          if (futureOutput?.value) {
            const val = futureOutput.value;
            // Extract player IDs from the future arguments
            const idMatches = val.match(/(?:gk|def_\d|mid_\d|fwd_\d|bench_\d): (\d+)u32/g);
            if (idMatches) {
              playerIds = idMatches.map((m: string) => parseInt(m.match(/(\d+)u32/)![1], 10));
            }
            const capMatch = val.match(/captain_id: (\d+)u32/);
            const vcMatch = val.match(/vice_captain_id: (\d+)u32/);
            const matchMatch = val.match(/match_id: (\d+)field/);
            if (capMatch) captainId = parseInt(capMatch[1], 10);
            if (vcMatch) viceCaptainId = parseInt(vcMatch[1], 10);
            if (matchMatch) matchIdField = matchMatch[1];
          }
        }
      }
      if (playerIds.length > 0) break;
    } catch {
      await new Promise((r) => setTimeout(r, 3000));
    }
  }

  if (playerIds.length === 0 || !matchIdField) {
    res.status(422).json({ error: "Could not extract team data from transaction" });
    return;
  }

  // Get match DB id from on_chain_match_id
  const { data: matchRow } = await supabase
    .from("matches")
    .select("id")
    .eq("on_chain_match_id", `${matchIdField}field`)
    .single();

  if (!matchRow) {
    res.status(422).json({ error: "Match not found" });
    return;
  }

  // Map on_chain_id to DB player_id first
  const allOnChainIds = [...new Set([...playerIds, captainId!, viceCaptainId!].filter(Boolean))];
  const { data: playerRows } = await supabase
    .from("players")
    .select("id, on_chain_id")
    .in("on_chain_id", allOnChainIds);

  const onChainToDbId = new Map<number, number>();
  for (const p of (playerRows ?? [])) {
    onChainToDbId.set(p.on_chain_id, p.id);
  }

  // Now get player stats using DB IDs
  const dbIds = [...onChainToDbId.values()];
  const { data: statsRows } = await supabase
    .from("player_match_stats")
    .select("player_id, fantasy_points, minutes_played")
    .eq("match_id", matchRow.id)
    .in("player_id", dbIds);

  const statsMap = new Map<number, { fp: number; min: number }>();
  for (const s of (statsRows ?? [])) {
    statsMap.set(s.player_id, { fp: s.fantasy_points ?? 0, min: s.minutes_played ?? 0 });
  }

  // Compute score using same logic as on-chain
  // playerIds: [gk, def0-4, mid0-4, fwd0-2, bench1, bench2] = 16 players
  const getPoints = (onChainId: number) => {
    const dbId = onChainToDbId.get(onChainId);
    if (!dbId) return { fp: 0, min: 0 };
    return statsMap.get(dbId) ?? { fp: 0, min: 0 };
  };

  // Starting 13 (indices 0-12), bench (13-14)
  const starting = playerIds.slice(0, 13);
  const bench = playerIds.slice(13, 15);

  // Sum starting players who played (minutes > 0), count no-shows
  let totalScore = 0;
  let noShowCount = 0;
  const noShowPoints: number[] = [];

  for (const pid of starting) {
    const { fp, min } = getPoints(pid);
    if (pid === 0) { noShowCount++; noShowPoints.push(0); continue; }
    if (min > 0) { totalScore += fp; }
    else { noShowCount++; noShowPoints.push(fp); }
  }

  // Auto-sub bench players for no-shows
  for (let i = 0; i < Math.min(noShowCount, bench.length); i++) {
    const bpid = bench[i];
    if (bpid === 0) continue;
    const { fp, min } = getPoints(bpid);
    if (min > 0) totalScore += fp;
  }

  // Captain bonus (2x) and vice-captain bonus (1.5x)
  if (captainId) {
    const { fp, min } = getPoints(captainId);
    if (min > 0) totalScore += fp; // extra 1x (already counted in starting)
    else if (viceCaptainId) {
      // If captain didn't play, VC gets captain bonus
      const vc = getPoints(viceCaptainId);
      if (vc.min > 0) totalScore += vc.fp; // extra 1x
      // Also VC gets half bonus if captain played
    }
  }
  if (captainId && viceCaptainId) {
    const cap = getPoints(captainId);
    const vc = getPoints(viceCaptainId);
    if (cap.min > 0 && vc.min > 0) {
      totalScore += Math.floor(vc.fp / 2); // VC gets 0.5x bonus
    }
  }

  const score = Math.max(0, totalScore);

  // Update the user's entry with the score
  const { error } = await supabase
    .from("entries")
    .update({ score })
    .eq("contest_id", uuid)
    .eq("user_address", user_address);

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }

  // Re-rank all entries
  const { data: allEntries } = await supabase
    .from("entries")
    .select("user_address, score")
    .eq("contest_id", uuid)
    .order("score", { ascending: false, nullsFirst: false });

  if (allEntries) {
    for (let i = 0; i < allEntries.length; i++) {
      await supabase
        .from("entries")
        .update({ rank: i + 1 })
        .eq("contest_id", uuid)
        .eq("user_address", allEntries[i].user_address);
    }
  }

  res.json({ score, rank: allEntries?.findIndex((e) => e.user_address === user_address)! + 1 });
});

// GET /api/contests/:id/sync-from-chain — read scores from Aleo leaderboard mapping
contestsRouter.get("/:id/sync-from-chain", async (req, res) => {
  const contestId = await resolveContestId(req.params.id) ?? req.params.id;

  // Get all entries for this contest
  const { data: entries } = await supabase
    .from("entries")
    .select("user_address")
    .eq("contest_id", contestId);

  if (!entries || entries.length === 0) {
    res.json({ synced: 0 });
    return;
  }

  // Re-rank all entries by score
  const { data: allEntries } = await supabase
    .from("entries")
    .select("user_address, score")
    .eq("contest_id", contestId)
    .order("score", { ascending: false });

  if (allEntries) {
    for (let i = 0; i < allEntries.length; i++) {
      await supabase
        .from("entries")
        .update({ rank: i + 1 })
        .eq("contest_id", contestId)
        .eq("user_address", allEntries[i].user_address);
    }
  }

  const syncedCount = allEntries?.filter((e) => e.score !== null).length ?? 0;
  res.json({ synced: syncedCount, total: entries.length });
});

// GET /api/contests/user/:address — contests a user has entered
contestsRouter.get("/user/:address", async (req, res) => {
  const { data, error } = await supabase
    .from("entries")
    .select(`
      *,
      contest:contests!entries_contest_id_fkey(
        id, on_chain_id, contest_type, entry_fee_credits, status,
        match:matches!contests_match_id_fkey(
          kickoff, status,
          home_club:clubs!matches_home_club_id_fkey(short_name),
          away_club:clubs!matches_away_club_id_fkey(short_name)
        )
      )
    `)
    .eq("user_address", req.params.address)
    .order("contest_id");

  if (error) {
    res.status(500).json({ error: error.message });
    return;
  }
  res.json(data);
});
