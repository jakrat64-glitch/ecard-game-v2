import { CardType, HandCard, Role } from "../types";

/**
 * BotPlayer encapsulates the decision policy for the single-player "vs bot"
 * mode. It runs entirely server-side (inside the same Match state machine
 * a human opponent would use) so there's no special-cased client bypass —
 * the bot is just another PlayerId to the rest of the system.
 *
 * Decision policy (intentionally simple but not naive):
 *  - If the bot is the LEADER: it should generally lead with a Citizen to
 *    probe/bait, holding its special card (Emperor/Slave) back, UNLESS it's
 *    down to its last couple of cards where holding no longer matters.
 *  - If the bot is RESPONDING to a human's face-down lead: it has no visual
 *    information (this is a game of hidden information — the bot doesn't
 *    get to peek), so its response is a weighted random choice biased by
 *    how many turns are left and how many special cards remain unplayed.
 *
 * This is deliberately NOT a minimax/game-theoretic optimal solver — this
 * is a psychological bluffing game and true optimal play involves modeling
 * the opponent's tendencies, which is out of scope. The goal here is a bot
 * that feels reasonably competent and doesn't throw away its Emperor/Slave
 * card on turn 1 every single game, not a perfect-information solver.
 */
export class BotPlayer {
  /**
   * Choose which card to play from the bot's current hand.
   *
   * @param hand The bot's remaining hand this round.
   * @param role The bot's role this round.
   * @param isLeading Whether the bot must lead (play first, blind) this turn.
   * @param turnsRemainingInRound Roughly how many turns are left in the round
   *        (used to decide whether it's time to stop holding the special card).
   */
  public static chooseCard(
    hand: HandCard[],
    role: Role,
    isLeading: boolean,
    turnsRemainingInRound: number
  ): HandCard {
    if (hand.length === 1) {
      // No decision to make.
      return hand[0];
    }

    const specialType: CardType = role === "emperor_side" ? "emperor" : "slave";
    const specialCard = hand.find((c) => c.type === specialType) ?? null;
    const citizenCards = hand.filter((c) => c.type === "citizen");

    // Late in the round (last turn or two) and the special card is still
    // sitting in hand — it's now-or-never, so playing it becomes relatively
    // more attractive since holding it further risks it never getting used.
    const isLateRound = turnsRemainingInRound <= 1;

    if (isLeading) {
      // Leading with the special card face-down is usually a bad idea early
      // (it telegraphs nothing since the opponent can't see it either, but
      // it does commit the bot's best card before gathering any information
      // about how the human is playing). Prefer citizens while they last,
      // unless it's late and citizens are what's left driving toward a draw.
      if (citizenCards.length > 0 && !(isLateRound && specialCard)) {
        return pickRandom(citizenCards);
      }
      if (specialCard) return specialCard;
      return pickRandom(hand);
    }

    // Responding to a blind human lead. The bot has no information about
    // what was just played (true hidden information), so the choice is a
    // weighted random pick: mostly citizens, with rising odds of playing
    // the special card as the round runs out of turns (since an unplayed
    // special card contributes nothing to the score).
    const specialWeight = isLateRound ? 0.55 : 0.2;
    if (specialCard && Math.random() < specialWeight) {
      return specialCard;
    }
    if (citizenCards.length > 0) {
      return pickRandom(citizenCards);
    }
    return pickRandom(hand);
  }
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
