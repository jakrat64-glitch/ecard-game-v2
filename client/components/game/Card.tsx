"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import clsx from "clsx";
import { CardType } from "@/types/game";
import { CARD_ASSETS } from "@/lib/constants";

interface CardProps {
  /** The revealed card type. If null/undefined and not flipped, shows the back. */
  type?: CardType | null;
  /** Whether the card is showing its face (true) or back (false). */
  isFlipped: boolean;
  size?: "sm" | "md" | "lg" | "xl";
  selected?: boolean;
  dimmed?: boolean;
  glow?: "none" | "gold" | "red" | "green";
  onClick?: () => void;
  className?: string;
}

const SIZE_MAP: Record<NonNullable<CardProps["size"]>, string> = {
  sm: "w-14 h-20",
  md: "w-20 h-28",
  lg: "w-28 h-40",
  xl: "w-36 h-52",
};

const GLOW_MAP: Record<NonNullable<CardProps["glow"]>, string> = {
  none: "",
  gold: "shadow-[0_0_25px_rgba(250,204,21,0.65)] ring-2 ring-amber-400/70",
  red: "shadow-[0_0_25px_rgba(224,38,58,0.65)] ring-2 ring-red-500/70",
  green: "shadow-[0_0_25px_rgba(34,197,94,0.55)] ring-2 ring-emerald-400/60",
};

/**
 * A single playing card with a real 3D flip (rotateY) between its face-down
 * back and its revealed face. Uses `transform-style: preserve-3d` via
 * Tailwind's arbitrary utility support plus inline style for the parts
 * Tailwind doesn't expose (backface-visibility, perspective).
 */
export function Card({
  type,
  isFlipped,
  size = "md",
  selected = false,
  dimmed = false,
  glow = "none",
  onClick,
  className,
}: CardProps) {
  return (
    <div
      className={clsx(SIZE_MAP[size], "relative select-none", className)}
      style={{ perspective: "1000px" }}
      onClick={onClick}
    >
      <motion.div
        className="relative w-full h-full"
        style={{ transformStyle: "preserve-3d" }}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
        transition={{ duration: 0.6, ease: [0.45, 0.05, 0.15, 0.95] }}
      >
        {/* BACK FACE (face-down) */}
        <div
          className={clsx(
            "absolute inset-0 rounded-lg overflow-hidden border-2",
            selected ? "border-amber-400" : "border-neutral-700",
            dimmed && "opacity-40",
            GLOW_MAP[glow]
          )}
          style={{ backfaceVisibility: "hidden" }}
        >
          <Image
            src={CARD_ASSETS.back}
            alt="Face-down card"
            fill
            sizes="200px"
            className="object-cover"
            priority
          />
        </div>

        {/* FRONT FACE (revealed) */}
        <div
          className={clsx(
            "absolute inset-0 rounded-lg overflow-hidden border-2",
            selected ? "border-amber-400" : "border-neutral-700",
            dimmed && "opacity-40",
            GLOW_MAP[glow]
          )}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
          }}
        >
          {type ? (
            <Image
              src={CARD_ASSETS[type]}
              alt={type}
              fill
              sizes="200px"
              className="object-cover"
              priority
            />
          ) : (
            <div className="w-full h-full bg-neutral-900" />
          )}
        </div>
      </motion.div>
    </div>
  );
}
