"use client";

import { motion } from "framer-motion";
import { Bot } from "lucide-react";
import { ClientMatchState } from "@/types/game";
import { ScoreBadge } from "./ScoreBadge";
import { Card } from "./Card";
import { AVATAR_ASSETS } from "@/lib/constants";

interface OpponentZoneProps {
  matchState: ClientMatchState;
}

/**
 * Layout the opponent hand cards in a neat straight row for a cleaner view.
 */
function cardSpacing(index: number, total: number): { x: number } {
  const spacing = 16;
  const start = -((total - 1) * spacing) / 2;
  return { x: start + index * spacing };
}

/**
 * Top zone: opponent's score badge + a fanned-out representation of their
 * remaining hand (always face-down — we only ever know the COUNT, per the
 * server contract). A subtle pulse on their "locked in" card hints that
 * they've committed, without revealing anything.
 */
export function OpponentZone({ matchState }: OpponentZoneProps) {
  const opponentPublic = matchState.players.find((p) => p.id === matchState.opponent.id);
  if (!opponentPublic) {
    return (
      <div className="w-full px-4 pt-4 flex items-center justify-center text-neutral-500 text-sm">
        Waiting for opponent...
      </div>
    );
  }

  const handCount = opponentPublic.handCount;

  return (
    <div className="w-full px-4 pt-4 flex flex-col items-center gap-3">
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ScoreBadge
            name={opponentPublic.name}
            score={opponentPublic.score}
            role={opponentPublic.role}
            align="left"
            avatar={AVATAR_ASSETS[opponentPublic.avatar]}
          />
          {opponentPublic.isBot && (
            <span className="flex items-center gap-1 text-[10px] uppercase tracking-wide text-neutral-500 border border-neutral-700 rounded-full px-2 py-0.5">
              <Bot size={11} />
              Bot
            </span>
          )}
          {!opponentPublic.isBot && (
            <span
              className={`text-[10px] uppercase tracking-wide rounded-full px-2 py-0.5 border ${
                opponentPublic.connected
                  ? "border-emerald-500/60 bg-emerald-950/30 text-emerald-300"
                  : "border-neutral-700 bg-neutral-900/60 text-neutral-500"
              }`}
            >
              {opponentPublic.connected ? "Online" : "Disconnected"}
            </span>
          )}
        </div>
        {matchState.opponent.hasLockedIn && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-xs uppercase tracking-widest text-red-400 font-semibold px-2.5 py-1 rounded-full border border-red-500/50 bg-red-950/40"
          >
            Locked In
          </motion.div>
        )}
      </div>

      {!opponentPublic.connected && !opponentPublic.isBot && (
        <div className="w-full text-center text-[10px] uppercase tracking-[0.24em] text-neutral-500">
          Opponent left. Anyone with the room code can join and continue.
        </div>
      )}

      <div className="relative h-20 flex items-center justify-center" style={{ width: "100%" }}>
        <div className="flex items-center justify-center gap-2">
          {Array.from({ length: handCount }).map((_, i) => {
            const { x } = cardSpacing(i, handCount);
            return (
              <motion.div
                key={i}
                className="relative"
                initial={{ y: 10, opacity: 0 }}
                animate={{ x, y: 0, opacity: 1 }}
                transition={{ delay: i * 0.03, type: "spring", stiffness: 320, damping: 24 }}
                style={{ zIndex: i, left: x }}
              >
                <Card type={null} isFlipped={false} size="sm" dimmed />
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
