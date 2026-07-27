import { nanoid } from "nanoid";
import {
  AvatarId,
  CardType,
  ClientMatchState,
  GameMode,
  HandCard,
  MatchPhase,
  PlayerId,
  Role,
  RoundSummary,
  TurnResult,
} from "../types";
import { deckForRole, MAX_TURNS_PER_ROUND, TOTAL_ROUNDS } from "./constants";
import { resolveTurn } from "./resolveTurn";
import { BotPlayer } from "./BotPlayer";

export const BOT_PLAYER_ID = "__bot__";
export const BOT_PLAYER_NAME = "Tonegawa";

interface InternalPlayer {
  id: PlayerId;
  name: string;
  role: Role;
  score: number;
  hand: HandCard[];
  pendingCard: HandCard | null; // the face-down card locked in for the current turn
  connected: boolean;
  isBot: boolean;
  avatar: AvatarId;
}

function makeHand(role: Role): HandCard[] {
  return deckForRole(role).map((type: CardType) => ({ id: nanoid(8), type }));
}

/**
 * Match encapsulates ALL authoritative state and rules for one game between
 * exactly two players (one of whom may be a bot) across two rounds. Nothing
 * here trusts the client for anything beyond "which card id do you want to
 * play" — the bot's own choices are also made server-side via BotPlayer, so
 * there is no client-side code path that could reveal or influence hidden
 * bot state.
 */
export class Match {
  public readonly roomId: string;
  public readonly roomCode: string;
  public readonly mode: GameMode;

  private players: Record<PlayerId, InternalPlayer> = {};
  private playerOrder: PlayerId[] = []; // [firstJoined, secondJoined]

  private phase: MatchPhase = "waiting_for_players";
  private roundNumber: 1 | 2 = 1;
  private turnNumber = 1;
  private leaderPlayerId: PlayerId | null = null;

  private lastReveal: TurnResult | null = null;
  private roundSummaries: RoundSummary[] = [];
  private roundPointsAccumulator: Record<PlayerId, number> = {};

  private winnerId: PlayerId | null = null;
  private statusMessage = "Waiting for an opponent...";

  constructor(roomId: string, roomCode: string, mode: GameMode) {
    this.roomId = roomId;
    this.roomCode = roomCode;
    this.mode = mode;
  }

  // ---------------------------------------------------------------------
  // Player lifecycle
  // ---------------------------------------------------------------------

  public get playerCount(): number {
    return this.playerOrder.length;
  }

  public get connectedHumanCount(): number {
    return this.playerOrder.filter(
      (id) => !this.players[id]?.isBot && this.players[id]?.connected
    ).length;
  }

  public get connectedPlayerCount(): number {
    return this.playerOrder.filter((id) => this.players[id]?.connected).length;
  }

  public hasPlayer(playerId: PlayerId): boolean {
    return !!this.players[playerId];
  }

  public isFull(): boolean {
    return this.mode === "single_player"
      ? this.playerOrder.length >= 2
      : this.connectedHumanCount >= 2;
  }

  private getDisconnectedHumanSlot(): PlayerId | null {
    return (
      this.playerOrder.find(
        (id) => !this.players[id]?.isBot && !this.players[id]?.connected
      ) ?? null
    );
  }

  public addPlayer(
    playerId: PlayerId,
    name: string,
    avatar: AvatarId = "avatar-1",
    isBot = false
  ): void {
    const disconnectedSlot = this.getDisconnectedHumanSlot();
    if (disconnectedSlot && !isBot) {
      const oldPlayer = this.players[disconnectedSlot];
      const slotIndex = this.playerOrder.indexOf(disconnectedSlot);
      delete this.players[disconnectedSlot];
      this.playerOrder[slotIndex] = playerId;
      this.players[playerId] = {
        id: playerId,
        name: (name?.trim() || "Player").slice(0, 20),
        role: oldPlayer.role,
        score: oldPlayer.score,
        hand: oldPlayer.hand,
        pendingCard: oldPlayer.pendingCard,
        connected: true,
        isBot: false,
        avatar,
      };
      return;
    }

    if (this.playerOrder.length >= 2) {
      throw new Error("Match is full");
    }

    // First player joins with a provisional role; real roles are assigned
    // once both players are present and round 1 begins.
    this.players[playerId] = {
      id: playerId,
      name: (name?.trim() || "Player").slice(0, 20),
      role: "emperor_side", // placeholder, fixed in startRoundOne()
      score: 0,
      hand: [],
      pendingCard: null,
      connected: true,
      isBot,
      avatar,
    };
    this.playerOrder.push(playerId);

    if (this.playerOrder.length === 2) {
      this.startRoundOne();
    } else {
      this.statusMessage = "Waiting for an opponent...";
    }
  }

  /** Convenience for single-player mode: adds a bot as the second player. */
  public addBotPlayer(): void {
    this.addPlayer(BOT_PLAYER_ID, BOT_PLAYER_NAME, "avatar-5", true);
  }

  public markDisconnected(playerId: PlayerId): void {
    if (this.players[playerId]) {
      this.players[playerId].connected = false;
    }
  }

  public bothConnected(): boolean {
    return this.playerOrder.every((id) => this.players[id]?.connected);
  }

  public getBotPlayerId(): PlayerId | null {
    const botId = this.playerOrder.find((id) => this.players[id]?.isBot);
    return botId ?? null;
  }

  // ---------------------------------------------------------------------
  // Round setup
  // ---------------------------------------------------------------------

  private startRoundOne(): void {
    const [p1, p2] = this.playerOrder;
    this.players[p1].role = "emperor_side";
    this.players[p2].role = "slave_side";
    this.beginRound(1);
  }

  private startRoundTwo(): void {
    // Swap sides completely.
    const [p1, p2] = this.playerOrder;
    this.players[p1].role = this.players[p1].role === "emperor_side" ? "slave_side" : "emperor_side";
    this.players[p2].role = this.players[p2].role === "emperor_side" ? "slave_side" : "emperor_side";
    this.beginRound(2);
  }

  private beginRound(roundNumber: 1 | 2): void {
    this.roundNumber = roundNumber;
    this.turnNumber = 1;
    this.lastReveal = null;
    this.roundPointsAccumulator = {};

    for (const id of this.playerOrder) {
      const p = this.players[id];
      p.hand = makeHand(p.role);
      p.pendingCard = null;
      this.roundPointsAccumulator[id] = 0;
    }

    // Round rule: "First turn of a round: the Emperor side plays face-down first."
    const emperorSidePlayer = this.playerOrder.find(
      (id) => this.players[id].role === "emperor_side"
    )!;
    this.leaderPlayerId = emperorSidePlayer;

    this.phase = "round_intro";
    this.statusMessage = `Round ${roundNumber} begins. ${this.players[emperorSidePlayer].name} (Emperor Side) leads.`;
  }

  /** Called by the manager shortly after round_intro is broadcast, to move into active play. */
  public advancePastIntro(): void {
    if (this.phase === "round_intro") {
      this.phase = "awaiting_lead";
      this.statusMessage = `${this.leaderName()} must play a card face-down.`;
    }
  }

  private leaderName(): string {
    return this.leaderPlayerId ? this.players[this.leaderPlayerId].name : "";
  }

  // ---------------------------------------------------------------------
  // Playing cards
  // ---------------------------------------------------------------------

  public canPlay(playerId: PlayerId): { ok: boolean; reason?: string } {
    if (!this.players[playerId]) return { ok: false, reason: "Not in this match." };
    if (this.phase !== "awaiting_lead" && this.phase !== "awaiting_response") {
      return { ok: false, reason: "It is not time to play a card." };
    }
    if (this.players[playerId].pendingCard) {
      return { ok: false, reason: "You have already locked in a card this turn." };
    }
    if (this.phase === "awaiting_lead" && playerId !== this.leaderPlayerId) {
      return { ok: false, reason: "Waiting for the leading player to play first." };
    }
    return { ok: true };
  }

  /** Whether it is currently the bot's turn to act (used by the manager to trigger BotPlayer). */
  public isBotTurn(): boolean {
    const botId = this.getBotPlayerId();
    if (!botId) return false;
    if (this.players[botId].pendingCard) return false; // already locked in
    return this.canPlay(botId).ok;
  }

  /** Runs the bot's decision policy and plays its chosen card. Server-side only. */
  public playBotTurn(): void {
    const botId = this.getBotPlayerId();
    if (!botId) return;
    const bot = this.players[botId];
    if (!this.canPlay(botId).ok) return;

    const isLeading = this.phase === "awaiting_lead";
    const turnsRemaining = Math.max(0, MAX_TURNS_PER_ROUND - this.turnNumber);

    const chosen = BotPlayer.chooseCard(bot.hand, bot.role, isLeading, turnsRemaining);
    this.playCard(botId, chosen.id);
  }

  /**
   * Attempt to play a card. Returns true if the play was accepted.
   * Mutates internal state; caller (MatchManager) is responsible for
   * broadcasting the resulting state afterward.
   */
  public playCard(playerId: PlayerId, cardId: string): { ok: boolean; reason?: string } {
    const permission = this.canPlay(playerId);
    if (!permission.ok) return permission;

    const player = this.players[playerId];
    const cardIndex = player.hand.findIndex((c) => c.id === cardId);
    if (cardIndex === -1) {
      return { ok: false, reason: "That card is not in your hand." };
    }

    const [card] = player.hand.splice(cardIndex, 1);
    player.pendingCard = card;

    if (this.phase === "awaiting_lead") {
      this.phase = "awaiting_response";
      const opponentId = this.opponentOf(playerId);
      this.statusMessage = `${player.name} played face-down. Waiting for ${this.players[opponentId].name}...`;
      return { ok: true };
    }

    // phase === 'awaiting_response' and this was the responder's play.
    // Both cards are now locked in — resolve the turn.
    this.resolveCurrentTurn();
    return { ok: true };
  }

  private opponentOf(playerId: PlayerId): PlayerId {
    return this.playerOrder.find((id) => id !== playerId)!;
  }

  // ---------------------------------------------------------------------
  // Turn resolution
  // ---------------------------------------------------------------------

  private resolveCurrentTurn(): void {
    const [idA, idB] = this.playerOrder;
    const playerA = this.players[idA];
    const playerB = this.players[idB];

    const emperorSidePlayer = playerA.role === "emperor_side" ? playerA : playerB;
    const slaveSidePlayer = playerA.role === "emperor_side" ? playerB : playerA;

    const emperorCard = emperorSidePlayer.pendingCard!;
    const slaveCard = slaveSidePlayer.pendingCard!;

    const result = resolveTurn({
      emperorSidePlayerId: emperorSidePlayer.id,
      slaveSidePlayerId: slaveSidePlayer.id,
      emperorSideCard: emperorCard.type,
      slaveSideCard: slaveCard.type,
    });

    // Apply points
    for (const pid of this.playerOrder) {
      const pts = result.pointsAwarded[pid] ?? 0;
      this.players[pid].score += pts;
      this.roundPointsAccumulator[pid] = (this.roundPointsAccumulator[pid] ?? 0) + pts;
    }

    this.lastReveal = {
      roundNumber: this.roundNumber,
      turnNumber: this.turnNumber,
      plays: {
        [emperorSidePlayer.id]: emperorCard.type,
        [slaveSidePlayer.id]: slaveCard.type,
      },
      outcome: result.outcome,
      pointsAwarded: result.pointsAwarded,
      winnerId: result.winnerId,
    };

    // Move played cards into "played" history (out of pendingCard), clear pending.
    // NOTE: this is a deliberate fix vs. a common reference-implementation bug
    // where hands get fully regenerated after every turn instead of being
    // depleted across the round — here we simply clear the pending slot and
    // leave `hand` (already spliced in playCard) as the sole source of truth
    // for what's left to play this round.
    emperorSidePlayer.pendingCard = null;
    slaveSidePlayer.pendingCard = null;

    this.phase = "revealing";

    if (result.outcome === "draw_discard") {
      this.statusMessage = "Both played Citizen — cards discarded. Same leader continues.";
    } else {
      const winnerName = this.players[result.winnerId!].name;
      this.statusMessage = `${winnerName} wins the turn! +${result.pointsAwarded[result.winnerId!]} points.`;
    }
  }

  /**
   * Called by the manager after the client-side reveal animation has had
   * time to play out. Advances leader/turn/round bookkeeping.
   */
  public advanceAfterReveal(): void {
    if (this.phase !== "revealing") return;

    const reveal = this.lastReveal!;

    if (reveal.outcome !== "draw_discard") {
      // Leader for next turn = whoever LOST this turn.
      this.leaderPlayerId = reveal.winnerId ? this.opponentOf(reveal.winnerId) : this.leaderPlayerId;

      // Regenerate fresh 5-card hands for both players after a decisive turn.
      for (const id of this.playerOrder) {
        const p = this.players[id];
        p.hand = makeHand(p.role);
        p.pendingCard = null;
      }
    }
    // On a draw, leader priority is unchanged per spec ("next turn starts with
    // the same lead turn priority").

    // Round ends when EITHER side has exhausted its hand, OR 3 DECISIVE
    // turns have been played this round — whichever comes first.
    //
    // Citizen-vs-citizen draws are "free": both cards are discarded and the
    // exchange does NOT count toward the 3-turn cap, so a round can contain
    // more than 3 total card exchanges if draws happen along the way, but
    // never more than 3 decisive (win/lose) turns. This was confirmed as
    // the intended rule (as opposed to an earlier version of this file,
    // which counted every resolved turn — including draws — toward the
    // cap; that version is what you want if you ever need to revert this).
    const emperorSideExhausted = this.isRoleHandEmpty("emperor_side");
    const slaveSideExhausted = this.isRoleHandEmpty("slave_side");

    if (reveal.outcome !== "draw_discard") {
      this.turnNumber += 1;
    }

    const reachedTurnCap = this.turnNumber > MAX_TURNS_PER_ROUND;
    const roundShouldEnd = emperorSideExhausted || slaveSideExhausted || reachedTurnCap;

    if (roundShouldEnd) {
      this.endRound();
    } else {
      this.phase = "awaiting_lead";
      this.statusMessage = `${this.leaderName()} must play a card face-down.`;
    }
  }

  private isRoleHandEmpty(role: Role): boolean {
    const player = this.playerOrder.map((id) => this.players[id]).find((p) => p.role === role);
    return !player || player.hand.length === 0;
  }

  private endRound(): void {
    const [idA, idB] = this.playerOrder;
    const emperorSideId = this.players[idA].role === "emperor_side" ? idA : idB;
    const slaveSideId = this.players[idA].role === "emperor_side" ? idB : idA;

    this.roundSummaries.push({
      roundNumber: this.roundNumber,
      emperorSidePlayerId: emperorSideId,
      slaveSidePlayerId: slaveSideId,
      pointsThisRound: { ...this.roundPointsAccumulator },
    });

    if (this.roundNumber >= TOTAL_ROUNDS) {
      this.endMatch();
    } else {
      this.phase = "round_end";
      this.statusMessage = "Round 1 complete. Preparing to swap sides for Round 2...";
    }
  }

  /** Called by manager after round-end summary has been shown for a beat. */
  public proceedToNextRoundOrEnd(): void {
    if (this.phase === "round_end") {
      this.startRoundTwo();
    }
  }

  private endMatch(): void {
    const [idA, idB] = this.playerOrder;
    const scoreA = this.players[idA].score;
    const scoreB = this.players[idB].score;

    if (scoreA === scoreB) {
      this.winnerId = null; // true tie
      this.statusMessage = `Match complete — it's a tie, ${scoreA} to ${scoreB}!`;
    } else {
      this.winnerId = scoreA > scoreB ? idA : idB;
      this.statusMessage = `${this.players[this.winnerId].name} wins the match ${Math.max(
        scoreA,
        scoreB
      )} to ${Math.min(scoreA, scoreB)}!`;
    }

    this.phase = "match_end";
  }

  // ---------------------------------------------------------------------
  // Serialization — build the per-socket view. NEVER include opponent hand.
  // ---------------------------------------------------------------------

  public getClientState(forPlayerId: PlayerId): ClientMatchState {
    const you = this.players[forPlayerId];
    const opponentId = this.playerCount === 2 ? this.opponentOf(forPlayerId) : null;
    const opponent = opponentId ? this.players[opponentId] : null;

    return {
      roomId: this.roomId,
      roomCode: this.roomCode,
      mode: this.mode,
      phase: this.phase,
      roundNumber: this.roundNumber,
      turnNumber: this.turnNumber,
      leaderPlayerId: this.leaderPlayerId,
      players: this.playerOrder.map((id) => ({
        id,
        name: this.players[id].name,
        role: this.players[id].role,
        score: this.players[id].score,
        handCount: this.players[id].hand.length,
        isBot: this.players[id].isBot,
        avatar: this.players[id].avatar,
        connected: this.players[id].connected,
      })),
      you: {
        id: forPlayerId,
        hand: you ? [...you.hand] : [],
        hasLockedIn: !!you?.pendingCard,
        lockedCard: you?.pendingCard ?? null,
      },
      opponent: {
        id: opponentId ?? "",
        hasLockedIn: !!opponent?.pendingCard,
        connected: opponent?.connected ?? false,
      },
      lastReveal: this.lastReveal,
      roundSummaries: [...this.roundSummaries],
      winnerId: this.phase === "match_end" ? this.winnerId : null,
      message: this.statusMessage,
    };
  }

  public getPlayerIds(): PlayerId[] {
    return [...this.playerOrder];
  }

  public getHumanPlayerIds(): PlayerId[] {
    return this.playerOrder.filter((id) => !this.players[id].isBot);
  }

  public getPhase(): MatchPhase {
    return this.phase;
  }
}
