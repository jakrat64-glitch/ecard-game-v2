import { nanoid } from "nanoid";
import { AvatarId, PlayerId } from "../types";
import { Match } from "./Match";
import { generateRoomCode } from "./roomCode";

interface CreateRoomResult {
  ok: true;
  roomId: string;
  roomCode: string;
}

interface CreateRoomError {
  ok: false;
  reason: string;
}

/**
 * MatchManager owns:
 *  1. A registry of active Match instances keyed by roomId.
 *  2. A lookup from short human-friendly roomCode -> roomId, for the
 *     "create a room, share the code" multiplayer flow.
 *  3. A lookup from playerId (socket id) -> roomId, so socket events route
 *     to the right match.
 *  4. A lookup from clientToken -> roomId, enforcing "one active game per
 *     browser" — a browser-generated token (persisted client-side) that we
 *     refuse to let join/create a second concurrent room while already in
 *     one that hasn't ended.
 *
 * NOTE: This is in-memory and therefore pinned to a single Node process.
 * For horizontal scaling, swap this for a Redis-backed store + the
 * Socket.io Redis adapter, and persist Match snapshots so a match can be
 * reconstructed on any node.
 */
export class MatchManager {
  private matches: Map<string, Match> = new Map();
  private roomCodeToRoomId: Map<string, string> = new Map();
  private playerToRoom: Map<PlayerId, string> = new Map();
  private playerTokenByPlayerId: Map<PlayerId, string> = new Map();
  private clientTokenToRoom: Map<string, string> = new Map();

  // -----------------------------------------------------------------
  // One-game-per-browser enforcement
  // -----------------------------------------------------------------

  /**
   * Returns the roomId a given clientToken is already active in, if that
   * room still exists and hasn't finished. Returns null if the token is
   * free to start/join a new game.
   */
  public activeRoomForToken(clientToken: string): string | null {
    const roomId = this.clientTokenToRoom.get(clientToken);
    if (!roomId) return null;
    const match = this.matches.get(roomId);
    if (!match || match.getPhase() === "match_end") {
      this.clientTokenToRoom.delete(clientToken);
      return null;
    }
    return roomId;
  }

  private bindClientToken(clientToken: string, roomId: string, playerId: PlayerId): void {
    this.clientTokenToRoom.set(clientToken, roomId);
    this.playerTokenByPlayerId.set(playerId, clientToken);
  }

  private unbindClientTokenForPlayer(playerId: PlayerId): void {
    const token = this.playerTokenByPlayerId.get(playerId);
    if (!token) return;
    this.playerTokenByPlayerId.delete(playerId);
    if (this.clientTokenToRoom.get(token)) {
      this.clientTokenToRoom.delete(token);
    }
  }

  // -----------------------------------------------------------------
  // Multiplayer: create / join by room code
  // -----------------------------------------------------------------

  public createRoom(
    playerId: PlayerId,
    name: string,
    avatar: AvatarId,
    clientToken: string
  ): CreateRoomResult | CreateRoomError {
    const existingRoom = this.activeRoomForToken(clientToken);
    if (existingRoom) {
      return { ok: false, reason: "You already have an active game in this browser." };
    }

    const roomId = nanoid(12);
    let roomCode = generateRoomCode();
    // Extremely unlikely collision given the alphabet/length, but guard anyway.
    while (this.roomCodeToRoomId.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    const match = new Match(roomId, roomCode, "multiplayer");
    match.addPlayer(playerId, name, avatar as any);

    this.matches.set(roomId, match);
    this.roomCodeToRoomId.set(roomCode, roomId);
    this.playerToRoom.set(playerId, roomId);
    this.bindClientToken(clientToken, roomId, playerId);

    return { ok: true, roomId, roomCode };
  }

  public joinRoom(
    playerId: PlayerId,
    name: string,
    avatar: AvatarId,
    roomCode: string,
    clientToken: string
  ): { ok: true; roomId: string } | CreateRoomError {
    const existingRoom = this.activeRoomForToken(clientToken);
    if (existingRoom) {
      return { ok: false, reason: "You already have an active game in this browser." };
    }

    const roomId = this.roomCodeToRoomId.get(roomCode);
    if (!roomId) {
      return { ok: false, reason: "No room found with that code." };
    }

    const match = this.matches.get(roomId);
    if (!match) {
      return { ok: false, reason: "That room no longer exists." };
    }

    if (match.isFull()) {
      return { ok: false, reason: "That room is already full." };
    }

    match.addPlayer(playerId, name, avatar as any);
    this.playerToRoom.set(playerId, roomId);
    this.bindClientToken(clientToken, roomId, playerId);

    return { ok: true, roomId };
  }

  // -----------------------------------------------------------------
  // Single player vs bot
  // -----------------------------------------------------------------

  public createSinglePlayerRoom(
    playerId: PlayerId,
    name: string,
    avatar: AvatarId,
    clientToken: string
  ): CreateRoomResult | CreateRoomError {
    const existingRoom = this.activeRoomForToken(clientToken);
    if (existingRoom) {
      return { ok: false, reason: "You already have an active game in this browser." };
    }

    const roomId = nanoid(12);
    const roomCode = generateRoomCode();

    const match = new Match(roomId, roomCode, "single_player");
    match.addPlayer(playerId, name, avatar as any);
    match.addBotPlayer();

    this.matches.set(roomId, match);
    this.playerToRoom.set(playerId, roomId);
    this.bindClientToken(clientToken, roomId, playerId);

    return { ok: true, roomId, roomCode };
  }

  // -----------------------------------------------------------------
  // Lookups
  // -----------------------------------------------------------------

  public getMatchForPlayer(playerId: PlayerId): Match | null {
    const roomId = this.playerToRoom.get(playerId);
    if (!roomId) return null;
    return this.matches.get(roomId) ?? null;
  }

  public getMatch(roomId: string): Match | null {
    return this.matches.get(roomId) ?? null;
  }

  public removePlayer(playerId: PlayerId): void {
    const roomId = this.playerToRoom.get(playerId);
    if (roomId) {
      const match = this.matches.get(roomId);
      match?.markDisconnected(playerId);
    }
    this.unbindClientTokenForPlayer(playerId);
    this.playerToRoom.delete(playerId);
  }

  /** Cleanup fully-finished or empty matches. Call periodically. */
  public sweep(): void {
    for (const [roomId, match] of this.matches.entries()) {
      const phase = match.getPhase();
      const noHumansLeft = match.getHumanPlayerIds().every(
        (id) => !this.playerToRoom.has(id)
      );
      const stale = phase === "match_end" || noHumansLeft;
      if (stale) {
        for (const pid of match.getPlayerIds()) {
          this.playerToRoom.delete(pid);
        }
        this.roomCodeToRoomId.delete(match.roomCode);
        this.matches.delete(roomId);
      }
    }

    // Also clear any client-token bindings pointing at rooms that no longer exist.
    for (const [token, roomId] of this.clientTokenToRoom.entries()) {
      if (!this.matches.has(roomId)) {
        this.clientTokenToRoom.delete(token);
      }
    }
  }
}

export const matchManager = new MatchManager();
