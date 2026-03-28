/**
 * compute-fantasy.ts — FPL Scoring Formula
 *
 * Computes fantasy points per player using the official FPL scoring rules.
 * The oracle runs this off-chain, then submits the final points + minutes
 * to zkfl_scoring.aleo/submit_player_stats on-chain.
 *
 * On-chain contract only handles: auto-sub + captain/VC multiplier logic.
 */

// ── Types ──

export type Position = "GK" | "DEF" | "MID" | "FWD";

export interface PlayerMatchStats {
  player_id: number;
  name: string;
  position: Position;
  minutes_played: number;
  goals: number;
  assists: number;
  clean_sheet: boolean;
  saves: number;
  penalty_saves: number;
  penalty_misses: number;
  goals_conceded: number;
  yellow_cards: number;
  red_card: boolean;
  own_goals: number;
  // Defensive stats for BPS
  clearances: number;
  blocks: number;
  interceptions: number;
  tackles: number;
  recoveries: number;
  // Attacking stats for BPS
  key_passes: number;
  big_chances_created: number;
  shots_on_target: number;
  dribbles_completed: number;
  // Fouls
  fouls_committed: number;
  fouls_drawn: number;
  // GK specific
  penalties_committed: number;
  // Other
  was_fouled_for_penalty: boolean;
  big_chances_missed: number;
}

export interface PlayerFantasyResult {
  player_id: number;
  name: string;
  position: Position;
  minutes_played: number;
  fantasy_points: number;
  bps_score: number;
  bonus: number;
  breakdown: Record<string, number>;
}

// ── FPL Scoring Formula ──

export function computeFantasyPoints(stats: PlayerMatchStats): Omit<PlayerFantasyResult, "bonus"> {
  const breakdown: Record<string, number> = {};
  let points = 0;

  // 1. Minutes played
  if (stats.minutes_played >= 60) {
    breakdown.minutes = 2;
  } else if (stats.minutes_played >= 1) {
    breakdown.minutes = 1;
  } else {
    breakdown.minutes = 0;
  }
  points += breakdown.minutes;

  // 2. Goals scored (position-dependent)
  if (stats.goals > 0) {
    const goalPoints =
      stats.position === "GK" || stats.position === "DEF" ? 6 :
      stats.position === "MID" ? 5 : 4;
    breakdown.goals = stats.goals * goalPoints;
    points += breakdown.goals;
  }

  // 3. Assists
  if (stats.assists > 0) {
    breakdown.assists = stats.assists * 3;
    points += breakdown.assists;
  }

  // 4. Clean sheet (GK/DEF: 4pts, MID: 1pt, FWD: 0)
  if (stats.clean_sheet && stats.minutes_played >= 60) {
    if (stats.position === "GK" || stats.position === "DEF") {
      breakdown.clean_sheet = 4;
    } else if (stats.position === "MID") {
      breakdown.clean_sheet = 1;
    }
    points += breakdown.clean_sheet ?? 0;
  }

  // 5. GK saves (1pt per 3 saves)
  if (stats.position === "GK" && stats.saves >= 3) {
    breakdown.saves = Math.floor(stats.saves / 3);
    points += breakdown.saves;
  }

  // 6. Penalty saves
  if (stats.penalty_saves > 0) {
    breakdown.penalty_saves = stats.penalty_saves * 5;
    points += breakdown.penalty_saves;
  }

  // 7. Penalty misses
  if (stats.penalty_misses > 0) {
    breakdown.penalty_misses = stats.penalty_misses * -2;
    points += breakdown.penalty_misses;
  }

  // 8. Goals conceded (GK/DEF: -1 per 2 conceded, only if played 60+ min)
  if ((stats.position === "GK" || stats.position === "DEF") && stats.minutes_played >= 60) {
    if (stats.goals_conceded >= 2) {
      breakdown.goals_conceded = -Math.floor(stats.goals_conceded / 2);
      points += breakdown.goals_conceded;
    }
  }

  // 9. Yellow cards
  if (stats.yellow_cards > 0) {
    breakdown.yellow_cards = -stats.yellow_cards;
    points += breakdown.yellow_cards;
  }

  // 10. Red card
  if (stats.red_card) {
    breakdown.red_card = -3;
    points += breakdown.red_card;
  }

  // 11. Own goals
  if (stats.own_goals > 0) {
    breakdown.own_goals = stats.own_goals * -2;
    points += breakdown.own_goals;
  }

  return {
    player_id: stats.player_id,
    name: stats.name,
    position: stats.position,
    minutes_played: stats.minutes_played,
    fantasy_points: points,
    bps_score: computeBPS(stats),
    breakdown,
  };
}

// ── Bonus Points System (BPS) ──
// Simplified FPL BPS: top 3 BPS scores get 3, 2, 1 bonus points

export function computeBPS(stats: PlayerMatchStats): number {
  let bps = 0;

  // Playing time
  if (stats.minutes_played >= 60) bps += 6;
  else if (stats.minutes_played >= 1) bps += 3;

  // Goals
  if (stats.position === "GK" || stats.position === "DEF") {
    bps += stats.goals * 12;
  } else if (stats.position === "MID") {
    bps += stats.goals * 18;
  } else {
    bps += stats.goals * 24;
  }

  // Assists
  bps += stats.assists * 9;

  // Clean sheet (GK/DEF only)
  if (stats.clean_sheet && stats.minutes_played >= 60) {
    if (stats.position === "GK") bps += 12;
    else if (stats.position === "DEF") bps += 12;
  }

  // GK saves
  if (stats.position === "GK") {
    bps += stats.saves * 2;
  }

  // Penalty saves
  bps += stats.penalty_saves * 15;

  // Key passes
  bps += stats.key_passes * 3;

  // Tackles won
  bps += stats.tackles * 2;

  // Clearances, blocks, interceptions
  bps += stats.clearances * 1;
  bps += stats.blocks * 1;
  bps += stats.interceptions * 1;
  bps += stats.recoveries * 1;

  // Big chances created
  bps += stats.big_chances_created * 3;

  // Dribbles completed
  bps += stats.dribbles_completed * 1;

  // Shots on target
  bps += stats.shots_on_target * 2;

  // Fouls drawn
  bps += stats.fouls_drawn * 1;

  // Negatives
  bps -= stats.fouls_committed * 1;
  bps -= stats.yellow_cards * 3;
  bps -= (stats.red_card ? 9 : 0);
  bps -= stats.own_goals * 6;
  bps -= stats.penalty_misses * 6;
  bps -= stats.goals_conceded * 2; // GK/DEF penalty already handled by position
  bps -= stats.big_chances_missed * 3;

  return Math.max(0, bps);
}

// ── Assign Bonus Points (3/2/1) ──

export function assignBonus(results: Omit<PlayerFantasyResult, "bonus">[]): PlayerFantasyResult[] {
  // Only players who actually played get bonus consideration
  const played = results.filter((r) => r.minutes_played > 0);
  const sorted = [...played].sort((a, b) => b.bps_score - a.bps_score);

  // Group by BPS score (ties get same bonus)
  const bonusMap = new Map<number, number>();
  let bonusPool = [3, 2, 1];
  let poolIdx = 0;

  let i = 0;
  while (i < sorted.length && poolIdx < bonusPool.length) {
    const currentBps = sorted[i].bps_score;
    // Count how many players share this BPS score
    let tieCount = 0;
    while (i + tieCount < sorted.length && sorted[i + tieCount].bps_score === currentBps) {
      tieCount++;
    }

    // All tied players get the same bonus
    const bonus = bonusPool[poolIdx] ?? 0;
    for (let j = 0; j < tieCount; j++) {
      bonusMap.set(sorted[i + j].player_id, bonus);
    }

    poolIdx += tieCount;
    i += tieCount;
  }

  return results.map((r) => ({
    ...r,
    bonus: bonusMap.get(r.player_id) ?? 0,
    fantasy_points: r.fantasy_points + (bonusMap.get(r.player_id) ?? 0),
  }));
}

// ── Main: compute all players for a match ──

export function computeMatchFantasy(allStats: PlayerMatchStats[]): PlayerFantasyResult[] {
  const rawResults = allStats.map(computeFantasyPoints);
  return assignBonus(rawResults);
}

// CLI entry point
if (process.argv[1]?.endsWith("compute-fantasy.ts")) {
  console.log("FPL Scoring module loaded. Import computeMatchFantasy() to use.");
  console.log("Example scoring for a GK with 90min, 1 save, clean sheet:");
  const example = computeFantasyPoints({
    player_id: 1,
    name: "Example GK",
    position: "GK",
    minutes_played: 90,
    goals: 0,
    assists: 0,
    clean_sheet: true,
    saves: 4,
    penalty_saves: 0,
    penalty_misses: 0,
    goals_conceded: 0,
    yellow_cards: 0,
    red_card: false,
    own_goals: 0,
    clearances: 2,
    blocks: 0,
    interceptions: 1,
    tackles: 0,
    recoveries: 3,
    key_passes: 0,
    big_chances_created: 0,
    shots_on_target: 0,
    dribbles_completed: 0,
    fouls_committed: 0,
    fouls_drawn: 0,
    penalties_committed: 0,
    was_fouled_for_penalty: false,
    big_chances_missed: 0,
  });
  console.log(example);
}
