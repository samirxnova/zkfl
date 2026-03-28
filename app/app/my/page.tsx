"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import Link from "next/link";
import { useAuth } from "../components/AuthProvider";
import { getUserContests, getUserStats } from "../lib/api";
import { formatCredits } from "../lib/aleo";

interface UserEntry {
  user_address: string;
  contest_id: string;
  team_hash: string;
  score: number | null;
  rank: number | null;
  prize_won_credits: string;
  contest: {
    id: string;
    on_chain_id: string;
    contest_type: string;
    entry_fee_credits: number;
    status: string;
    match: {
      kickoff: string;
      status: string;
      home_club: { short_name: string };
      away_club: { short_name: string };
    };
  };
}

interface UserStatsData {
  total_contests: number;
  total_wins: number;
  total_earnings_credits: number;
  best_score: number | null;
}

export default function MyContestsPage() {
  const { connected, address } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, loading: authLoading, updateUsername } = useAuth();
  const [entries, setEntries] = useState<UserEntry[]>([]);
  const [stats, setStats] = useState<UserStatsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [newUsername, setNewUsername] = useState("");
  const [nameError, setNameError] = useState("");

  useEffect(() => {
    if (connected && address) {
      setLoading(true);
      Promise.all([
        getUserContests(address).then((data) => setEntries(data as unknown as UserEntry[])),
        getUserStats(address).then(setStats),
      ])
        .catch(console.error)
        .finally(() => setLoading(false));
    }
  }, [connected, address]);

  async function handleSaveUsername() {
    setNameError("");
    try {
      await updateUsername(newUsername);
      setEditingName(false);
    } catch (err: unknown) {
      setNameError(err instanceof Error ? err.message : "Failed to update username");
    }
  }

  if (!connected) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <p className="text-[var(--text-secondary)] mb-6">Connect your wallet to view your profile and contests</p>
        <button
          onClick={() => setVisible(true)}
          className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-black hover:bg-[var(--accent-dim)] transition"
        >
          Connect Wallet
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* Profile Card */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)]/20 text-2xl font-bold text-[var(--accent)]">
              {(user?.username ?? address ?? "?")[0].toUpperCase()}
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Enter username"
                    className="rounded-lg border border-[var(--border)] bg-[var(--bg-secondary)] px-3 py-1.5 text-sm text-[var(--text-primary)] outline-none focus:border-[var(--accent)]"
                    maxLength={32}
                    autoFocus
                  />
                  <button
                    onClick={handleSaveUsername}
                    className="rounded-lg bg-[var(--accent)] px-3 py-1.5 text-xs font-bold text-black"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => { setEditingName(false); setNameError(""); }}
                    className="rounded-lg border border-[var(--border)] px-3 py-1.5 text-xs text-[var(--text-secondary)]"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold">
                    {user?.username ?? "Anonymous"}
                  </h2>
                  <button
                    onClick={() => { setEditingName(true); setNewUsername(user?.username ?? ""); }}
                    className="text-xs text-[var(--accent)] hover:underline"
                  >
                    {user?.username ? "edit" : "set username"}
                  </button>
                </div>
              )}
              {nameError && <p className="text-xs text-red-400 mt-1">{nameError}</p>}
              <p className="mt-0.5 font-mono text-xs text-[var(--text-secondary)]">
                {address?.slice(0, 16)}...{address?.slice(-8)}
              </p>
              {user?.created_at && (
                <p className="text-xs text-[var(--text-secondary)]">
                  Joined {new Date(user.created_at).toLocaleDateString()}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats Row */}
        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">{stats.total_contests}</p>
              <p className="text-xs text-[var(--text-secondary)]">Contests</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--accent)]">{stats.total_wins}</p>
              <p className="text-xs text-[var(--text-secondary)]">Wins</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--text-primary)]">
                {stats.best_score ?? "-"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Best Score</p>
            </div>
            <div className="rounded-lg bg-[var(--bg-secondary)] p-3 text-center">
              <p className="text-2xl font-bold text-[var(--accent)]">
                {stats.total_earnings_credits > 0 ? formatCredits(stats.total_earnings_credits) : "-"}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">Earnings</p>
            </div>
          </div>
        )}
      </div>

      {/* Contests List */}
      <h2 className="text-xl font-bold mb-4">My Contests</h2>

      {loading || authLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : entries.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <p className="text-lg text-[var(--text-secondary)]">No contests entered yet</p>
          <Link href="/" className="mt-4 inline-block text-sm text-[var(--accent)] hover:underline">
            Browse matches to enter a contest
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry) => (
            <Link key={entry.contest_id} href={`/contest/${entry.contest_id}`}>
              <div className="card-hover rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 mb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">
                      {entry.contest?.match?.home_club?.short_name} vs {entry.contest?.match?.away_club?.short_name}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs text-[var(--accent)] uppercase">
                        {entry.contest?.contest_type}
                      </span>
                      <span className="text-xs text-[var(--text-secondary)]">
                        {entry.contest?.match?.status === "FT" ? "Finished" : entry.contest?.status}
                      </span>
                    </div>
                  </div>
                  <div className="text-right">
                    {entry.score !== null ? (
                      <p className="text-2xl font-bold text-[var(--accent)]">{entry.score}</p>
                    ) : (
                      <p className="text-sm text-[var(--text-secondary)]">Pending</p>
                    )}
                    {entry.rank && (
                      <p className="text-xs text-[var(--text-secondary)]">Rank #{entry.rank}</p>
                    )}
                    {entry.prize_won_credits !== "0" && (
                      <p className="text-xs text-[var(--accent)]">Won: {formatCredits(entry.prize_won_credits)}</p>
                    )}
                  </div>
                </div>
                <div className="mt-3 border-t border-[var(--border)] pt-2">
                  <p className="font-mono text-xs text-[var(--text-secondary)]">
                    Team Hash: {entry.team_hash.slice(0, 20)}...
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
