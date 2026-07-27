// ============================================================================
// CORE GAME TYPES — the single source of truth for shape of game state.
// Client-side types/game.ts mirrors this file exactly.
// ============================================================================

export type CardType = "citizen" | "emperor" | "slave";

export type Role = "emperor_side" | "slave_side";

export type PlayerId = string;

export type GameMode = "single_player" | "multiplayer";

export type AvatarId =
  | "avatar-1"
  | "avatar-2"
  | "avatar-3"
  | "avatar-4"
  | "avatar-5";

/**
 * A card instance in a player's hand.
 * `id` is unique per card so React/client can key + animate reliably,
 * `type` is the actual rank used for resolution.
 */
export interface HandCard {
  id: string;
  type: CardType;
}

export type MatchPhase =
  | "waiting_for_players"   // room open, waiting for 2nd player
  | "round_intro"           // showing "Round 1 - You are Emperor Side" banner
  | "awaiting_lead"         // waiting for the "must lead" player to submit a face-down card
  | "awaiting_response"     // lead card locked in, waiting for the other player
  | "revealing"             // both cards locked, server has resolved outcome, playing reveal anim
  | "turn_result"           // reveal finished, showing point delta before advancing
  | "round_end"             // round finished, showing round summary before round 2
  | "match_end";            // match finished, showing final winner

/**
 * Per-round, per-player bookkeeping.
 */
export interface RoundState {
  roundNumber: 1 | 2;
  /** Which player currently must play face-down first this turn. */
  leaderPlayerId: PlayerId;
  turnNumber: number; // 1-indexed, max 3 non-discarded/resolved turns per round conceptually,
                        // but citizen-vs-citizen discards don't consume a "turn slot" toward the cap—
                        // see Match.ts for the precise increment rules.
  /** Cards each player has already played (face-up, historical) this round. */
  playedThisRound: Record<PlayerId, HandCard[]>;
  /** Cards currently locked face-down for the active turn, not yet revealed. */
  pendingPlay: Record<PlayerId, HandCard | null>;
}

export interface PlayerPublicState {
  id: PlayerId;
  name: string;
  role: Role;
  score: number;
  handCount: number; // opponent should only ever see a COUNT, never the actual cards
  isBot: boolean;
  avatar: AvatarId;
  connected: boolean;
}

/**
 * The full state broadcast to a specific socket. Note that `yourHand` is only
 * ever populated with that socket's OWN cards — never the opponent's.
 */
export interface ClientMatchState {
  roomId: string;
  roomCode: string;
  mode: GameMode;
  phase: MatchPhase;
  roundNumber: 1 | 2;
  turnNumber: number;
  leaderPlayerId: PlayerId | null;
  players: PlayerPublicState[];
  you: {
    id: PlayerId;
    hand: HandCard[];
    hasLockedIn: boolean;
    lockedCard: HandCard | null; // your own locked card - fine to show to yourself
  };
  opponent: {
    id: PlayerId;
    hasLockedIn: boolean;
    connected: boolean;
  };
  lastReveal: TurnResult | null;
  roundSummaries: RoundSummary[];
  winnerId: PlayerId | null; // set only when phase === 'match_end'
  message: string; // human-readable status text for the current phase
}

export interface TurnResult {
  roundNumber: 1 | 2;
  turnNumber: number;
  plays: Record<PlayerId, CardType>;
  outcome: "emperor_side_wins" | "slave_side_wins" | "draw_discard";
  pointsAwarded: Record<PlayerId, number>;
  winnerId: PlayerId | null;
}

export interface RoundSummary {
  roundNumber: 1 | 2;
  emperorSidePlayerId: PlayerId;
  slaveSidePlayerId: PlayerId;
  pointsThisRound: Record<PlayerId, number>;
}

// ---- Socket event payload contracts ----

export interface CreateRoomPayload {
  name: string;
  avatar?: AvatarId;
  clientToken: string;
}

export interface JoinRoomPayload {
  name: string;
  avatar?: AvatarId;
  roomCode: string;
  clientToken: string;
}

export interface StartSinglePlayerPayload {
  name: string;
  avatar?: AvatarId;
  clientToken: string;
}

export interface PlayCardPayload {
  cardId: string;
}

export interface RoomCreatedPayload {
  roomId: string;
  roomCode: string;
}

export interface ServerToClientEvents {
  match_state: (state: ClientMatchState) => void;
  room_created: (payload: RoomCreatedPayload) => void;
  error_message: (msg: string) => void;
  opponent_disconnected: () => void;
}

export interface ClientToServerEvents {
  create_room: (payload: CreateRoomPayload) => void;
  join_room: (payload: JoinRoomPayload) => void;
  start_single_player: (payload: StartSinglePlayerPayload) => void;
  play_card: (payload: PlayCardPayload) => void;
  leave_match: () => void;
}
