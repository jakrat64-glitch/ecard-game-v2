"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { ClientMatchState } from "@/types/game";

interface CombinedScoreCircleProps {
  matchState: ClientMatchState;
}

/**
 * A single circular badge holding both scores stacked vertically —
 * opponent on top, you on the bottom — inspired by the reference app's
 * Score component. Whichever number just increased briefly flashes green,
 * matching that reference's "flash on score change" behavior.
 */
export function CombinedScoreCircle({ matchState }: CombinedScoreCircleProps) {
  const you = matchState.players.find((p) => p.id === matchState.you.id);
  const opponent = matchState.players.find((p) => p.id === matchState.opponent.id);

  const prevYouScore = useRef(you?.score ?? 0);
  const prevOppScore = useRef(opponent?.score ?? 0);
  const [flashYou, setFlashYou] = useState(false);
  const [flashOpp, setFlashOpp] = useState(false);

  useEffect(() => {
    if (you && you.score > prevYouScore.current) {
      setFlashYou(true);
      const t = setTimeout(() => setFlashYou(false), 1000);
      prevYouScore.current = you.score;
      return () => clearTimeout(t);
    }
    if (you) prevYouScore.current = you.score;
  }, [you?.score]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (opponent && opponent.score > prevOppScore.current) {
      setFlashOpp(true);
      const t = setTimeout(() => setFlashOpp(false), 1000);
      prevOppScore.current = opponent.score;
      return () => clearTimeout(t);
    }
    if (opponent) prevOppScore.current = opponent.score;
  }, [opponent?.score]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-full border-2 border-neutral-700 bg-black/70 backdrop-blur-sm shadow-[0_0_20px_rgba(0,0,0,0.6)]">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`opp-${opponent?.score ?? 0}`}
          initial={{ y: -4, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            color: flashOpp ? "#2ce960" : "#f87171",
            fontSize: flashOpp ? "1.25rem" : "1rem",
          }}
          transition={{ duration: 0.3 }}
          className="font-bold leading-none"
        >
          {opponent?.score ?? 0}
        </motion.span>
      </AnimatePresence>
      <div className="w-6 h-px bg-neutral-700 my-0.5" />
      <AnimatePresence mode="popLayout">
        <motion.span
          key={`you-${you?.score ?? 0}`}
          initial={{ y: 4, opacity: 0 }}
          animate={{
            y: 0,
            opacity: 1,
            color: flashYou ? "#2ce960" : "#fbbf24",
            fontSize: flashYou ? "1.25rem" : "1rem",
          }}
          transition={{ duration: 0.3 }}
          className="font-bold leading-none"
        >
          {you?.score ?? 0}
        </motion.span>
      </AnimatePresence>
    </div>
  );
}
