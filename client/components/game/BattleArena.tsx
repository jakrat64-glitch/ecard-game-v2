"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ClientMatchState } from "@/types/game";
import { Card } from "./Card";
import { RevealSequence } from "./RevealSequence";
import { CARD_LABELS } from "@/lib/constants";

interface BattleArenaProps {
  matchState: ClientMatchState;
}

/**
 * Center zone. Shows both players' face-down cards locking into place as
 * each commits, then flips both simultaneously on 'revealing', and shows
 * the point/outcome result during 'revealing' / 'turn_result' phases.
 */
export function BattleArena({ matchState }: BattleArenaProps) {
  const { phase, you, opponent, lastReveal, leaderPlayerId } = matchState;

  const youLocked = you.hasLockedIn || phase === "revealing" || phase === "turn_result";
  const opponentLocked =
    opponent.hasLockedIn || phase === "revealing" || phase === "turn_result";

  const isRevealing = phase === "revealing";

  const yourRevealedType =
    isRevealing && lastReveal ? lastReveal.plays[you.id] : you.lockedCard?.type ?? null;
  const opponentRevealedType =
    isRevealing && lastReveal ? lastReveal.plays[opponent.id] : null;

  const youAreLeader = leaderPlayerId === you.id;

  return (
    <div className="relative w-full flex-1 flex flex-col items-center justify-center min-h-[220px] py-4">
      {/* Ambient vignette glow behind the arena */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(circle at 50% 50%, rgba(224,38,58,0.08), transparent 65%)",
        }}
      />

      <RevealSequence active={phase === "awaiting_response" && (youLocked || opponentLocked)} />

      <div className="relative z-10 flex items-center justify-center gap-8">
        {/* Opponent's card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">
            Opponent
          </span>
          <AnimatePresence mode="wait">
            {opponentLocked ? (
              <motion.div
                key="opp-card"
                initial={{ scale: 0.5, opacity: 0, y: -20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Card
                  type={opponentRevealedType}
                  isFlipped={isRevealing && !!opponentRevealedType}
                  size="lg"
                  glow={
                    isRevealing && lastReveal?.winnerId === opponent.id ? "green" : "none"
                  }
                />
              </motion.div>
            ) : (
              <motion.div
                key="opp-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-28 h-40 rounded-lg border-2 border-dashed border-neutral-800 flex items-center justify-center"
              >
                <span className="text-neutral-700 text-xs">
                  {leaderPlayerId === opponent.id ? "Leading..." : "Waiting"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* VS divider */}
        <div className="flex flex-col items-center gap-1">
          <span className="text-red-600 font-black text-xl tracking-wider select-none">
            VS
          </span>
          {phase === "awaiting_lead" && (
            <span className="text-[10px] text-amber-400/80 uppercase tracking-wide text-center max-w-[80px]">
              {youAreLeader ? "You lead" : "They lead"}
            </span>
          )}
        </div>

        {/* Your card */}
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] uppercase tracking-widest text-neutral-500">You</span>
          <AnimatePresence mode="wait">
            {youLocked ? (
              <motion.div
                key="your-card"
                initial={{ scale: 0.5, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 20 }}
              >
                <Card
                  type={yourRevealedType}
                  isFlipped={true}
                  size="lg"
                  glow={isRevealing && lastReveal?.winnerId === you.id ? "gold" : "none"}
                />
              </motion.div>
            ) : (
              <motion.div
                key="your-empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-28 h-40 rounded-lg border-2 border-dashed border-neutral-800 flex items-center justify-center"
              >
                <span className="text-neutral-700 text-xs">
                  {youAreLeader ? "Your move" : "Waiting"}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Outcome banner */}
      <AnimatePresence>
        {(phase === "revealing" || phase === "turn_result") && lastReveal && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ delay: 0.55 }}
            className="relative z-10 mt-6 text-center"
          >
            {lastReveal.outcome === "draw_discard" ? (
              <div className="text-neutral-300">
                <span className="text-lg font-bold">Both Citizens</span>
                <div className="text-xs text-neutral-500 uppercase tracking-wide mt-1">
                  Cards discarded — same leader continues
                </div>
              </div>
            ) : (
              <div>
                <span
                  className={
                    lastReveal.winnerId === you.id
                      ? "text-2xl font-black text-amber-400 drop-shadow-[0_0_18px_rgba(250,204,21,0.6)]"
                      : "text-2xl font-black text-red-500 drop-shadow-[0_0_18px_rgba(224,38,58,0.6)]"
                  }
                >
                  {lastReveal.winnerId === you.id ? "You win the turn!" : "Opponent wins the turn"}
                </span>
                <div className="text-xs text-neutral-400 uppercase tracking-wide mt-1">
                  {CARD_LABELS[lastReveal.plays[you.id]]} vs{" "}
                  {CARD_LABELS[lastReveal.plays[opponent.id]]} · +
                  {lastReveal.pointsAwarded[lastReveal.winnerId!]} pts
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
