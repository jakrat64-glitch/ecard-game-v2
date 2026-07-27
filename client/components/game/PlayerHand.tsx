"use client";

import { motion } from "framer-motion";
import clsx from "clsx";
import { ClientMatchState } from "@/types/game";
import { useGameStore } from "@/store/useGameStore";
import { Card } from "./Card";
import { Button } from "@/components/ui/Button";
import { CARD_LABELS } from "@/lib/constants";

interface PlayerHandProps {
  matchState: ClientMatchState;
  onLockIn: (cardId: string) => void;
}

/**
 * Bottom zone: the player's own hand. Cards lift upward (translateY) when
 * selected. A dedicated "Lock In" button confirms the choice and sends it
 * to the server — tapping a card alone does NOT submit the play, which
 * prevents accidental taps from committing a card in a game where every
 * decision matters.
 */
export function PlayerHand({ matchState, onLockIn }: PlayerHandProps) {
  const { selectedCardId, selectCard } = useGameStore();

  const canSelect =
    (matchState.phase === "awaiting_lead" &&
      matchState.leaderPlayerId === matchState.you.id) ||
    (matchState.phase === "awaiting_response" &&
      matchState.leaderPlayerId !== matchState.you.id);

  const alreadyLocked = matchState.you.hasLockedIn;

  const handleCardTap = (cardId: string) => {
    if (!canSelect || alreadyLocked) return;
    selectCard(selectedCardId === cardId ? null : cardId);
  };

  const handleConfirm = () => {
    if (selectedCardId) {
      onLockIn(selectedCardId);
    }
  };

  const selectedCard = matchState.you.hand.find((c) => c.id === selectedCardId);

  return (
    <div className="w-full px-4 pb-6 pt-4 flex flex-col items-center gap-4">
      {/* Status line */}
      <div className="text-center text-xs text-neutral-400 min-h-[16px] px-4">
        {alreadyLocked
          ? "Card locked in. Waiting for reveal..."
          : canSelect
          ? "Choose a card to play face-down"
          : matchState.message}
      </div>

      {/* Hand */}
      <div className="w-full pb-1">
        <div className="flex items-end justify-center gap-2 sm:gap-3 flex-wrap">
          {matchState.you.hand.map((card) => {
            const isSelected = selectedCardId === card.id;
            return (
              <motion.button
                key={card.id}
                type="button"
                disabled={!canSelect || alreadyLocked}
                onClick={() => handleCardTap(card.id)}
                className={clsx(
                  "focus:outline-none",
                  (!canSelect || alreadyLocked) && "cursor-not-allowed"
                )}
                animate={{
                  y: isSelected ? -18 : 0,
                }}
                whileTap={canSelect && !alreadyLocked ? { scale: 0.96 } : undefined}
                transition={{ type: "spring", stiffness: 320, damping: 22 }}
              >
                <Card
                  type={card.type}
                  isFlipped={true}
                  size="md"
                  selected={isSelected}
                  dimmed={!canSelect || alreadyLocked}
                  glow={isSelected ? "gold" : "none"}
                />
                <div className="text-center text-[10px] mt-1 text-neutral-400 uppercase tracking-wide">
                  {CARD_LABELS[card.type]}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Lock-in action */}
      <div className="w-full flex justify-center pb-2">
        <Button
          variant="primary"
          disabled={!selectedCardId || alreadyLocked || !canSelect}
          onClick={handleConfirm}
          className="min-w-[180px]"
        >
          {alreadyLocked
            ? "Locked In"
            : selectedCard
            ? `Lock In ${CARD_LABELS[selectedCard.type]}`
            : "Select a Card"}
        </Button>
      </div>
    </div>
  );
}
