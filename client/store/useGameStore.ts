import { create } from "zustand";
import { ClientMatchState } from "@/types/game";

interface GameStoreState {
  connected: boolean;
  connecting: boolean;
  matchState: ClientMatchState | null;
  errorMessage: string | null;
  opponentDisconnected: boolean;
  selectedCardId: string | null;
  pendingRoomCode: string | null; // set right after create_room, before match_state arrives

  setConnected: (connected: boolean) => void;
  setConnecting: (connecting: boolean) => void;
  setMatchState: (state: ClientMatchState) => void;
  setErrorMessage: (msg: string | null) => void;
  setOpponentDisconnected: (val: boolean) => void;
  selectCard: (cardId: string | null) => void;
  setPendingRoomCode: (code: string | null) => void;
  reset: () => void;
}

/**
 * IMPORTANT: This store never computes a game outcome. It only stores
 * whatever the server most recently told us via `match_state`. All
 * card-vs-card resolution — including the bot's own decisions in
 * single-player mode — happens exclusively on the server
 * (see server/src/game/resolveTurn.ts and BotPlayer.ts). The client is a
 * renderer, not an authority. This is deliberate: a bluffing/hidden-
 * information game breaks completely the moment the client can compute or
 * peek at hidden state, and a client-side bot would be trivially
 * inspectable via devtools.
 */
export const useGameStore = create<GameStoreState>((set) => ({
  connected: false,
  connecting: false,
  matchState: null,
  errorMessage: null,
  opponentDisconnected: false,
  selectedCardId: null,
  pendingRoomCode: null,

  setConnected: (connected) => set({ connected }),
  setConnecting: (connecting) => set({ connecting }),
  setMatchState: (matchState) =>
    set((prev) => ({
      matchState,
      selectedCardId:
        matchState.you.hasLockedIn ||
        !matchState.you.hand.some((c) => c.id === prev.selectedCardId)
          ? null
          : prev.selectedCardId,
      opponentDisconnected:
        matchState.opponent.connected === true ? false : prev.opponentDisconnected,
    })),
  setErrorMessage: (errorMessage) => set({ errorMessage }),
  setOpponentDisconnected: (opponentDisconnected) => set({ opponentDisconnected }),
  selectCard: (selectedCardId) => set({ selectedCardId }),
  setPendingRoomCode: (pendingRoomCode) => set({ pendingRoomCode }),
  reset: () =>
    set({
      matchState: null,
      errorMessage: null,
      opponentDisconnected: false,
      selectedCardId: null,
      pendingRoomCode: null,
    }),
}));
