import { Server, Socket } from "socket.io";
import {
  ClientToServerEvents,
  CreateRoomPayload,
  JoinRoomPayload,
  PlayCardPayload,
  ServerToClientEvents,
  StartSinglePlayerPayload,
} from "../types";
import { matchManager } from "../game/MatchManager";
import { Match } from "../game/Match";
import { normalizeRoomCode } from "../game/roomCode";

type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;
type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;

// Timing constants for server-paced phase transitions. These give the
// client's animations room to breathe and prevent either player from being
// able to skip the "reveal" tension beat by being fast on the network.
const ROUND_INTRO_MS = 2200;
const REVEAL_HOLD_MS = 2600;
const ROUND_END_HOLD_MS = 3200;

// Bot "thinking" delay so the single-player mode doesn't feel like the bot
// is instantly reflexive — a beat of simulated deliberation sells the
// psychological tension better than an immediate response.
const BOT_THINK_MS_MIN = 700;
const BOT_THINK_MS_MAX = 1600;

function botThinkDelay(): number {
  return BOT_THINK_MS_MIN + Math.random() * (BOT_THINK_MS_MAX - BOT_THINK_MS_MIN);
}

function broadcastMatchState(io: TypedServer, roomId: string) {
  const match = matchManager.getMatch(roomId);
  if (!match) return;

  for (const playerId of match.getHumanPlayerIds()) {
    io.to(playerId).emit("match_state", match.getClientState(playerId));
  }
}

/**
 * If it's currently the bot's turn, schedule it to play after a short
 * "thinking" delay, then continue the normal reveal/round pacing exactly as
 * if a human had played. This is the single hook that makes single-player
 * mode reuse 100% of the same Match state machine multiplayer uses — the
 * bot is not a special case anywhere else in the code.
 */
function maybeTriggerBotTurn(io: TypedServer, match: Match) {
  if (!match.isBotTurn()) return;

  setTimeout(() => {
    // Re-check: the match/phase may have moved on (e.g. human disconnected).
    if (!match.isBotTurn()) return;
    match.playBotTurn();
    broadcastMatchState(io, match.roomId);
    handlePostPlayPacing(io, match);
  }, botThinkDelay());
}

/**
 * Shared pacing logic that runs after ANY play_card (human or bot) that
 * results in a reveal — advances phase transitions server-side so both
 * clients (or the single human client in single-player mode) stay in lockstep.
 */
function handlePostPlayPacing(io: TypedServer, match: Match) {
  if (match.getPhase() === "revealing") {
    setTimeout(() => {
      match.advanceAfterReveal();
      broadcastMatchState(io, match.roomId);

      if (match.getPhase() === "round_end") {
        setTimeout(() => {
          match.proceedToNextRoundOrEnd();
          broadcastMatchState(io, match.roomId);

          if (match.getPhase() === "round_intro") {
            setTimeout(() => {
              match.advancePastIntro();
              broadcastMatchState(io, match.roomId);
              maybeTriggerBotTurn(io, match);
            }, ROUND_INTRO_MS);
          }
        }, ROUND_END_HOLD_MS);
      } else {
        // Still mid-round, next turn's leader might be the bot.
        maybeTriggerBotTurn(io, match);
      }
    }, REVEAL_HOLD_MS);
  } else {
    // No reveal yet (this was just the lead half of the turn) — the
    // responder might be the bot.
    maybeTriggerBotTurn(io, match);
  }
}

export function registerSocketHandlers(io: TypedServer) {
  io.on("connection", (socket: TypedSocket) => {
    // We use the socket id directly as the playerId for simplicity. Each
    // socket joins a "room" named after its own id so we can emit directly
    // to a specific player via io.to(playerId) regardless of which Socket.io
    // room (match) they're also in.
    socket.join(socket.id);

    socket.on("create_room", (payload: CreateRoomPayload) => {
      const result = matchManager.createRoom(
        socket.id,
        payload?.name || "Player",
        payload?.avatar || "avatar-1",
        payload?.clientToken || ""
      );

      if (!result.ok) {
        socket.emit("error_message", result.reason);
        return;
      }

      socket.join(result.roomId);
      socket.emit("room_created", { roomId: result.roomId, roomCode: result.roomCode });
      broadcastMatchState(io, result.roomId);
    });

    socket.on("join_room", (payload: JoinRoomPayload) => {
      const code = normalizeRoomCode(payload?.roomCode || "");
      const result = matchManager.joinRoom(
        socket.id,
        payload?.name || "Player",
        payload?.avatar || "avatar-1",
        code,
        payload?.clientToken || ""
      );

      if (!result.ok) {
        socket.emit("error_message", result.reason);
        return;
      }

      socket.join(result.roomId);
      const match = matchManager.getMatch(result.roomId);
      if (!match) return;

      broadcastMatchState(io, result.roomId);

      if (match.playerCount === 2 && match.getPhase() === "round_intro") {
        setTimeout(() => {
          match.advancePastIntro();
          broadcastMatchState(io, result.roomId);
          maybeTriggerBotTurn(io, match);
        }, ROUND_INTRO_MS);
      }
    });

    socket.on("start_single_player", (payload: StartSinglePlayerPayload) => {
      const result = matchManager.createSinglePlayerRoom(
        socket.id,
        payload?.name || "Player",
        payload?.avatar || "avatar-1",
        payload?.clientToken || ""
      );

      if (!result.ok) {
        socket.emit("error_message", result.reason);
        return;
      }

      socket.join(result.roomId);
      socket.emit("room_created", { roomId: result.roomId, roomCode: result.roomCode });

      const match = matchManager.getMatch(result.roomId);
      if (!match) return;

      broadcastMatchState(io, result.roomId);

      if (match.getPhase() === "round_intro") {
        setTimeout(() => {
          match.advancePastIntro();
          broadcastMatchState(io, result.roomId);
          maybeTriggerBotTurn(io, match);
        }, ROUND_INTRO_MS);
      }
    });

    socket.on("play_card", (payload: PlayCardPayload) => {
      const match = matchManager.getMatchForPlayer(socket.id);
      if (!match) {
        socket.emit("error_message", "You are not currently in a match.");
        return;
      }

      const result = match.playCard(socket.id, payload?.cardId);
      if (!result.ok) {
        socket.emit("error_message", result.reason || "Invalid play.");
        return;
      }

      broadcastMatchState(io, match.roomId);
      handlePostPlayPacing(io, match);
    });

    socket.on("leave_match", () => {
      const match = matchManager.getMatchForPlayer(socket.id);
      matchManager.removePlayer(socket.id);
      if (match) {
        for (const pid of match.getHumanPlayerIds()) {
          if (pid !== socket.id) {
            io.to(pid).emit("opponent_disconnected");
          }
        }
        broadcastMatchState(io, match.roomId);
      }
    });

    socket.on("disconnect", () => {
      const match = matchManager.getMatchForPlayer(socket.id);
      matchManager.removePlayer(socket.id);
      if (match) {
        for (const pid of match.getHumanPlayerIds()) {
          if (pid !== socket.id) {
            io.to(pid).emit("opponent_disconnected");
          }
        }
      }
    });
  });

  // Periodic cleanup of finished/abandoned matches.
  setInterval(() => matchManager.sweep(), 60_000);
}
