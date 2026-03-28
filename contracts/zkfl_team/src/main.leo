// ═══════════════════════════════════════════════════════════
// zkfl_team_v2.aleo — Private team drafting & commitment
// ═══════════════════════════════════════════════════════════

import zkfl_match.aleo;

program zkfl_team_v2.aleo {

    // ── Structs ──

    struct TeamData {
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
        captain_id: u32,
        vice_captain_id: u32,
    }

    struct CommitKey {
        contest_id: field,
        player: address,
    }

    struct PriceKey {
        match_id: field,
        player_id: u32,
    }

    // ── Records ──

    record TeamRecord {
        owner: address,
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
        formation: u8,
        captain_id: u32,
        vice_captain_id: u32,
        team_hash: field,
    }

    // ── Mappings ──

    mapping team_commitments: field => field;
    mapping salary_caps: field => u128;
    mapping player_prices: field => u128;
    mapping player_clubs: u32 => u32;
    mapping match_clubs: field => u64;

    // ── Constructor ──

    @noupgrade
    async constructor() {}

    // ── Admin: set player price for a match ──

    async transition set_player_price(
        match_id: field,
        player_id: u32,
        price: u128,
    ) -> Future {
        return finalize_set_player_price(match_id, player_id, price, self.caller);
    }

    async function finalize_set_player_price(
        match_id: field,
        player_id: u32,
        price: u128,
        caller: address,
    ) {
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        let key: field = BHP256::hash_to_field(PriceKey { match_id, player_id });
        player_prices.set(key, price);
    }

    // ── Admin: set player club ──

    async transition set_player_club(
        player_id: u32,
        club_id: u32,
    ) -> Future {
        return finalize_set_player_club(player_id, club_id, self.caller);
    }

    async function finalize_set_player_club(
        player_id: u32,
        club_id: u32,
        caller: address,
    ) {
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        player_clubs.set(player_id, club_id);
    }

    // ── Admin: set match clubs ──

    async transition set_match_clubs(
        match_id: field,
        home_club: u32,
        away_club: u32,
    ) -> Future {
        return finalize_set_match_clubs(match_id, home_club, away_club, self.caller);
    }

    async function finalize_set_match_clubs(
        match_id: field,
        home_club: u32,
        away_club: u32,
        caller: address,
    ) {
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        let packed: u64 = (home_club as u64) * 4294967296u64 + (away_club as u64);
        match_clubs.set(match_id, packed);
    }

    // ── Admin: set salary cap ──

    async transition set_salary_cap(
        contest_id: field,
        cap: u128,
    ) -> Future {
        return finalize_set_salary_cap(contest_id, cap, self.caller);
    }

    async function finalize_set_salary_cap(
        contest_id: field,
        cap: u128,
        caller: address,
    ) {
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        salary_caps.set(contest_id, cap);
    }

    // ── User: draft a private team ──
    // Uses TeamData struct to stay within 16-param limit.

    async transition draft_team(
        contest_id: field,
        match_id: field,
        team: TeamData,
        formation: u8,
    ) -> (TeamRecord, Future) {
        assert(formation <= 7u8);

        let team_hash: field = BHP256::hash_to_field(team);

        let t: TeamRecord = TeamRecord {
            owner: self.signer,
            contest_id,
            match_id,
            gk: team.gk,
            def_0: team.def_0,
            def_1: team.def_1,
            def_2: team.def_2,
            def_3: team.def_3,
            def_4: team.def_4,
            mid_0: team.mid_0,
            mid_1: team.mid_1,
            mid_2: team.mid_2,
            mid_3: team.mid_3,
            mid_4: team.mid_4,
            fwd_0: team.fwd_0,
            fwd_1: team.fwd_1,
            fwd_2: team.fwd_2,
            bench_1: team.bench_1,
            bench_2: team.bench_2,
            formation,
            captain_id: team.captain_id,
            vice_captain_id: team.vice_captain_id,
            team_hash,
        };

        return (t, finalize_draft_team(
            contest_id, match_id, self.signer, team_hash, team,
        ));
    }

    async function finalize_draft_team(
        contest_id: field,
        match_id: field,
        caller: address,
        team_hash: field,
        team: TeamData,
    ) {
        // Salary cap: sum all 16 player prices
        let cap: u128 = salary_caps.get(contest_id);

        let p0: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.gk }));
        let p1: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.def_0 }));
        let p2: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.def_1 }));
        let p3: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.def_2 }));
        let p4: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.def_3 }));
        let p5: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.def_4 }));
        let p6: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.mid_0 }));
        let p7: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.mid_1 }));
        let p8: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.mid_2 }));
        let p9: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.mid_3 }));
        let p10: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.mid_4 }));
        let p11: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.fwd_0 }));
        let p12: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.fwd_1 }));
        let p13: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.fwd_2 }));
        let p14: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.bench_1 }));
        let p15: u128 = player_prices.get(BHP256::hash_to_field(PriceKey { match_id, player_id: team.bench_2 }));

        let total: u128 = p0 + p1 + p2 + p3 + p4 + p5
            + p6 + p7 + p8 + p9 + p10
            + p11 + p12 + p13 + p14 + p15;

        assert(total <= cap);

        // Club limits: min 3 from each team (relaxed for dummy slots)
        // Dummy player 0 has club_id=0 which won't match home_id (1+)
        // So dummies don't count as home. Only real players count.
        let packed_clubs: u64 = match_clubs.get(match_id);
        let home_id: u32 = (packed_clubs / 4294967296u64) as u32;

        let h0: u32 = (player_clubs.get(team.gk) == home_id) ? 1u32 : 0u32;
        let h1: u32 = (player_clubs.get(team.def_0) == home_id) ? 1u32 : 0u32;
        let h2: u32 = (player_clubs.get(team.def_1) == home_id) ? 1u32 : 0u32;
        let h3: u32 = (player_clubs.get(team.def_2) == home_id) ? 1u32 : 0u32;
        let h4: u32 = (player_clubs.get(team.def_3) == home_id) ? 1u32 : 0u32;
        let h5: u32 = (player_clubs.get(team.def_4) == home_id) ? 1u32 : 0u32;
        let h6: u32 = (player_clubs.get(team.mid_0) == home_id) ? 1u32 : 0u32;
        let h7: u32 = (player_clubs.get(team.mid_1) == home_id) ? 1u32 : 0u32;
        let h8: u32 = (player_clubs.get(team.mid_2) == home_id) ? 1u32 : 0u32;
        let h9: u32 = (player_clubs.get(team.mid_3) == home_id) ? 1u32 : 0u32;
        let h10: u32 = (player_clubs.get(team.mid_4) == home_id) ? 1u32 : 0u32;
        let h11: u32 = (player_clubs.get(team.fwd_0) == home_id) ? 1u32 : 0u32;
        let h12: u32 = (player_clubs.get(team.fwd_1) == home_id) ? 1u32 : 0u32;
        let h13: u32 = (player_clubs.get(team.fwd_2) == home_id) ? 1u32 : 0u32;
        let h14: u32 = (player_clubs.get(team.bench_1) == home_id) ? 1u32 : 0u32;
        let h15: u32 = (player_clubs.get(team.bench_2) == home_id) ? 1u32 : 0u32;

        let home_count: u32 = h0 + h1 + h2 + h3 + h4 + h5
            + h6 + h7 + h8 + h9 + h10
            + h11 + h12 + h13 + h14 + h15;

        // At least 3 from home team, at most 10 (leaves room for away + dummies)
        assert(home_count >= 3u32);
        assert(home_count <= 10u32);

        // Store commitment
        let key: field = BHP256::hash_to_field(CommitKey { contest_id, player: caller });
        team_commitments.set(key, team_hash);
    }
}
