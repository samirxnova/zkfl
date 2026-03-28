// ═══════════════════════════════════════════════════════════
// zkfl_match.aleo — Match registration + contest management
// ═══════════════════════════════════════════════════════════

program zkfl_match.aleo {

    // ── Structs ──

    struct MatchInfo {
        home_club: u32,
        away_club: u32,
        kickoff_block: u32,
        is_active: bool,
    }

    struct ContestInfo {
        match_id: field,
        entry_fee: u128,
        max_entries: u32,
        prize_split: u32,       // encoded: 60_25_15
        contest_type: u8,       // 0=free, 1=classic, 2=user, 3=h2h
        deadline_block: u32,
        creator: address,
        is_open: bool,
    }

    struct ContestSeed {
        match_id: field,
        creator: address,
        fee: u128,
        nonce: field,
    }

    // ── Mappings ──

    mapping matches: field => MatchInfo;
    mapping contests: field => ContestInfo;
    mapping contest_entry_count: field => u32;
    mapping invite_codes: field => field;

    // ── Constructor ──

    @noupgrade
    async constructor() {}

    // ── Admin: register a real match ──

    async transition register_match(
        match_id: field,
        home: u32,
        away: u32,
        kickoff_block: u32,
    ) -> Future {
        return finalize_register_match(match_id, home, away, kickoff_block, self.caller);
    }

    async function finalize_register_match(
        match_id: field,
        home: u32,
        away: u32,
        kickoff: u32,
        caller: address,
    ) {
        assert_eq(caller, self.program_owner);
        matches.set(match_id, MatchInfo {
            home_club: home,
            away_club: away,
            kickoff_block: kickoff,
            is_active: true,
        });
    }

    // ── Admin: create public contest (free / classic) ──

    async transition create_contest(
        match_id: field,
        entry_fee: u128,
        max_entries: u32,
        prize_split: u32,
        contest_type: u8,
        deadline_block: u32,
        nonce: field,
    ) -> (field, Future) {
        let contest_id: field = BHP256::hash_to_field(
            ContestSeed { match_id, creator: self.caller, fee: entry_fee, nonce }
        );
        return (contest_id, finalize_create_contest(
            contest_id, match_id, entry_fee, max_entries,
            prize_split, contest_type, deadline_block, self.caller,
        ));
    }

    async function finalize_create_contest(
        contest_id: field,
        match_id: field,
        fee: u128,
        max: u32,
        split: u32,
        ctype: u8,
        deadline: u32,
        caller: address,
    ) {
        assert_eq(caller, self.program_owner);
        let m: MatchInfo = matches.get(match_id);
        assert(m.is_active);

        contests.set(contest_id, ContestInfo {
            match_id,
            entry_fee: fee,
            max_entries: max,
            prize_split: split,
            contest_type: ctype,
            deadline_block: deadline,
            creator: caller,
            is_open: true,
        });
        contest_entry_count.set(contest_id, 0u32);
    }

    // ── User: create private contest (2-10 players) ──

    async transition create_user_contest(
        match_id: field,
        entry_fee: u128,
        max_entries: u32,
        prize_split: u32,
        invite_hash: field,
        nonce: field,
    ) -> (field, Future) {
        assert(max_entries >= 2u32);
        assert(max_entries <= 10u32);

        let contest_id: field = BHP256::hash_to_field(
            ContestSeed { match_id, creator: self.caller, fee: entry_fee, nonce }
        );

        return (contest_id, finalize_create_user_contest(
            contest_id, match_id, entry_fee, max_entries,
            prize_split, invite_hash, self.caller,
        ));
    }

    async function finalize_create_user_contest(
        contest_id: field,
        match_id: field,
        fee: u128,
        max: u32,
        split: u32,
        invite: field,
        creator: address,
    ) {
        let m: MatchInfo = matches.get(match_id);
        assert(m.is_active);

        contests.set(contest_id, ContestInfo {
            match_id,
            entry_fee: fee,
            max_entries: max,
            prize_split: split,
            contest_type: 2u8,
            deadline_block: m.kickoff_block,
            creator,
            is_open: true,
        });
        invite_codes.set(contest_id, invite);
        contest_entry_count.set(contest_id, 1u32);
    }

    // ── Admin: close contest ──

    async transition close_contest(contest_id: field) -> Future {
        return finalize_close_contest(contest_id, self.caller);
    }

    async function finalize_close_contest(contest_id: field, caller: address) {
        assert_eq(caller, self.program_owner);
        let c: ContestInfo = contests.get(contest_id);
        contests.set(contest_id, ContestInfo {
            match_id: c.match_id,
            entry_fee: c.entry_fee,
            max_entries: c.max_entries,
            prize_split: c.prize_split,
            contest_type: c.contest_type,
            deadline_block: c.deadline_block,
            creator: c.creator,
            is_open: false,
        });
    }
}
