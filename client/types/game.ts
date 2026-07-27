// ============================================================================
// Mirrors server/src/types.ts exactly. Kept as a separate file (rather than
// a shared package) to keep this a simple two-folder project — in a larger
// monorepo this would live in a shared `packages/types` workspace instead.
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

export interface HandCard {
  id: string;
  type: CardType;
}

export type MatchPhase =
  | "waiting_for_players"
  | "round_intro"
  | "awaiting_lead"
  | "awaiting_response"
  | "revealing"
  | "turn_result"
  | "round_end"
  | "match_end";

export interface PlayerPublicState {
  id: PlayerId;
  name: string;
  role: Role;
  score: number;
  handCount: number;
  isBot: boolean;
  avatar: AvatarId;
  connected: boolean;
}

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
    lockedCard: HandCard | null;
  };
  opponent: {
    id: PlayerId;
    hasLockedIn: boolean;
    connected: boolean;
  };
  lastReveal: TurnResult | null;
  roundSummaries: RoundSummary[];
  winnerId: PlayerId | null;
  message: string;
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
