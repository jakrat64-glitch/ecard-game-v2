"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { ClientMatchState } from "@/types/game";
import { OpponentZone } from "./OpponentZone";
import { BattleArena } from "./BattleArena";
import { PlayerHand } from "./PlayerHand";
import { RoundBanner } from "./RoundBanner";
import { MatchEndModal } from "./MatchEndModal";
import { CombinedScoreCircle } from "./CombinedScoreCircle";

interface GameBoardProps {
  matchState: ClientMatchState;
  onLockIn: (cardId: string) => void;
  onLeave: () => void;
}

/**
 * Mobile-first vertical layout:
 *   Top zone    -> OpponentZone (score + face-down opponent hand)
 *   Center zone -> BattleArena (the two locked/flipping cards)
 *   Bottom zone -> PlayerHand (your cards, lift-on-select, lock-in button)
 *
 * A persistent exit affordance sits in the top-left at all times (mirroring
 * the reference app's always-visible back arrow), and a combined circular
 * score badge floats top-center showing both players' totals at a glance.
 *
 * Full-screen overlays (RoundBanner, MatchEndModal) sit above everything.
 */
export function GameBoard({ matchState, onLockIn, onLeave }: GameBoardProps) {
  const router = useRouter();

  const handleExitClick = () => {
    const confirmed = window.confirm(
      "Leave this match? Your progress in this game will be lost."
    );
    if (confirmed) {
      onLeave();
      router.push("/");
    }
  };

  return (
    <div className="relative flex flex-col min-h-screen w-full max-w-md mx-auto overflow-y-auto">
      {/* Background texture / vignette */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 50% 30%, rgba(80,0,10,0.25), transparent 60%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            boxShadow: "inset 0 0 150px 40px rgba(0,0,0,0.9)",
          }}
        />
      </div>

      {/* Persistent top bar: exit button (left), score circle (center), room code (right) */}
      <div className="relative z-20 flex items-center justify-between px-4 pt-3">
        <button
          onClick={handleExitClick}
          aria-label="Leave match"
          className="w-9 h-9 flex items-center justify-center rounded-full border border-neutral-700 bg-black/60 text-neutral-300 hover:text-white hover:border-neutral-500 transition-colors"
        >
          <ChevronLeft size={20} />
        </button>

        <CombinedScoreCircle matchState={matchState} />

        {matchState.mode === "multiplayer" ? (
          <div className="text-[10px] text-neutral-500 uppercase tracking-widest text-right leading-tight">
            Room
            <br />
            <span className="text-neutral-300 font-semibold tracking-wider">
              {matchState.roomCode}
            </span>
          </div>
        ) : (
          <div className="w-9" /> // spacer to keep the score circle centered
        )}
      </div>

      <div className="relative z-10 flex flex-col h-full">
        <OpponentZone matchState={matchState} />
        <BattleArena matchState={matchState} />
        <PlayerHand matchState={matchState} onLockIn={onLockIn} />
      </div>

      <RoundBanner matchState={matchState} />
      <MatchEndModal matchState={matchState} onLeave={onLeave} />
    </div>
  );
}
