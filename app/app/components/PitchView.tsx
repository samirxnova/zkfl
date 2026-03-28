"use client";

import { useState } from "react";
import type { Player, SelectedTeam } from "../types";
import { FORMATIONS } from "../types";

interface PitchViewProps {
  team: SelectedTeam;
  onSlotClick: (position: "GK" | "DEF" | "MID" | "FWD" | "BENCH", index: number) => void;
  onCaptainToggle: (player: Player) => void;
  onVCToggle: (player: Player) => void;
  onRemove: (position: "GK" | "DEF" | "MID" | "FWD" | "BENCH", index: number) => void;
}

export function PitchView({ team, onSlotClick, onCaptainToggle, onVCToggle, onRemove }: PitchViewProps) {
  const formation = FORMATIONS[team.formation];

  return (
    <div className="pitch-bg rounded-xl p-4 relative overflow-hidden" style={{ minHeight: 480 }}>
      {/* Pitch lines */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white" />
        <div className="absolute left-1/4 right-1/4 top-1/2 -translate-y-1/2 h-24 border border-white rounded-full" />
      </div>

      <div className="relative flex flex-col items-center gap-2" style={{ minHeight: 460 }}>
        {/* FWD Row */}
        <div className="flex justify-center gap-3 pt-4">
          {Array.from({ length: formation.FWD }).map((_, i) => (
            <PlayerSlot
              key={`fwd-${i}`}
              player={team.forwards[i] ?? null}
              position="FWD"
              index={i}
              isCaptain={team.captain?.on_chain_id === team.forwards[i]?.on_chain_id}
              isVC={team.viceCaptain?.on_chain_id === team.forwards[i]?.on_chain_id}
              onSlotClick={() => onSlotClick("FWD", i)}
              onCaptain={() => team.forwards[i] && onCaptainToggle(team.forwards[i]!)}
              onVC={() => team.forwards[i] && onVCToggle(team.forwards[i]!)}
              onRemove={() => onRemove("FWD", i)}
            />
          ))}
        </div>

        {/* MID Row */}
        <div className="flex justify-center gap-3 mt-4">
          {Array.from({ length: formation.MID }).map((_, i) => (
            <PlayerSlot
              key={`mid-${i}`}
              player={team.midfielders[i] ?? null}
              position="MID"
              index={i}
              isCaptain={team.captain?.on_chain_id === team.midfielders[i]?.on_chain_id}
              isVC={team.viceCaptain?.on_chain_id === team.midfielders[i]?.on_chain_id}
              onSlotClick={() => onSlotClick("MID", i)}
              onCaptain={() => team.midfielders[i] && onCaptainToggle(team.midfielders[i]!)}
              onVC={() => team.midfielders[i] && onVCToggle(team.midfielders[i]!)}
              onRemove={() => onRemove("MID", i)}
            />
          ))}
        </div>

        {/* DEF Row */}
        <div className="flex justify-center gap-3 mt-4">
          {Array.from({ length: formation.DEF }).map((_, i) => (
            <PlayerSlot
              key={`def-${i}`}
              player={team.defenders[i] ?? null}
              position="DEF"
              index={i}
              isCaptain={team.captain?.on_chain_id === team.defenders[i]?.on_chain_id}
              isVC={team.viceCaptain?.on_chain_id === team.defenders[i]?.on_chain_id}
              onSlotClick={() => onSlotClick("DEF", i)}
              onCaptain={() => team.defenders[i] && onCaptainToggle(team.defenders[i]!)}
              onVC={() => team.defenders[i] && onVCToggle(team.defenders[i]!)}
              onRemove={() => onRemove("DEF", i)}
            />
          ))}
        </div>

        {/* GK Row */}
        <div className="flex justify-center mt-4">
          <PlayerSlot
            player={team.gk}
            position="GK"
            index={0}
            isCaptain={team.captain?.on_chain_id === team.gk?.on_chain_id}
            isVC={team.viceCaptain?.on_chain_id === team.gk?.on_chain_id}
            onSlotClick={() => onSlotClick("GK", 0)}
            onCaptain={() => team.gk && onCaptainToggle(team.gk)}
            onVC={() => team.gk && onVCToggle(team.gk)}
            onRemove={() => onRemove("GK", 0)}
          />
        </div>

        {/* Bench */}
        <div className="mt-auto pt-4 border-t border-white/20 w-full">
          <p className="text-center text-xs text-white/60 mb-2">BENCH</p>
          <div className="flex justify-center gap-3">
            {Array.from({ length: 2 }).map((_, i) => (
              <PlayerSlot
                key={`bench-${i}`}
                player={team.bench[i] ?? null}
                position="BENCH"
                index={i}
                isCaptain={false}
                isVC={false}
                onSlotClick={() => onSlotClick("BENCH", i)}
                onCaptain={() => {}}
                onVC={() => {}}
                onRemove={() => onRemove("BENCH", i)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

interface PlayerSlotProps {
  player: Player | null;
  position: string;
  index: number;
  isCaptain: boolean;
  isVC: boolean;
  onSlotClick: () => void;
  onCaptain: () => void;
  onVC: () => void;
  onRemove: () => void;
}

function PlayerSlot({ player, position, isCaptain, isVC, onSlotClick, onCaptain, onVC, onRemove }: PlayerSlotProps) {
  const [showActions, setShowActions] = useState(false);

  if (!player) {
    return (
      <button
        onClick={onSlotClick}
        className="flex h-16 w-20 flex-col items-center justify-center rounded-lg border-2 border-dashed border-white/30 text-white/50 hover:border-white/60 hover:text-white/80 transition"
      >
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        <span className="text-[10px] mt-0.5">{position}</span>
      </button>
    );
  }

  return (
    <div className="relative">
      <div
        className="flex h-16 w-20 flex-col items-center justify-center rounded-lg bg-white/90 text-black cursor-pointer hover:bg-white transition"
        onClick={() => setShowActions(!showActions)}
      >
        <span className="text-xs font-bold leading-tight truncate max-w-[72px]">
          {player.web_name}
        </span>
        <span className="text-[10px] text-gray-600">{player.club?.short_name}</span>
        {(isCaptain || isVC) && (
          <span className={`absolute -top-1 -right-1 h-5 w-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
            isCaptain ? "bg-yellow-400 text-black" : "bg-gray-400 text-white"
          }`}>
            {isCaptain ? "C" : "V"}
          </span>
        )}
      </div>
      {/* Click-to-show actions */}
      {showActions && (
        <div className="absolute -top-9 left-1/2 -translate-x-1/2 flex gap-1 z-10">
          {position !== "BENCH" && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); onCaptain(); setShowActions(false); }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                  isCaptain ? "bg-yellow-500 text-black ring-2 ring-yellow-300" : "bg-yellow-400 text-black hover:bg-yellow-300"
                }`}
              >
                C
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); onVC(); setShowActions(false); }}
                className={`rounded px-1.5 py-0.5 text-[10px] font-bold transition ${
                  isVC ? "bg-gray-500 text-white ring-2 ring-gray-300" : "bg-gray-400 text-white hover:bg-gray-300"
                }`}
              >
                V
              </button>
            </>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); setShowActions(false); }}
            className="rounded bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white hover:bg-red-400"
          >
            X
          </button>
        </div>
      )}
    </div>
  );
}
