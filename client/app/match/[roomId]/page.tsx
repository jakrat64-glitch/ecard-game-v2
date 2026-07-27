"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { useGameStore } from "@/store/useGameStore";
import { GameBoard } from "@/components/game/GameBoard";
import { AssetPreloader } from "@/components/ui/AssetPreloader";
import { Button } from "@/components/ui/Button";
import { ClientMatchState } from "@/types/game";

export default function MatchPage() {
  const params = useParams<{ roomId: string }>();
  const router = useRouter();

  const matchState = useGameStore((s) => s.matchState);
  const setMatchState = useGameStore((s) => s.setMatchState);
  const errorMessage = useGameStore((s) => s.errorMessage);
  const setErrorMessage = useGameStore((s) => s.setErrorMessage);
  const opponentDisconnected = useGameStore((s) => s.opponentDisconnected);
  const setOpponentDisconnected = useGameStore((s) => s.setOpponentDisconnected);
  const reset = useGameStore((s) => s.reset);

  useEffect(() => {
    const socket = getSocket();

    const handleMatchState = (state: ClientMatchState) => {
      // Guard against stale state from a different room leaking in.
      if (state.roomId === params.roomId) {
        setMatchState(state);
        if (state.opponent.connected) {
          setOpponentDisconnected(false);
        }
      }
    };

    const handleError = (msg: string) => setErrorMessage(msg);
    const handleOpponentDisconnected = () => setOpponentDisconnected(true);

    socket.on("match_state", handleMatchState);
    socket.on("error_message", handleError);
    socket.on("opponent_disconnected", handleOpponentDisconnected);

    return () => {
      socket.off("match_state", handleMatchState);
      socket.off("error_message", handleError);
      socket.off("opponent_disconnected", handleOpponentDisconnected);
    };
  }, [params.roomId, setMatchState, setErrorMessage, setOpponentDisconnected]);

  const handleLockIn = (cardId: string) => {
    const socket = getSocket();
    socket.emit("play_card", { cardId });
  };

  const handleLeave = () => {
    const socket = getSocket();
    // Server only needs to know WHICH connection is leaving — it looks the
    // room up from the socket id, so no payload is required here. The
    // client-token-based "one active game per browser" lock is released
    // server-side once the match reaches match_end or the socket disconnects
    // (see MatchManager.sweep), so simply leaving frees it up on the next
    // sweep pass without needing to pass the token back explicitly.
    socket.emit("leave_match");
    reset();
  };

  if (!matchState) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-black gap-4 px-6">
        <div className="text-neutral-400 text-sm">Connecting to match...</div>
        <Button
          variant="secondary"
          onClick={() => {
            handleLeave();
            router.push("/");
          }}
        >
          Back to Lobby
        </Button>
      </div>
    );
  }

  return (
    <AssetPreloader>
      <div className="relative min-h-[100dvh] bg-black">
        <GameBoard matchState={matchState} onLockIn={handleLockIn} onLeave={handleLeave} />

        {/* Transient error toast */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              onAnimationComplete={() => {
                // auto-dismiss after showing briefly
                setTimeout(() => setErrorMessage(null), 2500);
              }}
              className="fixed top-4 left-1/2 -translate-x-1/2 z-[60] bg-red-950 border border-red-600/60 text-red-200 text-xs px-4 py-2 rounded-full shadow-lg"
            >
              {errorMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Opponent disconnected overlay */}
        <AnimatePresence>
          {opponentDisconnected && matchState.phase !== "match_end" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-md px-6"
            >
              <div className="text-center max-w-xs">
                <div className="text-red-500 text-xl font-bold mb-2">
                  Opponent Disconnected
                </div>
                <p className="text-neutral-400 text-sm mb-6">
                  Your opponent has left the match. You can return to the lobby to find a
                  new one.
                </p>
                <Button
                  variant="primary"
                  fullWidth
                  onClick={() => {
                    handleLeave();
                    router.push("/");
                  }}
                >
                  Return to Lobby
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AssetPreloader>
  );
}
