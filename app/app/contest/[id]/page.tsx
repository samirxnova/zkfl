"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { useWalletModal } from "@provablehq/aleo-wallet-adaptor-react-ui";
import { getContest, getLeaderboard, getMatchPlayers } from "../../lib/api";
import { formatCredits } from "../../lib/aleo";
import { useAleoTransaction } from "../../hooks/useAleoTransaction";
import { TeamBuilder } from "../../components/TeamBuilder";
import type { Contest, Player, Entry } from "../../types";

export default function ContestPage() {
  const { id } = useParams();
  const contestId = id as string;
  const { connected, address, requestRecords } = useWallet();
  const { execute, waitForConfirmation, PROGRAMS } = useAleoTransaction();
  const { setVisible } = useWalletModal();
  const [contest, setContest] = useState<Contest | null>(null);
  const [leaderboard, setLeaderboard] = useState<Entry[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<"draft" | "leaderboard" | null>(null);
  const [computingScore, setComputingScore] = useState(false);
  const [scoreStatus, setScoreStatus] = useState<string | null>(null);
  const [scoreTxId, setScoreTxId] = useState<string | null>(null);

  useEffect(() => {
    getContest(contestId).then((c) => {
      setContest(c);
      if (c.match_id) {
        getMatchPlayers(c.match_id).then(setPlayers).catch(console.error);
      }
    }).catch(console.error);
    getLeaderboard(contestId).then(setLeaderboard).catch(console.error);
  }, [contestId]);

  if (!contest) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const match = contest.match;
  const isFinished = match?.status === "FT";
  const isResolved = match?.is_resolved;
  const canDraft = contest.status === "open" && !isFinished;

  // Default tab based on contest state
  const activeTab = tab ?? (canDraft ? "draft" : "leaderboard");

  // Check if user already has a score
  const userEntry = leaderboard.find((e) => e.user_address === address);
  const hasScore = userEntry?.score !== null && userEntry?.score !== undefined;

  async function handleComputeScore() {
    if (!connected) {
      setVisible(true);
      return;
    }

    setComputingScore(true);
    setScoreStatus("Fetching your team record from wallet...");
    try {
      // Fetch user's TeamRecord from wallet
      const records = await requestRecords(PROGRAMS.team, true);
      console.log("[ComputeScore] Records:", records.length, "Looking for:", contest!.on_chain_id);

      // Find the unspent record matching this contest
      const contestId = contest!.on_chain_id;
      const teamRecord = (records as { recordPlaintext?: string; spent?: boolean }[]).find((r) => {
        if (r.spent) return false;
        return r.recordPlaintext?.includes(contestId) ?? false;
      });

      if (!teamRecord || !teamRecord.recordPlaintext) {
        setScoreStatus(`No team record found (${records.length} records checked). Did you draft a team?`);
        return;
      }

      const recordInput = teamRecord.recordPlaintext;
      setScoreStatus("Submitting ZK proof...");
      const result = await execute(PROGRAMS.scoring, "compute_score", [recordInput]);
      const txId = result?.transactionId;

      if (!txId) {
        setScoreStatus("Transaction cancelled or failed.");
        return;
      }

      setScoreTxId(txId);
      setScoreStatus("Waiting for on-chain confirmation...");

      const confirmResult = await waitForConfirmation(txId);
      if (confirmResult.onChainId) setScoreTxId(confirmResult.onChainId);

      if (confirmResult.status === "accepted") {
        setScoreStatus("Confirmed! Syncing score...");
        const realTxId = confirmResult.onChainId ?? txId;
        // Send score tx to backend so it can extract the score from the transaction
        try {
          const API = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";
          await fetch(`${API}/contests/${contestId}/submit-score`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ user_address: address, tx_id: realTxId }),
          });
        } catch { /* ignore sync errors */ }
        // Refresh leaderboard
        await getLeaderboard(contestId).then(setLeaderboard);
        setScoreStatus(null);
      } else if (confirmResult.status === "failed" || confirmResult.status === "rejected") {
        setScoreStatus(`Score computation ${confirmResult.status}. Make sure the match is resolved and you have a team record.`);
      } else {
        setScoreStatus("Confirmation timed out. Check explorer and refresh the page.");
      }
    } catch (err) {
      console.error("Compute score failed:", err);
      setScoreStatus(err instanceof Error ? err.message : "Compute score failed.");
    } finally {
      setComputingScore(false);
    }
  }

  return (
    <div>
      {/* Contest Header */}
      <div className="mb-6">
        <Link href={`/match/${contest.match_id}`} className="text-sm text-[var(--accent)] hover:underline">
          &larr; Back to match
        </Link>
        <div className="mt-3 flex items-center gap-4">
          <h1 className="text-2xl font-bold">
            {match?.home_club?.short_name} vs {match?.away_club?.short_name}
          </h1>
          <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)] uppercase">
            {contest.contest_type}
          </span>
          {contest.invite_code && (
            <span className="rounded bg-purple-500/20 px-2 py-0.5 text-xs text-purple-300">
              Private
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap gap-6 text-sm text-[var(--text-secondary)]">
          <span>Entry: {contest.entry_fee_credits === 0 ? "FREE" : formatCredits(contest.entry_fee_credits)}</span>
          <span>Pool: {formatCredits(contest.total_pool_credits)}</span>
          <span>{contest.total_entries}/{contest.max_entries} entries</span>
          {contest.invite_code && (
            <span className="font-mono text-[var(--accent)]">Code: {contest.invite_code}</span>
          )}
        </div>
      </div>

      {/* Compute Score Banner */}
      {isFinished && isResolved && connected && !hasScore && (
        <div className="mb-6 rounded-xl border border-[var(--accent)]/30 bg-[var(--accent)]/10 p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold text-[var(--accent)]">Match Resolved!</p>
              <p className="text-sm text-[var(--text-secondary)]">
                Compute your ZK score proof to see your ranking
              </p>
            </div>
            <button
              onClick={handleComputeScore}
              disabled={computingScore}
              className={`rounded-lg px-6 py-2 text-sm font-bold transition ${
                computingScore
                  ? "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
                  : "bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)]"
              }`}
            >
              {computingScore ? (scoreStatus ?? "Computing...") : scoreTxId ? `Done! TX: ${scoreTxId.slice(0, 12)}...` : "Compute Score"}
            </button>
          </div>
        </div>
      )}

      {/* Score status message */}
      {scoreStatus && !computingScore && (
        <div className="mb-6 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
          {scoreStatus}
        </div>
      )}

      {/* Score display if user has computed */}
      {hasScore && (
        <div className="mb-6 rounded-xl border border-[var(--accent)] bg-[var(--accent)]/10 p-5 text-center">
          <p className="text-sm text-[var(--text-secondary)]">Your Score</p>
          <p className="text-4xl font-bold text-[var(--accent)]">{userEntry?.score}</p>
          {userEntry?.rank && <p className="text-sm text-[var(--text-secondary)]">Rank #{userEntry.rank}</p>}
          {userEntry?.prize_won_credits && userEntry.prize_won_credits !== "0" && (
            <p className="mt-1 text-sm font-semibold text-[var(--accent)]">
              Won: {formatCredits(userEntry.prize_won_credits)}
            </p>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
        {canDraft && (
          <button
            onClick={() => setTab("draft")}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
              activeTab === "draft"
                ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            Draft Team
          </button>
        )}
        <button
          onClick={() => setTab("leaderboard")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            activeTab === "leaderboard"
              ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Leaderboard ({leaderboard.length})
        </button>
      </div>

      {/* Content */}
      {activeTab === "draft" && canDraft && (
        connected ? (
          <TeamBuilder
            players={players}
            contest={contest}
            matchId={match?.on_chain_match_id ?? "1field"}
          />
        ) : (
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
            <p className="text-lg text-[var(--text-secondary)] mb-4">Connect your wallet to draft a team</p>
            <button
              onClick={() => setVisible(true)}
              className="rounded-lg bg-[var(--accent)] px-6 py-3 font-semibold text-black hover:bg-[var(--accent-dim)] transition"
            >
              Connect Wallet
            </button>
          </div>
        )
      )}

      {activeTab === "leaderboard" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          {leaderboard.length === 0 ? (
            <div className="p-8 text-center text-[var(--text-secondary)]">
              No scores yet. Scores appear after match is resolved and users compute their ZK proofs.
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-secondary)]">
                  <th className="px-4 py-3 w-12">#</th>
                  <th className="px-4 py-3">Player</th>
                  <th className="px-4 py-3 text-right">Score</th>
                  <th className="px-4 py-3 text-right">Prize</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, i) => (
                  <tr
                    key={entry.user_address}
                    className={`border-b border-[var(--border)]/50 ${
                      entry.user_address === address ? "bg-[var(--accent)]/5" : ""
                    }`}
                  >
                    <td className="px-4 py-3 font-bold text-[var(--accent)]">{i + 1}</td>
                    <td className="px-4 py-3 text-xs">
                      {entry.user_address === address ? (
                        <span className="font-semibold text-[var(--accent)]">You</span>
                      ) : entry.user?.username ? (
                        <span className="font-medium">{entry.user.username}</span>
                      ) : (
                        <span className="font-mono">{entry.user_address.slice(0, 12)}...{entry.user_address.slice(-6)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right font-bold tabular-nums">
                      {entry.score ?? "-"}
                    </td>
                    <td className="px-4 py-3 text-right text-[var(--accent)]">
                      {entry.prize_won_credits !== "0" ? formatCredits(entry.prize_won_credits) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}
