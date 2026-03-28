"use client";

import { useState, useMemo, useRef } from "react";
import { useWallet } from "@provablehq/aleo-wallet-adaptor-react";
import { PitchView } from "./PitchView";
import { formatCredits, buildDraftTeamInputs, PROGRAMS } from "../lib/aleo";
import { useAleoTransaction } from "../hooks/useAleoTransaction";
import { enterContest } from "../lib/api";
import type { Player, Formation, SelectedTeam, Contest } from "../types";
import { FORMATIONS, FORMATION_CODES } from "../types";

interface TeamBuilderProps {
  players: Player[];
  contest: Contest;
  matchId: string; // on-chain match ID field
}

const SALARY_CAP = 100_000_000; // 100M abstract salary units for demo

export function TeamBuilder({ players, contest, matchId }: TeamBuilderProps) {
  const { connected, address } = useWallet();
  const { execute, waitForConfirmation } = useAleoTransaction();
  const [team, setTeam] = useState<SelectedTeam>({
    gk: null,
    defenders: [null, null, null, null, null],
    midfielders: [null, null, null, null, null],
    forwards: [null, null, null],
    bench: [null, null],
    captain: null,
    viceCaptain: null,
    formation: "4-4-2",
  });

  const [selectingSlot, setSelectingSlot] = useState<{
    position: "GK" | "DEF" | "MID" | "FWD" | "BENCH";
    index: number;
  } | null>(null);
  const [filterPos, setFilterPos] = useState<"ALL" | "GK" | "DEF" | "MID" | "FWD">("ALL");
  const [search, setSearch] = useState("");
  const [drafting, setDrafting] = useState(false);
  const [txId, setTxId] = useState<string | null>(null);
  const [draftError, setDraftError] = useState<string | null>(null);
  const draftLock = useRef(false); // Prevents double-click race conditions

  // Get all selected player IDs
  const selectedIds = useMemo(() => {
    const ids = new Set<number>();
    if (team.gk) ids.add(team.gk.on_chain_id);
    team.defenders.forEach((p) => p && ids.add(p.on_chain_id));
    team.midfielders.forEach((p) => p && ids.add(p.on_chain_id));
    team.forwards.forEach((p) => p && ids.add(p.on_chain_id));
    team.bench.forEach((p) => p && ids.add(p.on_chain_id));
    return ids;
  }, [team]);

  // Total salary
  const totalSalary = useMemo(() => {
    let sum = 0;
    const allPlayers = [
      team.gk,
      ...team.defenders,
      ...team.midfielders,
      ...team.forwards,
      ...team.bench,
    ];
    for (const p of allPlayers) {
      if (p?.price_credits) sum += parseInt(p.price_credits);
    }
    return sum;
  }, [team]);

  // Count filled slots
  const filledCount = selectedIds.size;
  const totalSlots = 1 + FORMATIONS[team.formation].DEF + FORMATIONS[team.formation].MID + FORMATIONS[team.formation].FWD + 2;

  // Club balance: on-chain requires exactly 8 home + 8 away across 16 slots.
  // 3 dummy slots (player 0, club=0) count as "not home" (away).
  // So user must select exactly 8 home + 5 away from 13 active players.
  const MAX_HOME = 8;
  const MAX_AWAY = 5;
  const homeClubName = contest.match?.home_club?.short_name;

  const { homeCount, awayCount } = useMemo(() => {
    let home = 0;
    let away = 0;
    const allSelected = [
      team.gk,
      ...team.defenders.slice(0, FORMATIONS[team.formation].DEF),
      ...team.midfielders.slice(0, FORMATIONS[team.formation].MID),
      ...team.forwards.slice(0, FORMATIONS[team.formation].FWD),
      ...team.bench,
    ];
    for (const p of allSelected) {
      if (!p) continue;
      if (p.club?.short_name === homeClubName) home++;
      else away++;
    }
    return { homeCount: home, awayCount: away };
  }, [team, homeClubName]);

  // Filter players for selection panel
  const filteredPlayers = useMemo(() => {
    let filtered = players;

    // When selecting a slot, auto-filter by matching position
    const activeFilter = selectingSlot
      ? (selectingSlot.position === "BENCH" ? filterPos : selectingSlot.position)
      : filterPos;

    if (activeFilter !== "ALL") {
      filtered = filtered.filter((p) => p.position === activeFilter);
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (p) => p.name.toLowerCase().includes(q) || p.web_name.toLowerCase().includes(q)
      );
    }
    // Disable players from a club that's at its limit
    filtered = filtered.map((p) => {
      const isHome = p.club?.short_name === homeClubName;
      const clubFull = isHome ? homeCount >= MAX_HOME : awayCount >= MAX_AWAY;
      return { ...p, _clubFull: clubFull && !selectedIds.has(p.on_chain_id) };
    });

    return filtered;
  }, [players, filterPos, search, selectingSlot, homeCount, awayCount, homeClubName, selectedIds]);

  // Handlers
  function handleSlotClick(position: "GK" | "DEF" | "MID" | "FWD" | "BENCH", index: number) {
    setSelectingSlot({ position, index });
    if (position !== "BENCH") setFilterPos(position);
  }

  function handleSelectPlayer(player: Player) {
    if (!selectingSlot || selectedIds.has(player.on_chain_id)) return;

    const newTeam = { ...team };
    const { position, index } = selectingSlot;

    if (position === "GK") {
      newTeam.gk = player;
    } else if (position === "DEF") {
      newTeam.defenders = [...team.defenders];
      newTeam.defenders[index] = player;
    } else if (position === "MID") {
      newTeam.midfielders = [...team.midfielders];
      newTeam.midfielders[index] = player;
    } else if (position === "FWD") {
      newTeam.forwards = [...team.forwards];
      newTeam.forwards[index] = player;
    } else if (position === "BENCH") {
      newTeam.bench = [...team.bench];
      newTeam.bench[index] = player;
    }

    setTeam(newTeam);
    setSelectingSlot(null);
  }

  function handleRemove(position: "GK" | "DEF" | "MID" | "FWD" | "BENCH", index: number) {
    const newTeam = { ...team };
    let removed: Player | null = null;

    if (position === "GK") { removed = team.gk; newTeam.gk = null; }
    else if (position === "DEF") { newTeam.defenders = [...team.defenders]; removed = newTeam.defenders[index]; newTeam.defenders[index] = null; }
    else if (position === "MID") { newTeam.midfielders = [...team.midfielders]; removed = newTeam.midfielders[index]; newTeam.midfielders[index] = null; }
    else if (position === "FWD") { newTeam.forwards = [...team.forwards]; removed = newTeam.forwards[index]; newTeam.forwards[index] = null; }
    else if (position === "BENCH") { newTeam.bench = [...team.bench]; removed = newTeam.bench[index]; newTeam.bench[index] = null; }

    // Clear captain/VC if removed
    if (removed && newTeam.captain?.on_chain_id === removed.on_chain_id) newTeam.captain = null;
    if (removed && newTeam.viceCaptain?.on_chain_id === removed.on_chain_id) newTeam.viceCaptain = null;

    setTeam(newTeam);
  }

  function handleCaptainToggle(player: Player) {
    setTeam((prev) => ({
      ...prev,
      captain: prev.captain?.on_chain_id === player.on_chain_id ? null : player,
      viceCaptain: prev.viceCaptain?.on_chain_id === player.on_chain_id ? null : prev.viceCaptain,
    }));
  }

  function handleVCToggle(player: Player) {
    setTeam((prev) => ({
      ...prev,
      viceCaptain: prev.viceCaptain?.on_chain_id === player.on_chain_id ? null : player,
      captain: prev.captain?.on_chain_id === player.on_chain_id ? null : prev.captain,
    }));
  }

  function handleFormationChange(f: Formation) {
    // Reset team when formation changes
    setTeam({
      gk: team.gk,
      defenders: Array(5).fill(null),
      midfielders: Array(5).fill(null),
      forwards: Array(3).fill(null),
      bench: [null, null],
      captain: null,
      viceCaptain: null,
      formation: f,
    });
  }

  // Check if team is valid for drafting
  const clubBalanceValid = homeCount === MAX_HOME && awayCount === MAX_AWAY;
  const canDraft = connected && filledCount === totalSlots && team.captain && team.viceCaptain && totalSalary <= SALARY_CAP && clubBalanceValid;

  async function handleDraft() {
    if (!canDraft || draftLock.current) return;
    draftLock.current = true;
    setDrafting(true);
    setDraftError(null);

    try {
      // Step 1: Pay entry fee, wait for wallet confirmation via adapter polling
      const entryFee = contest.entry_fee_credits ?? 0;
      let entryTxId: string | null = null;

      if (entryFee > 0) {
        setDraftError("Step 1/2: Paying entry fee...");
        const entryResult = await execute(PROGRAMS.prize, "enter_contest", [
          `${contest.on_chain_id}`,
          `${entryFee}u64`,
        ]);
        entryTxId = entryResult?.transactionId ?? null;
      } else {
        setDraftError("Step 1/2: Registering free entry...");
        const entryResult = await execute(PROGRAMS.prize, "enter_free_contest", [
          `${contest.on_chain_id}`,
        ]);
        entryTxId = entryResult?.transactionId ?? null;
      }

      // If wallet returned nothing, user cancelled or it failed immediately
      if (!entryTxId) {
        setDraftError("Entry fee payment failed or was cancelled.");
        setDrafting(false);
        return;
      }

      // Wait for on-chain confirmation via wallet adapter (1s polling)
      setDraftError("Step 1/2: Confirming on-chain...");
      const entryResult = await waitForConfirmation(entryTxId);

      if (entryResult.status === "failed" || entryResult.status === "rejected") {
        // Rejected on-chain could mean already entered — check if that's the case
        // by trying to continue to draft. If user wasn't entered, draft will also fail.
        console.warn("[Draft] Entry tx", entryResult.status, "— may already be entered, attempting draft...");
      } else if (entryResult.status === "timeout") {
        // Timed out — let user decide
        setDraftError("Entry confirmation timed out. Check explorer and try again.");
        setDrafting(false);
        return;
      }
      // "accepted" — proceed to draft

      // Step 2: Draft team
      setDraftError("Step 2/2: Generating ZK proof...");
      const inputs = buildDraftTeamInputs({
        contestId: contest.on_chain_id.replace("field", ""),
        matchId: matchId.replace("field", ""),
        gk: team.gk!.on_chain_id,
        defenders: team.defenders.map((p) => p?.on_chain_id ?? 0),
        midfielders: team.midfielders.map((p) => p?.on_chain_id ?? 0),
        forwards: team.forwards.map((p) => p?.on_chain_id ?? 0),
        bench: team.bench.map((p) => p?.on_chain_id ?? 0),
        formationCode: FORMATION_CODES[team.formation],
        captainId: team.captain!.on_chain_id,
        viceCaptainId: team.viceCaptain!.on_chain_id,
      });

      const draftTxResult = await execute(PROGRAMS.team, "draft_team", inputs);
      const draftTxId = draftTxResult?.transactionId;

      if (!draftTxId) {
        setDraftError("Wallet did not return a transaction ID.");
        setDrafting(false);
        return;
      }

      // Wait for draft confirmation via wallet adapter
      setDraftError("Step 2/2: Confirming draft on-chain...");
      const draftResult = await waitForConfirmation(draftTxId);
      const realDraftTxId = draftResult.onChainId ?? draftTxId;

      if (draftResult.status === "accepted") {
        setTxId(realDraftTxId);
        setDraftError(null);
        if (address) {
          enterContest(contest.id, address, realDraftTxId).catch(console.error);
        }
      } else if (draftResult.status === "timeout") {
        // Timed out — don't save, let user retry or check explorer
        setDraftError("Transaction confirmation timed out. Check explorer and retry if needed.");
      } else {
        setDraftError(`Draft transaction ${draftResult.status}. Check team constraints (salary cap, club balance).`);
      }
    } catch (err) {
      console.error("Draft failed:", err);
      setDraftError(err instanceof Error ? err.message : "Draft failed. Check console.");
    } finally {
      setDrafting(false);
      draftLock.current = false;
    }
  }

  // Success screen after draft
  if (txId) {
    return (
      <div className="mx-auto max-w-lg">
        <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-card)] p-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/20">
            <svg className="h-8 w-8 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="mb-2 text-xl font-bold">Team Drafted Successfully!</h2>
          <p className="mb-1 text-sm text-[var(--text-secondary)]">
            Your ZK proof has been generated and submitted to the Aleo network.
          </p>
          <p className="mb-6 text-xs text-[var(--text-secondary)]">
            Formation: {team.formation} | Captain: {team.captain?.web_name} | VC: {team.viceCaptain?.web_name}
          </p>

          <div className="mb-6 rounded-lg bg-[var(--bg-secondary)] p-4">
            <p className="mb-1 text-xs text-[var(--text-secondary)]">Transaction ID</p>
            <p className="break-all font-mono text-xs text-[var(--text-primary)]">{txId}</p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href={`https://testnet.explorer.provable.com/transaction/${txId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-lg border border-[var(--accent)]/30 bg-[var(--accent)]/10 px-4 py-2.5 text-sm text-[var(--accent)] hover:bg-[var(--accent)]/20 transition"
            >
              View on Explorer
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </a>
            <a
              href="/my"
              className="rounded-lg bg-[var(--accent)] px-4 py-2.5 text-sm font-bold text-black hover:bg-[var(--accent-dim)] transition"
            >
              View My Contests
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr,360px]">
      {/* Left: Pitch */}
      <div>
        {/* Formation Picker */}
        <div className="mb-4 flex flex-wrap gap-2">
          {(Object.keys(FORMATIONS) as Formation[]).map((f) => (
            <button
              key={f}
              onClick={() => handleFormationChange(f)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition ${
                team.formation === f
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-card)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Pitch */}
        <PitchView
          team={team}
          onSlotClick={handleSlotClick}
          onCaptainToggle={handleCaptainToggle}
          onVCToggle={handleVCToggle}
          onRemove={handleRemove}
        />

        {/* Salary Bar */}
        <div className="mt-4 rounded-lg bg-[var(--bg-card)] p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-[var(--text-secondary)]">Budget Used</span>
            <span className={totalSalary > SALARY_CAP ? "text-[var(--danger)]" : "text-[var(--accent)]"}>
              {formatCredits(totalSalary)} / {formatCredits(SALARY_CAP)}
            </span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-[var(--bg-secondary)]">
            <div
              className={`h-full rounded-full transition-all ${
                totalSalary > SALARY_CAP ? "bg-[var(--danger)]" : "bg-[var(--accent)]"
              }`}
              style={{ width: `${Math.min(100, (totalSalary / SALARY_CAP) * 100)}%` }}
            />
          </div>
          <div className="mt-3 flex items-center justify-between text-xs text-[var(--text-secondary)]">
            <span>{filledCount}/{totalSlots} players</span>
            <span>
              {team.captain ? `C: ${team.captain.web_name}` : "No captain"}
              {" | "}
              {team.viceCaptain ? `VC: ${team.viceCaptain.web_name}` : "No VC"}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between text-xs">
            <span className={homeCount === MAX_HOME ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}>
              {contest.match?.home_club?.short_name}: {homeCount}/{MAX_HOME}
            </span>
            <span className={awayCount === MAX_AWAY ? "text-[var(--accent)]" : "text-[var(--text-secondary)]"}>
              {contest.match?.away_club?.short_name}: {awayCount}/{MAX_AWAY}
            </span>
            {!clubBalanceValid && filledCount === totalSlots && (
              <span className="text-[var(--danger)]">Need {MAX_HOME} home + {MAX_AWAY} away</span>
            )}
          </div>
        </div>

        {/* Draft Button */}
        <button
          onClick={handleDraft}
          disabled={!canDraft || drafting}
          className={`mt-4 w-full rounded-lg py-3 text-sm font-bold transition ${
            canDraft && !drafting
              ? "bg-[var(--accent)] text-black hover:bg-[var(--accent-dim)]"
              : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed"
          }`}
        >
          {drafting ? "Generating ZK Proof..." : "ZK Draft Team"}
        </button>

        {draftError && (
          <div className="mt-3 rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-400">
            {draftError}
          </div>
        )}

        {!connected && (
          <p className="mt-2 text-center text-xs text-[var(--warning)]">Connect wallet to draft</p>
        )}
      </div>

      {/* Right: Player Selection Panel */}
      <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4">
        <h3 className="mb-3 text-sm font-semibold">
          {selectingSlot ? `Select ${selectingSlot.position} player` : "Players"}
        </h3>

        {/* Search */}
        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3 w-full rounded-lg bg-[var(--bg-secondary)] px-3 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-secondary)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
        />

        {/* Position filters */}
        <div className="mb-3 flex gap-1">
          {(["ALL", "GK", "DEF", "MID", "FWD"] as const).map((pos) => (
            <button
              key={pos}
              onClick={() => setFilterPos(pos)}
              className={`rounded px-2 py-1 text-xs font-medium transition ${
                filterPos === pos
                  ? "bg-[var(--accent)] text-black"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              {pos}
            </button>
          ))}
        </div>

        {/* Player list */}
        <div className="max-h-[500px] overflow-y-auto space-y-1">
          {filteredPlayers.map((p) => {
            const isSelected = selectedIds.has(p.on_chain_id);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const clubFull = (p as any)._clubFull;
            const isDisabled = isSelected || !selectingSlot || clubFull;
            return (
              <button
                key={p.on_chain_id}
                onClick={() => handleSelectPlayer(p)}
                disabled={isDisabled}
                className={`w-full flex items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition ${
                  isSelected
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] cursor-not-allowed"
                    : clubFull
                    ? "opacity-30 cursor-not-allowed"
                    : selectingSlot
                    ? "hover:bg-[var(--bg-secondary)] cursor-pointer"
                    : "opacity-50 cursor-not-allowed"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`badge-${p.position.toLowerCase()} rounded px-1 py-0.5 text-[10px] font-bold`}>
                    {p.position}
                  </span>
                  <div>
                    <p className="font-medium">{p.web_name}</p>
                    <p className="text-[10px] text-[var(--text-secondary)]">{p.club?.short_name}</p>
                  </div>
                </div>
                <span className="text-xs font-mono text-[var(--text-secondary)]">
                  {p.price_credits ? formatCredits(p.price_credits) : "-"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
