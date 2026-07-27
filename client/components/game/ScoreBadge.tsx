"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { ROLE_LABELS } from "@/lib/constants";
import { Role } from "@/types/game";

interface ScoreBadgeProps {
  name: string;
  score: number;
  role: Role;
  align: "left" | "right";
  isYou?: boolean;
  avatar?: string;
}

export function ScoreBadge({ name, score, role, align, isYou, avatar }: ScoreBadgeProps) {
  return (
    <div
      className={clsx(
        "flex items-center gap-2 px-3 py-1.5 rounded-full border backdrop-blur-sm",
        "bg-black/60",
        role === "emperor_side"
          ? "border-amber-500/50"
          : "border-red-600/50",
        align === "right" && "flex-row-reverse"
      )}
    >
      {avatar && (
        <div className="relative w-8 h-8 rounded-full overflow-hidden border border-neutral-700 bg-neutral-950">
          <Image src={avatar} alt={`${name} avatar`} fill className="object-cover" />
        </div>
      )}
      <div
        className={clsx(
          "flex flex-col",
          align === "right" ? "items-end" : "items-start"
        )}
      >
        <span className="text-[10px] uppercase tracking-wider text-neutral-400 leading-none">
          {isYou ? "You" : name} · {ROLE_LABELS[role]}
        </span>
        <AnimatePresence mode="popLayout">
          <motion.span
            key={score}
            initial={{ y: -6, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 6, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className={clsx(
              "text-lg font-bold leading-none",
              role === "emperor_side" ? "text-amber-400" : "text-red-400"
            )}
          >
            {score} pts
          </motion.span>
        </AnimatePresence>
      </div>
    </div>
  );
}
