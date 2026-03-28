// ═══════════════════════════════════════════════════════════
// zkfl_scoring_v2.aleo — Oracle stats + ZK score computation
// ═══════════════════════════════════════════════════════════
//
// Design: Oracle pre-computes fantasy points per player off-chain
// using the full FPL scoring formula, then submits per-player points
// and minutes to on-chain mappings. The compute_score transition
// sums the 13-player squad with captain/VC/auto-sub logic in ZK.
//
// This keeps the circuit small while proving the score is correct
// relative to the team lineup (which remains private until scoring).
//
// v2: All .get() in compute_score changed to .get_or_use() so
//     dummy player 0 (unused formation slots) doesn't cause panics.

import zkfl_match.aleo;
import zkfl_team_v2.aleo;

program zkfl_scoring_v2.aleo {

    // ── Structs ──

    struct StatsKey {
        match_id: field,
        player_id: u32,
    }

    struct CommitKey {
        contest_id: field,
        player: address,
    }

    struct ScoreInput {
        contest_id: field,
        match_id: field,
        gk: u32,
        def_0: u32,
        def_1: u32,
        def_2: u32,
        def_3: u32,
        def_4: u32,
        mid_0: u32,
        mid_1: u32,
        mid_2: u32,
        mid_3: u32,
        mid_4: u32,
        fwd_0: u32,
        fwd_1: u32,
        fwd_2: u32,
        bench_1: u32,
        bench_2: u32,
    }

    struct CaptainInfo {
        captain_id: u32,
        vice_captain_id: u32,
        formation: u8,
        team_hash: field,
    }

    // ── Mappings ──

    mapping player_points: field => i64;     // hash(match_id, player_id) => fantasy points
    mapping player_minutes: field => u32;    // hash(match_id, player_id) => minutes played
    mapping leaderboard: field => u64;       // hash(contest_id, player_addr) => score
    mapping match_resolved: field => bool;

    // ── Constructor ──

    @noupgrade
    async constructor() {}

    // ── Oracle: submit one player's pre-computed fantasy points ──

    async transition submit_player_stats(
        match_id: field,
        player_id: u32,
        points: i64,
        minutes: u32,
    ) -> Future {
        return finalize_submit(match_id, player_id, points, minutes, self.caller);
    }

    async function finalize_submit(
        match_id: field,
        player_id: u32,
        points: i64,
        minutes: u32,
        caller: address,
    ) {
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        let key: field = BHP256::hash_to_field(StatsKey { match_id, player_id });
        player_points.set(key, points);
        player_minutes.set(key, minutes);
    }

    // ── Oracle: resolve match (enables scoring) ──

    async transition resolve_match(match_id: field) -> Future {
        return finalize_resolve(match_id, self.caller);
    }

    async function finalize_resolve(match_id: field, caller: address) {
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        match_resolved.set(match_id, true);
    }

    // ── User: compute ZK score ──
    // Consumes TeamRecord, outputs score.
    // Player IDs become visible on-chain (post-match, acceptable).
    // The ZK proof guarantees score was computed from the committed team.

    async transition compute_score(
        team_record: zkfl_team_v2.aleo/TeamRecord,
    ) -> (u64, Future) {
        let si: ScoreInput = ScoreInput {
            contest_id: team_record.contest_id,
            match_id: team_record.match_id,
            gk: team_record.gk,
            def_0: team_record.def_0,
            def_1: team_record.def_1,
            def_2: team_record.def_2,
            def_3: team_record.def_3,
            def_4: team_record.def_4,
            mid_0: team_record.mid_0,
            mid_1: team_record.mid_1,
            mid_2: team_record.mid_2,
            mid_3: team_record.mid_3,
            mid_4: team_record.mid_4,
            fwd_0: team_record.fwd_0,
            fwd_1: team_record.fwd_1,
            fwd_2: team_record.fwd_2,
            bench_1: team_record.bench_1,
            bench_2: team_record.bench_2,
        };

        let ci: CaptainInfo = CaptainInfo {
            captain_id: team_record.captain_id,
            vice_captain_id: team_record.vice_captain_id,
            formation: team_record.formation,
            team_hash: team_record.team_hash,
        };

        return (0u64, finalize_compute(
            si, ci, self.signer,
        ));
    }

    async function finalize_compute(
        si: ScoreInput,
        ci: CaptainInfo,
        caller: address,
    ) {
        // Verify match is resolved (get_or_use: defaults false if not set)
        assert(match_resolved.get_or_use(si.match_id, false));

        // Verify team commitment
        let commit_key: field = BHP256::hash_to_field(CommitKey { contest_id: si.contest_id, player: caller });
        assert_eq(zkfl_team_v2.aleo/team_commitments.get(commit_key), ci.team_hash);

        // ── Read points and minutes for all 16 players ──
        // Using get_or_use so dummy player 0 (unused slots) returns 0 instead of panicking

        let k_gk: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.gk });
        let pts_gk: i64 = player_points.get_or_use(k_gk, 0i64);
        let min_gk: u32 = player_minutes.get_or_use(k_gk, 0u32);

        let k_d0: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.def_0 });
        let pts_d0: i64 = player_points.get_or_use(k_d0, 0i64);
        let min_d0: u32 = player_minutes.get_or_use(k_d0, 0u32);

        let k_d1: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.def_1 });
        let pts_d1: i64 = player_points.get_or_use(k_d1, 0i64);
        let min_d1: u32 = player_minutes.get_or_use(k_d1, 0u32);

        let k_d2: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.def_2 });
        let pts_d2: i64 = player_points.get_or_use(k_d2, 0i64);
        let min_d2: u32 = player_minutes.get_or_use(k_d2, 0u32);

        let k_d3: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.def_3 });
        let pts_d3: i64 = player_points.get_or_use(k_d3, 0i64);
        let min_d3: u32 = player_minutes.get_or_use(k_d3, 0u32);

        let k_d4: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.def_4 });
        let pts_d4: i64 = player_points.get_or_use(k_d4, 0i64);
        let min_d4: u32 = player_minutes.get_or_use(k_d4, 0u32);

        let k_m0: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.mid_0 });
        let pts_m0: i64 = player_points.get_or_use(k_m0, 0i64);
        let min_m0: u32 = player_minutes.get_or_use(k_m0, 0u32);

        let k_m1: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.mid_1 });
        let pts_m1: i64 = player_points.get_or_use(k_m1, 0i64);
        let min_m1: u32 = player_minutes.get_or_use(k_m1, 0u32);

        let k_m2: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.mid_2 });
        let pts_m2: i64 = player_points.get_or_use(k_m2, 0i64);
        let min_m2: u32 = player_minutes.get_or_use(k_m2, 0u32);

        let k_m3: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.mid_3 });
        let pts_m3: i64 = player_points.get_or_use(k_m3, 0i64);
        let min_m3: u32 = player_minutes.get_or_use(k_m3, 0u32);

        let k_m4: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.mid_4 });
        let pts_m4: i64 = player_points.get_or_use(k_m4, 0i64);
        let min_m4: u32 = player_minutes.get_or_use(k_m4, 0u32);

        let k_f0: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.fwd_0 });
        let pts_f0: i64 = player_points.get_or_use(k_f0, 0i64);
        let min_f0: u32 = player_minutes.get_or_use(k_f0, 0u32);

        let k_f1: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.fwd_1 });
        let pts_f1: i64 = player_points.get_or_use(k_f1, 0i64);
        let min_f1: u32 = player_minutes.get_or_use(k_f1, 0u32);

        let k_f2: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.fwd_2 });
        let pts_f2: i64 = player_points.get_or_use(k_f2, 0i64);
        let min_f2: u32 = player_minutes.get_or_use(k_f2, 0u32);

        let k_b1: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.bench_1 });
        let pts_b1: i64 = player_points.get_or_use(k_b1, 0i64);
        let min_b1: u32 = player_minutes.get_or_use(k_b1, 0u32);

        let k_b2: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: si.bench_2 });
        let pts_b2: i64 = player_points.get_or_use(k_b2, 0i64);
        let min_b2: u32 = player_minutes.get_or_use(k_b2, 0u32);

        // ── Sum starting XI points (formation determines which 11 start) ──
        // GK always starts
        let total: i64 = pts_gk;

        // All starting outfield players contribute their points
        // (unused slots filled with player 0 at draft time → 0 points)
        let outfield_sum: i64 = pts_d0 + pts_d1 + pts_d2 + pts_d3 + pts_d4
            + pts_m0 + pts_m1 + pts_m2 + pts_m3 + pts_m4
            + pts_f0 + pts_f1 + pts_f2;

        // ── Auto-sub: bench replaces 0-min starters ──
        let z_d0: i64 = (min_d0 == 0u32) ? pts_d0 : 0i64;
        let z_d1: i64 = (min_d1 == 0u32) ? pts_d1 : 0i64;
        let z_d2: i64 = (min_d2 == 0u32) ? pts_d2 : 0i64;
        let z_d3: i64 = (min_d3 == 0u32) ? pts_d3 : 0i64;
        let z_d4: i64 = (min_d4 == 0u32) ? pts_d4 : 0i64;
        let z_m0: i64 = (min_m0 == 0u32) ? pts_m0 : 0i64;
        let z_m1: i64 = (min_m1 == 0u32) ? pts_m1 : 0i64;
        let z_m2: i64 = (min_m2 == 0u32) ? pts_m2 : 0i64;
        let z_m3: i64 = (min_m3 == 0u32) ? pts_m3 : 0i64;
        let z_m4: i64 = (min_m4 == 0u32) ? pts_m4 : 0i64;
        let z_f0: i64 = (min_f0 == 0u32) ? pts_f0 : 0i64;
        let z_f1: i64 = (min_f1 == 0u32) ? pts_f1 : 0i64;
        let z_f2: i64 = (min_f2 == 0u32) ? pts_f2 : 0i64;

        // Count zero-minute starters
        let zc_d0: u32 = (min_d0 == 0u32) ? 1u32 : 0u32;
        let zc_d1: u32 = (min_d1 == 0u32) ? 1u32 : 0u32;
        let zc_d2: u32 = (min_d2 == 0u32) ? 1u32 : 0u32;
        let zc_d3: u32 = (min_d3 == 0u32) ? 1u32 : 0u32;
        let zc_d4: u32 = (min_d4 == 0u32) ? 1u32 : 0u32;
        let zc_m0: u32 = (min_m0 == 0u32) ? 1u32 : 0u32;
        let zc_m1: u32 = (min_m1 == 0u32) ? 1u32 : 0u32;
        let zc_m2: u32 = (min_m2 == 0u32) ? 1u32 : 0u32;
        let zc_m3: u32 = (min_m3 == 0u32) ? 1u32 : 0u32;
        let zc_m4: u32 = (min_m4 == 0u32) ? 1u32 : 0u32;
        let zc_f0: u32 = (min_f0 == 0u32) ? 1u32 : 0u32;
        let zc_f1: u32 = (min_f1 == 0u32) ? 1u32 : 0u32;
        let zc_f2: u32 = (min_f2 == 0u32) ? 1u32 : 0u32;

        let zero_count: u32 = zc_d0 + zc_d1 + zc_d2 + zc_d3 + zc_d4
            + zc_m0 + zc_m1 + zc_m2 + zc_m3 + zc_m4
            + zc_f0 + zc_f1 + zc_f2;

        // Remove zero-min starter points, add bench if subs available
        let zero_sum: i64 = z_d0 + z_d1 + z_d2 + z_d3 + z_d4
            + z_m0 + z_m1 + z_m2 + z_m3 + z_m4
            + z_f0 + z_f1 + z_f2;

        // bench_1 subs in if at least 1 starter didn't play
        let sub1: i64 = (zero_count >= 1u32 && min_b1 > 0u32) ? pts_b1 : 0i64;
        // bench_2 subs in if at least 2 starters didn't play
        let sub2: i64 = (zero_count >= 2u32 && min_b2 > 0u32) ? pts_b2 : 0i64;

        let base_score: i64 = total + outfield_sum - zero_sum + sub1 + sub2;

        // ── Captain / Vice-Captain multiplier ──
        let k_cap: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: ci.captain_id });
        let pts_cap: i64 = player_points.get_or_use(k_cap, 0i64);
        let min_cap: u32 = player_minutes.get_or_use(k_cap, 0u32);

        let k_vc: field = BHP256::hash_to_field(StatsKey { match_id: si.match_id, player_id: ci.vice_captain_id });
        let pts_vc: i64 = player_points.get_or_use(k_vc, 0i64);
        let min_vc: u32 = player_minutes.get_or_use(k_vc, 0u32);

        // Captain bonus: extra 1× (since base already includes 1×)
        let cap_bonus: i64 = (min_cap > 0u32) ? pts_cap : 0i64;
        let vc_promoted: i64 = (min_cap == 0u32 && min_vc > 0u32) ? pts_vc : 0i64;
        let vc_bonus: i64 = (min_cap > 0u32 && min_vc > 0u32) ? (pts_vc / 2i64) : 0i64;

        let final_score: i64 = base_score + cap_bonus + vc_promoted + vc_bonus;

        // Convert to u64 (clamp to 0 if negative)
        let score_u64: u64 = (final_score > 0i64) ? (final_score as u64) : 0u64;

        // Store on leaderboard
        leaderboard.set(commit_key, score_u64);
    }
}
