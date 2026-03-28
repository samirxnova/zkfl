"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getMatch, getContests, getMatchPlayers } from "../../lib/api";
import { formatCredits } from "../../lib/aleo";
import type { Match, Contest, Player } from "../../types";

export default function MatchDetailPage() {
  const { id } = useParams();
  const matchId = Number(id);
  const [match, setMatch] = useState<Match | null>(null);
  const [contests, setContests] = useState<Contest[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [tab, setTab] = useState<"contests" | "players">("contests");

  useEffect(() => {
    getMatch(matchId).then(setMatch).catch(console.error);
    getContests(matchId).then(setContests).catch(console.error);
    getMatchPlayers(matchId).then(setPlayers).catch(console.error);
  }, [matchId]);

  if (!match) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
      </div>
    );
  }

  const isFinished = match.status === "FT";

  return (
    <div>
      {/* Match Header */}
      <div className="mb-8 rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8">
        <div className="flex items-center justify-center gap-8">
          <div className="flex items-center gap-4 text-right">
            {match.home_club.crest_url && (
              <img src={match.home_club.crest_url} alt="" className="h-12 w-12" />
            )}
            <div>
              <p className="text-xl font-bold">{match.home_club.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">Home</p>
            </div>
          </div>

          <div className="text-center px-6">
            {isFinished ? (
              <p className="text-4xl font-bold tabular-nums">
                {match.home_score} - {match.away_score}
              </p>
            ) : (
              <p className="text-2xl font-bold text-[var(--text-secondary)]">vs</p>
            )}
            <p className="mt-1 text-xs text-[var(--text-secondary)]">
              {new Date(match.kickoff).toLocaleDateString("en-GB", {
                weekday: "long", day: "numeric", month: "long", year: "numeric",
              })}
            </p>
            {isFinished && match.is_resolved && (
              <span className="mt-2 inline-block rounded-full bg-[var(--accent)]/20 px-3 py-0.5 text-xs text-[var(--accent)]">
                Resolved on-chain
              </span>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div>
              <p className="text-xl font-bold">{match.away_club.name}</p>
              <p className="text-sm text-[var(--text-secondary)]">Away</p>
            </div>
            {match.away_club.crest_url && (
              <img src={match.away_club.crest_url} alt="" className="h-12 w-12" />
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 flex gap-1 rounded-lg bg-[var(--bg-secondary)] p-1">
        <button
          onClick={() => setTab("contests")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "contests"
              ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Contests ({contests.length})
        </button>
        <button
          onClick={() => setTab("players")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition ${
            tab === "players"
              ? "bg-[var(--bg-card)] text-[var(--text-primary)]"
              : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          }`}
        >
          Players ({players.length})
        </button>
      </div>

      {/* Contest List */}
      {tab === "contests" && (
        <div className="space-y-3">
          {/* Create Contest Button */}
          <Link href={`/match/${matchId}/create`}>
            <div className="card-hover rounded-xl border-2 border-dashed border-[var(--accent)]/40 bg-[var(--bg-card)] p-5 mb-3 text-center hover:border-[var(--accent)] transition">
              <span className="text-sm font-semibold text-[var(--accent)]">+ Create Private Contest</span>
              <p className="mt-1 text-xs text-[var(--text-secondary)]">Invite friends, set entry fee, compete!</p>
            </div>
          </Link>

          {contests.length === 0 ? (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-8 text-center text-[var(--text-secondary)]">
              No contests for this match yet
            </div>
          ) : (
            contests.map((contest) => (
              <Link key={contest.id} href={`/contest/${contest.id}`}>
                <div className="card-hover rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-5 mb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="rounded bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-medium text-[var(--accent)] uppercase">
                          {contest.contest_type}
                        </span>
                        {contest.is_admin_created && (
                          <span className="rounded bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
                            Official
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-sm text-[var(--text-secondary)]">
                        Entry: {contest.entry_fee_credits === 0 ? "FREE" : formatCredits(contest.entry_fee_credits)}
                        {" | "}
                        {contest.total_entries}/{contest.max_entries} entries
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-[var(--accent)]">
                        {formatCredits(contest.total_pool_credits)} pool
                      </p>
                      <p className="text-xs text-[var(--text-secondary)]">
                        Prize: {Object.entries(contest.prize_split).map(([k, v]) => `${k}st ${v}%`).join(", ")}
                      </p>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      )}

      {/* Player List */}
      {tab === "players" && (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--text-secondary)]">
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Pos</th>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3 text-right">Price</th>
              </tr>
            </thead>
            <tbody>
              {players.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border)]/50 hover:bg-[var(--bg-secondary)]/50 transition">
                  <td className="px-4 py-3 font-medium">{p.web_name}</td>
                  <td className="px-4 py-3">
                    <span className={`badge-${p.position.toLowerCase()} rounded px-1.5 py-0.5 text-xs font-bold`}>
                      {p.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[var(--text-secondary)]">
                    {p.club?.short_name}
                  </td>
                  <td className="px-4 py-3 text-right font-mono">
                    {p.price_credits ? formatCredits(p.price_credits) : "-"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
