// ── User ──

export interface User {
  address: string;
  username: string | null;
  avatar_url: string | null;
  total_contests: number;
  total_wins: number;
  total_earnings_credits: number;
  created_at: string;
  last_seen_at: string;
}

// ── API Response Types ──

export interface Club {
  id: number;
  name: string;
  short_name: string;
  on_chain_id?: number;
  crest_url: string | null;
}

export interface Player {
  id: number;
  on_chain_id: number;
  name: string;
  web_name: string;
  position: "GK" | "DEF" | "MID" | "FWD";
  photo_url: string | null;
  club: Club;
  price_credits?: string;
}

export interface Match {
  id: number;
  api_football_fixture_id: number | null;
  on_chain_match_id: string;
  home_club: Club;
  away_club: Club;
  kickoff: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  is_resolved: boolean;
}

export interface Contest {
  id: string;
  on_chain_id: string;
  match_id: number;
  is_admin_created: boolean;
  contest_type: "free" | "classic" | "user" | "h2h";
  entry_fee_credits: number;
  max_entries: number;
  prize_split: Record<string, number>;
  invite_code: string | null;
  deadline: string;
  status: string;
  total_entries: number;
  total_pool_credits: number;
  match?: Match;
}

export interface Entry {
  user_address: string;
  contest_id: string;
  team_hash: string;
  score: number | null;
  rank: number | null;
  prize_won_credits: string;
  user?: {
    username: string | null;
    avatar_url: string | null;
  };
}

export interface PlayerStats {
  player_id: number;
  match_id: number;
  minutes_played: number;
  goals: number;
  assists: number;
  clean_sheet: boolean;
  fantasy_points: number;
  bps_score: number;
  bonus: number;
  player: {
    id: number;
    name: string;
    web_name: string;
    position: string;
    on_chain_id: number;
    club: { short_name: string };
  };
}

// ── Team Builder Types ──

export type Formation = "3-5-2" | "3-4-3" | "4-4-2" | "4-3-3" | "4-5-1" | "5-3-2" | "5-4-1" | "5-2-3";

export const FORMATIONS: Record<Formation, { DEF: number; MID: number; FWD: number }> = {
  "3-5-2": { DEF: 3, MID: 5, FWD: 2 },
  "3-4-3": { DEF: 3, MID: 4, FWD: 3 },
  "4-4-2": { DEF: 4, MID: 4, FWD: 2 },
  "4-3-3": { DEF: 4, MID: 3, FWD: 3 },
  "4-5-1": { DEF: 4, MID: 5, FWD: 1 },
  "5-3-2": { DEF: 5, MID: 3, FWD: 2 },
  "5-4-1": { DEF: 5, MID: 4, FWD: 1 },
  "5-2-3": { DEF: 5, MID: 2, FWD: 3 },
};

// Formation encoding (matches Leo contract)
export const FORMATION_CODES: Record<Formation, number> = {
  "3-5-2": 0,
  "3-4-3": 1,
  "4-4-2": 2,
  "4-3-3": 3,
  "4-5-1": 4,
  "5-3-2": 5,
  "5-4-1": 6,
  "5-2-3": 7,
};

export interface SelectedTeam {
  gk: Player | null;
  defenders: (Player | null)[];
  midfielders: (Player | null)[];
  forwards: (Player | null)[];
  bench: (Player | null)[];
  captain: Player | null;
  viceCaptain: Player | null;
  formation: Formation;
}
