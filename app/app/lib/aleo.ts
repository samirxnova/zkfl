/**
 * Aleo SDK helper — formats inputs and executes transitions via wallet adapter
 */

// Types used by callers — re-exported from types.ts

// ── Input Formatting ──

export function toU32(n: number): string {
  return `${n}u32`;
}

export function toU128(n: number | bigint): string {
  return `${n}u128`;
}

export function toField(n: number | string): string {
  return `${n}field`;
}

export function toI64(n: number): string {
  return `${n}i64`;
}

// ── Draft Team Inputs ──

export interface DraftTeamParams {
  contestId: string; // field value
  matchId: string; // field value
  gk: number;
  defenders: number[]; // 5 slots (pad with 0)
  midfielders: number[]; // 5 slots (pad with 0)
  forwards: number[]; // 3 slots (pad with 0)
  bench: number[]; // 2 slots
  formationCode: number;
  captainId: number;
  viceCaptainId: number;
}

export function buildDraftTeamInputs(params: DraftTeamParams): string[] {
  const {
    contestId, matchId, gk,
    defenders, midfielders, forwards, bench,
    formationCode, captainId, viceCaptainId,
  } = params;

  // Build TeamData struct inline
  // The contract expects: contest_id, match_id, team: TeamData, formation: u8
  const teamData = `{
    gk: ${toU32(gk)},
    def_0: ${toU32(defenders[0] ?? 0)},
    def_1: ${toU32(defenders[1] ?? 0)},
    def_2: ${toU32(defenders[2] ?? 0)},
    def_3: ${toU32(defenders[3] ?? 0)},
    def_4: ${toU32(defenders[4] ?? 0)},
    mid_0: ${toU32(midfielders[0] ?? 0)},
    mid_1: ${toU32(midfielders[1] ?? 0)},
    mid_2: ${toU32(midfielders[2] ?? 0)},
    mid_3: ${toU32(midfielders[3] ?? 0)},
    mid_4: ${toU32(midfielders[4] ?? 0)},
    fwd_0: ${toU32(forwards[0] ?? 0)},
    fwd_1: ${toU32(forwards[1] ?? 0)},
    fwd_2: ${toU32(forwards[2] ?? 0)},
    bench_1: ${toU32(bench[0] ?? 0)},
    bench_2: ${toU32(bench[1] ?? 0)},
    captain_id: ${toU32(captainId)},
    vice_captain_id: ${toU32(viceCaptainId)}
  }`;

  return [
    toField(contestId),
    toField(matchId),
    teamData,
    `${formationCode}u8`,
  ];
}

// ── Transaction Execution ──

export interface ExecuteParams {
  program: string;
  functionName: string;
  inputs: string[];
  fee?: number;
}

export const PROGRAMS = {
  match: "zkfl_match.aleo",
  team: "zkfl_team_v2.aleo",
  scoring: "zkfl_scoring_v2.aleo",
  prize: "zkfl_prize_v2.aleo",
} as const;

export const DEFAULT_FEE = 500_000; // 0.5 credits

// ── Format credit amounts (microcredits → display) ──

export function formatCredits(microcredits: number | string): string {
  const n = typeof microcredits === "string" ? parseInt(microcredits) : microcredits;
  if (n === 0) return "Free";
  return `${(n / 1_000_000).toFixed(2)} credits`;
}

// Legacy alias
export const formatUSDCx = formatCredits;

// ── Transaction Status Types ──

export type TxConfirmStatus = "accepted" | "failed" | "rejected" | "timeout";

export interface TxConfirmResult {
  status: TxConfirmStatus;
  onChainId?: string; // real on-chain tx ID (may differ from temp wallet ID)
}
