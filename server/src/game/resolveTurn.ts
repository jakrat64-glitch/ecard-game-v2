import { CardType, PlayerId } from "../types";
import { POINTS_FOR_WIN } from "./constants";

export type TurnOutcome = "emperor_side_wins" | "slave_side_wins" | "draw_discard";

export interface ResolveTurnInput {
  emperorSidePlayerId: PlayerId;
  slaveSidePlayerId: PlayerId;
  emperorSideCard: CardType;
  slaveSideCard: CardType;
}

export interface ResolveTurnOutput {
  outcome: TurnOutcome;
  winnerId: PlayerId | null;
  pointsAwarded: Record<PlayerId, number>;
}

/**
 * Pure resolution of a single card-vs-card turn.
 *
 * Hierarchy:
 *   citizen > slave
 *   emperor > citizen
 *   slave   > emperor
 *   citizen == citizen (draw, both discarded)
 *
 * Note: within a single round there is exactly one Emperor and exactly one
 * Slave in the whole match (one per side), so Emperor-vs-Slave and
 * Emperor-vs-Emperor / Slave-vs-Slave across the two specific sides cannot
 * happen in practice — each side only ever has ONE special card and the rest
 * are Citizens — but we resolve generically off card type vs card type so the
 * logic is correct regardless of which side holds which card (this matters
 * in Round 2 after sides swap).
 */
export function resolveTurn(input: ResolveTurnInput): ResolveTurnOutput {
  const { emperorSidePlayerId, slaveSidePlayerId, emperorSideCard, slaveSideCard } = input;

  const winner = beats(emperorSideCard, slaveSideCard);

  const pointsAwarded: Record<PlayerId, number> = {
    [emperorSidePlayerId]: 0,
    [slaveSidePlayerId]: 0,
  };

  if (winner === "draw") {
    return { outcome: "draw_discard", winnerId: null, pointsAwarded };
  }

  if (winner === "a") {
    // emperor-side player's card won
    const pts = POINTS_FOR_WIN[emperorSideCard];
    pointsAwarded[emperorSidePlayerId] = pts;
    return { outcome: "emperor_side_wins", winnerId: emperorSidePlayerId, pointsAwarded };
  }

  // winner === 'b' -> slave-side player's card won
  const pts = POINTS_FOR_WIN[slaveSideCard];
  pointsAwarded[slaveSidePlayerId] = pts;
  return { outcome: "slave_side_wins", winnerId: slaveSidePlayerId, pointsAwarded };
}

/**
 * Generic card-vs-card comparator.
 * Returns 'a' if cardA beats cardB, 'b' if cardB beats cardA, 'draw' if tied.
 *
 *  citizen beats slave
 *  emperor beats citizen
 *  slave   beats emperor
 *  citizen vs citizen -> draw
 */
function beats(cardA: CardType, cardB: CardType): "a" | "b" | "draw" {
  if (cardA === cardB) {
    // citizen vs citizen -> draw. (emperor vs emperor / slave vs slave
    // cannot occur given deck composition, but if it ever did, treat as draw too.)
    return "draw";
  }

  const winTable: Record<CardType, CardType> = {
    citizen: "slave",   // citizen beats slave
    emperor: "citizen",  // emperor beats citizen
    slave: "emperor",   // slave beats emperor
  };

  if (winTable[cardA] === cardB) return "a";
  if (winTable[cardB] === cardA) return "b";

  // Should be unreachable given only 3 card types and the table above being
  // a complete cycle, but fall back to draw defensively.
  return "draw";
}
