"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { ClientMatchState } from "@/types/game";
import { Button } from "@/components/ui/Button";

interface MatchEndModalProps {
  matchState: ClientMatchState;
  onLeave: () => void;
}

export function MatchEndModal({ matchState, onLeave }: MatchEndModalProps) {
  const router = useRouter();

  if (matchState.phase !== "match_end") return null;

  const you = matchState.players.find((p) => p.id === matchState.you.id);
  const opponent = matchState.players.find((p) => p.id === matchState.opponent.id);
  const isWinner = matchState.winnerId === matchState.you.id;
  const isTie = matchState.winnerId === null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md px-4"
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="w-full max-w-sm rounded-2xl border border-red-900/50 bg-gradient-to-b from-neutral-950 to-black p-8 text-center shadow-[0_0_60px_rgba(224,38,58,0.25)]"
        >
          <div className="text-[11px] uppercase tracking-[0.35em] text-neutral-500 mb-2">
            Match Complete
          </div>

          <div
            className={
              isTie
                ? "text-3xl font-black text-neutral-300 mb-4"
                : isWinner
                ? "text-4xl font-black text-amber-400 drop-shadow-[0_0_25px_rgba(250,204,21,0.6)] mb-4"
                : "text-4xl font-black text-red-500 drop-shadow-[0_0_25px_rgba(224,38,58,0.6)] mb-4"
            }
          >
            {isTie ? "It's a Tie" : isWinner ? "Victory" : "Defeat"}
          </div>

          <div className="flex items-center justify-center gap-6 mb-6">
            <div className="text-center">
              <div className="text-xs text-neutral-500 uppercase">You</div>
              <div className="text-2xl font-bold text-white">{you?.score ?? 0}</div>
            </div>
            <div className="text-neutral-600 text-sm">—</div>
            <div className="text-center">
              <div className="text-xs text-neutral-500 uppercase">
                {opponent?.name ?? "Opponent"}
              </div>
              <div className="text-2xl font-bold text-white">{opponent?.score ?? 0}</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            {matchState.roundSummaries.map((round) => (
              <div
                key={round.roundNumber}
                className="flex justify-between text-xs text-neutral-400 border-t border-neutral-800 pt-2"
              >
                <span>Round {round.roundNumber}</span>
                <span>
                  You +{round.pointsThisRound[matchState.you.id] ?? 0} · Opp +
                  {round.pointsThisRound[matchState.opponent.id] ?? 0}
                </span>
              </div>
            ))}
          </div>

          <Button
            variant="primary"
            fullWidth
            onClick={() => {
              onLeave();
              router.push("/");
            }}
          >
            Return to Lobby
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
