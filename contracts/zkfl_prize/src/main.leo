// ═══════════════════════════════════════════════════════════
// zkfl_prize_v2.aleo — Entry fees, escrow & payouts in Aleo credits
// ═══════════════════════════════════════════════════════════
//
// Replaces USDCx stablecoin with native Aleo credits.
// Users pay entry fees from their PUBLIC credit balance.
// Program accumulates credits as escrow, pays winners directly.

import zkfl_match.aleo;
import credits.aleo;

program zkfl_prize_v2.aleo {

    // ── Structs ──

    struct EntryKey {
        contest_id: field,
        player: address,
    }

    // ── Mappings ──

    mapping prize_pools: field => u64;      // contest_id => total microcredits
    mapping entry_count: field => u32;      // contest_id => number of entries
    mapping entries: field => bool;         // hash(contest_id, player) => entered
    mapping claims: field => bool;          // hash(contest_id, player) => claimed prize

    // ── Constructor ──

    @noupgrade
    async constructor() {}

    // ── User: enter paid contest ──
    // Transfers entry fee from user's PUBLIC credit balance to program escrow.
    // Uses transfer_public_as_signer so the signer (user) pays, not the caller.

    async transition enter_contest(
        contest_id: field,
        amount: u64,
    ) -> Future {
        let pay: Future = credits.aleo/transfer_public_as_signer(
            self.address,   // program address holds escrow
            amount,
        );
        return finalize_enter(contest_id, self.signer, amount, pay);
    }

    async function finalize_enter(
        contest_id: field,
        player: address,
        amount: u64,
        f0: Future,
    ) {
        f0.await();
        let contest: ContestInfo = zkfl_match.aleo/contests.get(contest_id);
        assert(contest.is_open);
        assert_eq(amount as u128, contest.entry_fee);

        let key: field = BHP256::hash_to_field(EntryKey { contest_id, player });
        assert(!entries.get_or_use(key, false));

        let count: u32 = entry_count.get_or_use(contest_id, 0u32);
        assert(count < contest.max_entries);

        entries.set(key, true);
        entry_count.set(contest_id, count + 1u32);
        let pool: u64 = prize_pools.get_or_use(contest_id, 0u64);
        prize_pools.set(contest_id, pool + amount);
    }

    // ── User: enter free contest (no credit transfer) ──

    async transition enter_free_contest(
        contest_id: field,
    ) -> Future {
        return finalize_enter_free(contest_id, self.signer);
    }

    async function finalize_enter_free(
        contest_id: field,
        player: address,
    ) {
        let contest: ContestInfo = zkfl_match.aleo/contests.get(contest_id);
        assert(contest.is_open);
        assert_eq(contest.entry_fee, 0u128);

        let key: field = BHP256::hash_to_field(EntryKey { contest_id, player });
        assert(!entries.get_or_use(key, false));

        let count: u32 = entry_count.get_or_use(contest_id, 0u32);
        assert(count < contest.max_entries);

        entries.set(key, true);
        entry_count.set(contest_id, count + 1u32);
    }

    // ── Admin: pay winner from program escrow ──
    // Sends credits from program's public balance to winner's public balance.

    async transition pay_winner(
        contest_id: field,
        winner: address,
        amount: u64,
    ) -> Future {
        let pay: Future = credits.aleo/transfer_public(winner, amount);
        return finalize_pay(contest_id, winner, self.caller, pay);
    }

    async function finalize_pay(
        contest_id: field,
        winner: address,
        caller: address,
        f0: Future,
    ) {
        f0.await();
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        let key: field = BHP256::hash_to_field(EntryKey { contest_id, player: winner });
        assert(!claims.get_or_use(key, false));
        claims.set(key, true);
    }

    // ── Admin: refund a player ──

    async transition refund(
        contest_id: field,
        player: address,
        amount: u64,
    ) -> Future {
        let pay: Future = credits.aleo/transfer_public(player, amount);
        return finalize_refund(contest_id, player, self.caller, pay);
    }

    async function finalize_refund(
        contest_id: field,
        player: address,
        caller: address,
        f0: Future,
    ) {
        f0.await();
        assert_eq(caller, Program::program_owner(zkfl_match.aleo));
        let key: field = BHP256::hash_to_field(EntryKey { contest_id, player });
        entries.set(key, false);
    }
}
