"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, ArrowLeft } from "lucide-react";

export default function TournamentPage() {
  return (
    <main className="relative min-h-[100dvh] bg-black text-white flex flex-col items-center justify-center px-6">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 40%, rgba(120,10,20,0.25), transparent 55%)",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 flex flex-col items-center text-center max-w-xs"
      >
        <div className="w-16 h-16 rounded-full border-2 border-amber-500/50 bg-black/40 flex items-center justify-center mb-6">
          <Trophy className="text-amber-400" size={28} />
        </div>
        <h1
          className="text-3xl font-black mb-2"
          style={{ fontFamily: "var(--font-display)" }}
        >
          Tournament Mode
        </h1>
        <div className="text-xs uppercase tracking-[0.35em] text-red-500/80 mb-4">
          Coming Soon
        </div>
        <p className="text-neutral-400 text-sm leading-relaxed mb-8">
          A bracket-style elimination tournament is in the works — climb
          through rounds of opponents for a shot at the top of the
          leaderboard. Check back soon.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Lobby
        </Link>
      </motion.div>
    </main>
  );
}
