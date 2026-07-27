"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface RevealSequenceProps {
  active: boolean;
}

/**
 * A short "tension beat" — three pulsing dots / countdown-style flicker —
 * that plays for a few hundred ms right before the cards flip, to sell the
 * psychological-thriller mood (mirrors the anime's suspenseful pause before
 * a reveal). Purely cosmetic; the server has already resolved the outcome
 * by the time this renders — this never blocks or alters game state.
 */
export function RevealSequence({ active }: RevealSequenceProps) {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!active) {
      setTick(0);
      return;
    }
    const interval = setInterval(() => {
      setTick((t) => (t + 1) % 3);
    }, 220);
    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 flex items-center justify-center pointer-events-none z-30"
      >
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-red-500"
              animate={{
                scale: tick === i ? 1.4 : 0.8,
                opacity: tick === i ? 1 : 0.4,
              }}
              transition={{ duration: 0.18 }}
            />
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
