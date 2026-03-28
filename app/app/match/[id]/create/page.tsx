"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import Link from "next/link";
import { getMatch, createContest } from "../../../lib/api";
import { formatCredits, PROGRAMS, DEFAULT_FEE, toField, toU128 } from "../../../lib/aleo";
import type { Match } from "../../../types";

const PRIZE_PRESETS: { label: string; split: Record<string, number> }[] = [
  { label: "Winner Takes All", split: { "1": 100 } },
  { label: "Top 2 (70/30)", split: { "1": 70, "2": 30 } },
  { label: "Top 3 (60/25/15)", split: { "1": 60, "2": 25, "3": 15 } },
];

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function hashInviteCode(code: string): string {
  // Simple numeric hash for Leo field type
  let hash = 0;
  for (let i = 0; i < code.length; i++) {
    hash = ((hash << 5) - hash + code.charCodeAt(i)) >>> 0;
  }
  return hash.toString();
}

export default function CreateContestPage() {
  const { id } = useParams();
  const matchId = Number(id);
  const router = useRouter();
  const { connected, address, executeTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [match, setMatch] = useState<Match | null>(null);
  const [contestType, setContestType] = useState<"user" | "h2h">("user");
  const [entryFee, setEntryFee] = useState(5);
  const [maxEntries, setMaxEntries] = useState(5);
  const [prizeSplitIdx, setPrizeSplitIdx] = useState(0);
  const [creating, setCreating] = useState(false);
  const [inviteCode, setInviteCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getMatch(matchId).then(setMatch).catch(console.error);
  }, [matchId]);

  if (!match) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const feeCredits = entryFee * 1_000_000;
  const prizeSplit = PRIZE_PRESETS[prizeSplitIdx].split;

  // Encode prize split as u32: e.g. {1:60, 2:25, 3:15} => 60_025_015 => 60025015
  function encodePrizeSplit(split: Record<string, number>): number {
    const parts = Object.values(split);
    if (parts.length === 1) return parts[0] * 1000000;
    if (parts.length === 2) return parts[0] * 1000 + parts[1];
    return parts[0] * 1000000 + parts[1] * 1000 + parts[2];
  }

  async function handleCreate() {
    if (!connected || !executeTransaction || !address) {
      setVisible(true);
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const code = generateInviteCode();
      const inviteHash = hashInviteCode(code);
      const nonce = Math.floor(Math.random() * 1_000_000_000);
      const matchOnChainId = match!.on_chain_match_id.replace("field", "");
      const splitEncoded = encodePrizeSplit(prizeSplit);

      // Call on-chain: create_user_contest
      const result = await executeTransaction({
        program: PROGRAMS.match,
        function: "create_user_contest",
        inputs: [
          toField(matchOnChainId),
          toU128(feeCredits),
          `${maxEntries}u32`,
          `${splitEncoded}u32`,
          `${inviteHash}field`,
          `${nonce}field`,
        ],
        fee: DEFAULT_FEE,
        privateFee: false,
      });

      const txId = result?.transactionId;

      // Record in backend
      const contest = await createContest({
        match_id: matchId,
        contest_type: contestType,
        entry_fee_credits: feeCredits,
        max_entries: maxEntries,
        prize_split: prizeSplit,
        invite_code: code,
        on_chain_id: txId ?? undefined,
        creator_address: address,
      });

      setInviteCode(code);

      // Redirect to the new contest after a moment
      setTimeout(() => {
        router.push(`/contest/${contest.id}`);
      }, 3000);
    } catch (err) {
      console.error("Create contest failed:", err);
      setError(err instanceof Error ? err.message : "Failed to create contest");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link href={`/match/${matchId}`} className="text-sm text-[var(--accent)] hover:underline">
        &larr; Back to match
      </Link>

      <h1 className="mt-4 text-2xl font-bold">Create Private Contest</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">
        {match.home_club.short_name} vs {match.away_club.short_name}
      </p>

      <div className="mt-8 space-y-6">
        {/* Contest Type */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Contest Type</label>
          <div className="flex gap-2">
            <button
              onClick={() => { setContestType("user"); if (maxEntries < 3) setMaxEntries(3); }}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                contestType === "user"
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Group (3-10)
            </button>
            <button
              onClick={() => { setContestType("h2h"); setMaxEntries(2); setPrizeSplitIdx(0); }}
              className={`flex-1 rounded-lg py-3 text-sm font-medium transition ${
                contestType === "h2h"
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Head-to-Head (2)
            </button>
          </div>
        </div>

        {/* Entry Fee */}
        <div>
          <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
            Entry Fee (Credits)
          </label>
          <div className="flex gap-2">
            {[0, 1, 5, 10, 25].map((fee) => (
              <button
                key={fee}
                onClick={() => setEntryFee(fee)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  entryFee === fee
                    ? "bg-[var(--accent)] text-black"
                    : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                }`}
              >
                {fee === 0 ? "FREE" : `$${fee}`}
              </button>
            ))}
          </div>
        </div>

        {/* Max Entries (Group only) */}
        {contestType === "user" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">
              Max Players: {maxEntries}
            </label>
            <input
              type="range"
              min={3}
              max={10}
              value={maxEntries}
              onChange={(e) => setMaxEntries(Number(e.target.value))}
              className="w-full accent-[var(--accent)]"
            />
            <div className="mt-1 flex justify-between text-xs text-[var(--text-secondary)]">
              <span>3</span>
              <span>10</span>
            </div>
          </div>
        )}

        {/* Prize Split */}
        {contestType === "user" && (
          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-secondary)]">Prize Split</label>
            <div className="space-y-2">
              {PRIZE_PRESETS.map((preset, i) => (
                <button
                  key={preset.label}
                  onClick={() => setPrizeSplitIdx(i)}
                  className={`w-full rounded-lg px-4 py-3 text-left text-sm transition ${
                    prizeSplitIdx === i
                      ? "bg-[var(--accent)]/20 border border-[var(--accent)] text-[var(--text-primary)]"
                      : "bg-[var(--bg-card)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}
                >
                  <span className="font-medium">{preset.label}</span>
                  <span className="ml-2 text-xs">
                    ({Object.entries(preset.split).map(([k, v]) => `#${k}: ${v}%`).join(", ")})
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Summary */}
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5">
          <h3 className="text-sm font-semibold mb-3">Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Type</span>
              <span>{contestType === "h2h" ? "Head-to-Head" : "Group"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Entry Fee</span>
              <span>{entryFee === 0 ? "FREE" : formatCredits(feeCredits)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Max Players</span>
              <span>{maxEntries}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[var(--text-secondary)]">Max Pool</span>
              <span className="text-[var(--accent)] font-bold">
                {entryFee === 0 ? "FREE" : formatCredits(feeCredits * maxEntries)}
              </span>
            </div>
          </div>
        </div>

        {/* Invite Code Display */}
        {inviteCode && (
          <div className="rounded-xl border-2 border-[var(--accent)] bg-[var(--accent)]/10 p-5 text-center">
            <p className="text-sm text-[var(--text-secondary)] mb-2">Share this invite code with friends:</p>
            <p className="text-3xl font-mono font-bold tracking-widest text-[var(--accent)]">{inviteCode}</p>
            <button
              onClick={() => navigator.clipboard.writeText(inviteCode)}
              className="mt-3 text-xs text-[var(--accent)] hover:underline"
            >
              Copy to clipboard
            </button>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {error}
          </div>
        )}

        {/* Create Button */}
        <button
          onClick={handleCreate}
          disabled={creating || !!inviteCode}
          className={`w-full rounded-lg py-3 text-sm font-bold transition ${
            creating || inviteCode
              ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
              : "bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)]"
          }`}
        >
          {creating
            ? "Creating Contest..."
            : inviteCode
            ? "Contest Created! Redirecting..."
            : connected
            ? "Create Contest On-Chain"
            : "Connect Wallet to Create"}
        </button>
      </div>
    </div>
  );
}
