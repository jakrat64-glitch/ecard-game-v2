"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { getSocket } from "@/lib/socket";
import { getClientToken } from "@/lib/clientToken";
import { useGameStore } from "@/store/useGameStore";
import { Button } from "@/components/ui/Button";
import { AssetPreloader } from "@/components/ui/AssetPreloader";
import { ClientMatchState, RoomCreatedPayload, AvatarId } from "@/types/game";
import { AVATAR_ASSETS, AVATAR_LABELS, AVATAR_LIST } from "@/lib/constants";
import Link from "next/link";

type LobbyView = "menu" | "single_player_name" | "create_room" | "join_room";

export default function LobbyPage() {
  const router = useRouter();
  const [view, setView] = useState<LobbyView>("menu");
  const [name, setName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<AvatarId>("avatar-1");

  const setMatchState = useGameStore((s) => s.setMatchState);

  useEffect(() => {
    const socket = getSocket();

    const handleMatchState = (state: ClientMatchState) => {
      setMatchState(state);
      if (state.players.length === 2) {
        router.push(`/match/${state.roomId}`);
      }
    };

    const handleRoomCreated = (payload: RoomCreatedPayload) => {
      setCreatedCode(payload.roomCode);
      setBusy(false);
    };

    const handleError = (msg: string) => {
      setError(msg);
      setBusy(false);
    };

    socket.on("match_state", handleMatchState);
    socket.on("room_created", handleRoomCreated);
    socket.on("error_message", handleError);

    return () => {
      socket.off("match_state", handleMatchState);
      socket.off("room_created", handleRoomCreated);
      socket.off("error_message", handleError);
    };
  }, [router, setMatchState]);

  const handleStartSinglePlayer = () => {
    setError(null);
    setBusy(true);
    const socket = getSocket();
    socket.emit("start_single_player", {
      name: name.trim() || "Player",
      avatar,
      clientToken: getClientToken(),
    });
  };

  const handleCreateRoom = () => {
    setError(null);
    setBusy(true);
    const socket = getSocket();
    socket.emit("create_room", {
      name: name.trim() || "Player",
      avatar,
      clientToken: getClientToken(),
    });
  };

  const handleJoinRoom = () => {
    setError(null);
    if (!roomCodeInput.trim()) {
      setError("Enter a room code first.");
      return;
    }
    setBusy(true);
    const socket = getSocket();
    socket.emit("join_room", {
      name: name.trim() || "Player",
      avatar,
      roomCode: roomCodeInput.trim(),
      clientToken: getClientToken(),
    });
  };

  const avatarPicker = (
    <div className="space-y-2">
      <div className="text-xs uppercase tracking-[0.4em] text-neutral-500 text-center">
        Choose a profile icon
      </div>
      <div className="grid grid-cols-5 gap-2">
        {AVATAR_LIST.map((avatarId) => (
          <button
            key={avatarId}
            type="button"
            onClick={() => setAvatar(avatarId)}
            className={
              `relative overflow-hidden rounded-2xl border transition-all focus:outline-none ` +
              (avatarId === avatar
                ? "border-amber-400 shadow-[0_0_18px_rgba(250,204,21,0.35)]"
                : "border-neutral-800 bg-neutral-950/70 hover:border-neutral-600")
            }
          >
            <div className="w-full aspect-square">
              <Image
                src={AVATAR_ASSETS[avatarId]}
                alt={AVATAR_LABELS[avatarId]}
                width={80}
                height={80}
                className="object-cover"
              />
            </div>
            <span className="sr-only">{AVATAR_LABELS[avatarId]}</span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <AssetPreloader>
      <main className="relative min-h-[100dvh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Background ambiance */}
        <div className="pointer-events-none fixed inset-0">
          <div className="absolute inset-0 bg-black" />
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(circle at 50% 20%, rgba(120,10,20,0.3), transparent 55%)",
            }}
          />
          <div
            className="absolute inset-0"
            style={{ boxShadow: "inset 0 0 180px 50px rgba(0,0,0,0.95)" }}
          />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative z-10 w-full max-w-sm flex flex-col items-center"
        >
          <div className="mb-1 text-xs uppercase tracking-[0.4em] text-red-600/80">
            Kaiji Presents
          </div>
          <h1
            className="text-5xl font-black mb-2 text-center tracking-tight"
            style={{ fontFamily: "var(--font-display)" }}
          >
            <span className="text-white">E-</span>
            <span className="text-red-600 drop-shadow-[0_0_25px_rgba(224,38,58,0.6)]">
              CARD
            </span>
          </h1>
          <p className="text-neutral-500 text-sm text-center mb-10 leading-relaxed">
            Emperor. Citizen. Slave.
            <br />
            One card decides everything.
          </p>

          <div className="w-full">
            <AnimatePresence mode="wait">
              {view === "menu" && (
                <motion.div
                  key="menu"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-3"
                >
                  <Button
                    variant="primary"
                    fullWidth
                    onClick={() => {
                      setError(null);
                      setView("single_player_name");
                    }}
                  >
                    Single Player · vs Bot
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setError(null);
                      setView("create_room");
                    }}
                  >
                    Create Room
                  </Button>
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      setError(null);
                      setView("join_room");
                    }}
                  >
                    Join Room
                  </Button>
                  <Button variant="danger" fullWidth disabled>
                    Tournament · Coming Soon
                  </Button>

                  <div className="pt-4 text-center">
                    <Link
                      href="/rules"
                      className="text-neutral-500 hover:text-neutral-300 text-xs uppercase tracking-widest underline underline-offset-4 transition-colors"
                    >
                      How to Play
                    </Link>
                  </div>
                </motion.div>
              )}

              {view === "single_player_name" && (
                <motion.div
                  key="sp"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                    disabled={busy}
                    autoFocus
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600/60 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 outline-none transition-colors disabled:opacity-50"
                  />
                  {avatarPicker}
                  <Button
                    variant="primary"
                    fullWidth
                    disabled={busy}
                    onClick={handleStartSinglePlayer}
                  >
                    {busy ? "Starting..." : "Face the Bot"}
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => setView("menu")}>
                    Back
                  </Button>
                </motion.div>
              )}

              {view === "create_room" && (
                <motion.div
                  key="create"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  {!createdCode ? (
                    <>
                      <input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter your name"
                        maxLength={20}
                        disabled={busy}
                        autoFocus
                        className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600/60 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 outline-none transition-colors disabled:opacity-50"
                      />
                      {avatarPicker}
                      <Button
                        variant="primary"
                        fullWidth
                        disabled={busy}
                        onClick={handleCreateRoom}
                      >
                        {busy ? "Creating..." : "Create Room"}
                      </Button>
                      <Button variant="secondary" fullWidth onClick={() => setView("menu")}>
                        Back
                      </Button>
                    </>
                  ) : (
                    <div className="text-center space-y-4">
                      <p className="text-neutral-400 text-sm">
                        Share this code with your opponent:
                      </p>
                      <div className="text-4xl font-black tracking-[0.3em] text-amber-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)] py-4 border-2 border-amber-500/40 rounded-xl bg-black/40">
                        {createdCode}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-neutral-500 text-xs uppercase tracking-widest">
                        <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse-glow" />
                        Waiting for your opponent to join...
                      </div>
                    </div>
                  )}
                </motion.div>
              )}

              {view === "join_room" && (
                <motion.div
                  key="join"
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -12 }}
                  className="space-y-4"
                >
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={20}
                    disabled={busy}
                    autoFocus
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-red-600/60 rounded-xl px-4 py-3 text-white placeholder:text-neutral-600 outline-none transition-colors disabled:opacity-50"
                  />
                  {avatarPicker}
                  <input
                    type="text"
                    value={roomCodeInput}
                    onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
                    placeholder="Room code"
                    maxLength={6}
                    disabled={busy}
                    className="w-full bg-neutral-950 border border-neutral-800 focus:border-amber-500/60 rounded-xl px-4 py-3 text-white text-center text-lg tracking-[0.3em] placeholder:text-neutral-600 placeholder:tracking-normal placeholder:text-base outline-none transition-colors disabled:opacity-50 uppercase"
                  />
                  <Button variant="primary" fullWidth disabled={busy} onClick={handleJoinRoom}>
                    {busy ? "Joining..." : "Join Room"}
                  </Button>
                  <Button variant="secondary" fullWidth onClick={() => setView("menu")}>
                    Back
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-red-500 text-xs text-center pt-4"
              >
                {error}
              </motion.div>
            )}
          </div>

          <div className="mt-12 text-center text-[10px] text-neutral-600 leading-relaxed max-w-xs">
            2 rounds. Sides swap after round 1. Highest total score wins.
            Emperor &amp; Citizen wins score 1pt · Slave wins score 3pts.
          </div>
        </motion.div>
      </main>
    </AssetPreloader>
  );
}
