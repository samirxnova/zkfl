"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getMatches } from "./lib/api";
import type { Match } from "./types";

export default function MatchHub() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getMatches()
      .then(setMatches)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Matches</h1>
        <p className="mt-1 text-[var(--text-secondary)]">
          Select a fixture to enter contests and draft your ZK fantasy team
        </p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--accent)] border-t-transparent" />
        </div>
      ) : matches.length === 0 ? (
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-12 text-center">
          <p className="text-lg text-[var(--text-secondary)]">No matches available yet</p>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Check back when the oracle submits match data
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {matches.map((match) => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}

function MatchCard({ match }: { match: Match }) {
  const isFinished = match.status === "FT";
  const isLive = match.status === "LIVE" || match.status === "1H" || match.status === "2H" || match.status === "HT";
  const kickoff = new Date(match.kickoff);

  return (
    <Link href={`/match/${match.id}`}>
      <div className="card-hover rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-6 cursor-pointer">
        {/* Status badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="text-xs text-[var(--text-secondary)]">
            {kickoff.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" })}
          </span>
          {isLive && (
            <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-xs font-semibold text-red-400">
              LIVE
            </span>
          )}
          {isFinished && (
            <span className="rounded-full bg-[var(--accent)]/20 px-2 py-0.5 text-xs font-semibold text-[var(--accent)]">
              FT
            </span>
          )}
          {!isFinished && !isLive && (
            <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-xs text-blue-300">
              {kickoff.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
            </span>
          )}
        </div>

        {/* Teams */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {match.home_club.crest_url && (
              <img src={match.home_club.crest_url} alt="" className="h-8 w-8" />
            )}
            <span className="font-semibold">{match.home_club.short_name}</span>
          </div>

          <div className="text-center">
            {isFinished || isLive ? (
              <span className="text-2xl font-bold tabular-nums">
                {match.home_score} - {match.away_score}
              </span>
            ) : (
              <span className="text-sm text-[var(--text-secondary)]">vs</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <span className="font-semibold">{match.away_club.short_name}</span>
            {match.away_club.crest_url && (
              <img src={match.away_club.crest_url} alt="" className="h-8 w-8" />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between border-t border-[var(--border)] pt-3">
          <span className="text-xs text-[var(--accent)]">View Contests</span>
          <svg className="h-4 w-4 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </div>
      </div>
    </Link>
  );
}
