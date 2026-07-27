"use client";

import { motion, AnimatePresence } from "framer-motion";
import { ClientMatchState } from "@/types/game";
import { ROLE_LABELS } from "@/lib/constants";

interface RoundBannerProps {
  matchState: ClientMatchState;
}

/**
 * Full-screen dramatic banner shown during the 'round_intro' phase,
 * announcing which round is starting and which side the viewer plays.
 */
export function RoundBanner({ matchState }: RoundBannerProps) {
  const you = matchState.players.find((p) => p.id === matchState.you.id);
  if (matchState.phase !== "round_intro" || !you) return null;

  return (
    <AnimatePresence>
      <motion.div
        key={`round-${matchState.roundNumber}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-40 flex items-center justify-center bg-black/85 backdrop-blur-sm"
      >
        <div className="text-center px-6">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" }}
            className="text-neutral-500 text-sm uppercase tracking-[0.4em] mb-3"
          >
            Round {matchState.roundNumber} of 2
          </motion.div>
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35, duration: 0.5, ease: "easeOut" }}
            className={
              you.role === "emperor_side"
                ? "text-4xl sm:text-6xl font-black text-amber-400 drop-shadow-[0_0_30px_rgba(250,204,21,0.6)]"
                : "text-4xl sm:text-6xl font-black text-red-500 drop-shadow-[0_0_30px_rgba(224,38,58,0.6)]"
            }
            style={{ fontFamily: "var(--font-display)" }}
          >
            You are {ROLE_LABELS[you.role]}
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="text-neutral-400 text-sm mt-4 tracking-wide"
          >
            {matchState.message}
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
