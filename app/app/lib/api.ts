import type { Match, Player, Contest, Entry, PlayerStats, User } from "../types";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001/api";

async function fetchJSON<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 30 } });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Auth API ──

export async function loginWithWallet(address: string): Promise<{ user: User; is_new: boolean }> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ address }),
  });
  if (!res.ok) throw new Error(`Auth error: ${res.status}`);
  return res.json();
}

export async function getUser(address: string): Promise<User> {
  return fetchJSON<User>(`/auth/user/${address}`);
}

export async function updateUser(address: string, updates: { username?: string; avatar_url?: string }): Promise<User> {
  const res = await fetch(`${API_BASE}/auth/user/${address}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...updates, caller_address: address }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || `API error: ${res.status}`);
  }
  return res.json();
}

export async function getUserStats(address: string) {
  return fetchJSON<{
    total_contests: number;
    total_wins: number;
    total_earnings_credits: number;
    best_score: number | null;
  }>(`/auth/user/${address}/stats`);
}

export async function getMatches() {
  return fetchJSON<Match[]>("/matches");
}

export async function getMatch(id: number) {
  return fetchJSON<Match>(`/matches/${id}`);
}

export async function getMatchPlayers(matchId: number) {
  return fetchJSON<Player[]>(`/matches/${matchId}/players`);
}

export async function getMatchStats(matchId: number) {
  return fetchJSON<PlayerStats[]>(`/matches/${matchId}/stats`);
}

export async function getContests(matchId?: number) {
  const query = matchId ? `?match_id=${matchId}` : "";
  return fetchJSON<Contest[]>(`/contests${query}`);
}

export async function getContest(id: string) {
  return fetchJSON<Contest>(`/contests/${id}`);
}

export async function getLeaderboard(contestId: string) {
  return fetchJSON<Entry[]>(`/contests/${contestId}/leaderboard`);
}

export async function getUserContests(address: string) {
  return fetchJSON<Entry[]>(`/contests/user/${address}`);
}

export async function createContest(params: {
  match_id: number;
  contest_type: string;
  entry_fee_credits: number;
  max_entries: number;
  prize_split: Record<string, number>;
  invite_code?: string;
  on_chain_id?: string;
  creator_address?: string;
}) {
  const res = await fetch(`${API_BASE}/contests`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json() as Promise<Contest>;
}

export async function enterContest(contestId: string, userAddress: string, teamHash: string) {
  const res = await fetch(`${API_BASE}/contests/${contestId}/enter`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_address: userAddress, team_hash: teamHash }),
  });
  return res.json();
}
