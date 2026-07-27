"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import Image from "next/image";
import { CARD_ASSETS } from "@/lib/constants";
import { ArrowLeft, Crown, Swords } from "lucide-react";

interface RuleCardProps {
  src: string;
  label: string;
  won?: boolean;
  size?: "sm" | "md";
}

function RuleCard({ src, label, won, size = "md" }: RuleCardProps) {
  const dims = size === "sm" ? "w-12 h-16" : "w-16 h-24";
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`relative ${dims}`}>
        {won && (
          <Crown
            className="absolute -top-3 left-1/2 -translate-x-1/2 text-amber-400 drop-shadow-[0_0_6px_rgba(250,204,21,0.8)] z-10"
            size={16}
            fill="currentColor"
          />
        )}
        <div
          className={`relative w-full h-full rounded-md overflow-hidden border-2 ${
            won ? "border-amber-400" : "border-neutral-700 opacity-60"
          }`}
        >
          <Image src={src} alt={label} fill sizes="100px" className="object-cover" />
        </div>
      </div>
      <span className="text-[9px] uppercase tracking-wide text-neutral-500">{label}</span>
    </div>
  );
}

function VersusRow({
  left,
  right,
  winner,
}: {
  left: "citizen" | "emperor" | "slave";
  right: "citizen" | "emperor" | "slave";
  winner: "left" | "right" | "draw";
}) {
  const labelFor = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
  return (
    <div className="flex items-center justify-center gap-3">
      <RuleCard src={CARD_ASSETS[left]} label={labelFor(left)} won={winner === "left"} size="sm" />
      <Swords className="text-red-600/70" size={18} />
      <RuleCard
        src={CARD_ASSETS[right]}
        label={labelFor(right)}
        won={winner === "right"}
        size="sm"
      />
    </div>
  );
}

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0 },
};

function RuleSection({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-40px" }}
      variants={sectionVariants}
      transition={{ duration: 0.5 }}
      className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-5 space-y-4"
    >
      <div className="flex items-center gap-2">
        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-950 border border-red-600/50 text-red-400 text-xs font-bold shrink-0">
          {number}
        </span>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-200">
          {title}
        </h2>
      </div>
      {children}
    </motion.section>
  );
}

export default function RulesPage() {
  return (
    <main className="relative min-h-[100dvh] bg-black text-white">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-black" />
        <div
          className="absolute inset-0"
          style={{
            background: "radial-gradient(circle at 50% 0%, rgba(120,10,20,0.25), transparent 55%)",
          }}
        />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-5 py-8 pb-16">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-neutral-400 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft size={16} />
          Back to Lobby
        </Link>

        <h1
          className="text-3xl font-black mb-1"
          style={{ fontFamily: "var(--font-display)" }}
        >
          How to Play
        </h1>
        <p className="text-neutral-500 text-sm mb-8">
          The rules behind Kaiji&apos;s most infamous game of nerve.
        </p>

        <div className="space-y-5">
          <RuleSection number={1} title="The Hands">
            <div className="flex items-center justify-center gap-2">
              <RuleCard src={CARD_ASSETS.citizen} label="Citizen" size="sm" />
              <RuleCard src={CARD_ASSETS.citizen} label="Citizen" size="sm" />
              <RuleCard src={CARD_ASSETS.citizen} label="Citizen" size="sm" />
              <RuleCard src={CARD_ASSETS.citizen} label="Citizen" size="sm" />
              <span className="text-neutral-600 text-lg mx-1">+</span>
              <RuleCard src={CARD_ASSETS.emperor} label="Emperor" size="sm" />
              <span className="text-neutral-600 text-xs">or</span>
              <RuleCard src={CARD_ASSETS.slave} label="Slave" size="sm" />
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Each player is dealt five cards: four Citizens, plus either one
              Emperor or one Slave depending on which side of the table
              they've been assigned to for the round.
            </p>
          </RuleSection>

          <RuleSection number={2} title="The Citizen">
            <VersusRow left="citizen" right="slave" winner="left" />
            <VersusRow left="citizen" right="emperor" winner="right" />
            <VersusRow left="citizen" right="citizen" winner="draw" />
            <p className="text-neutral-400 text-sm leading-relaxed">
              The Citizen is the ordinary person, caught in the middle. It
              overpowers the Slave, but stands no chance against the Emperor.
              Two Citizens meeting face to face cancel each other out entirely.
            </p>
          </RuleSection>

          <RuleSection number={3} title="The Emperor">
            <VersusRow left="emperor" right="citizen" winner="left" />
            <VersusRow left="emperor" right="slave" winner="right" />
            <p className="text-neutral-400 text-sm leading-relaxed">
              The Emperor sits at the top of the hierarchy and crushes the
              Citizen beneath it — but that same authority is exactly what
              the Slave has nothing left to lose against.
            </p>
          </RuleSection>

          <RuleSection number={4} title="The Slave">
            <VersusRow left="slave" right="emperor" winner="left" />
            <VersusRow left="slave" right="citizen" winner="right" />
            <p className="text-neutral-400 text-sm leading-relaxed">
              The Slave has nothing to protect, which is precisely its
              weapon: it's the only card that can dethrone the Emperor. Any
              ordinary Citizen, however, still puts it down without effort.
            </p>
          </RuleSection>

          <RuleSection number={5} title="Scoring">
            <div className="flex items-center justify-center gap-6">
              <div className="flex flex-col items-center gap-1">
                <RuleCard src={CARD_ASSETS.emperor} label="Emperor" won size="sm" />
                <span className="text-amber-400 font-bold text-sm">+1</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RuleCard src={CARD_ASSETS.citizen} label="Citizen" won size="sm" />
                <span className="text-amber-400 font-bold text-sm">+1</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <RuleCard src={CARD_ASSETS.slave} label="Slave" won size="sm" />
                <span className="text-red-400 font-bold text-sm">+3</span>
              </div>
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              Winning a turn as the Emperor or as a Citizen is worth a single
              point. Winning as the Slave — the underdog's one shot at glory
              — is worth three.
            </p>
          </RuleSection>

          <RuleSection number={6} title="Turns & Rounds">
            <div className="flex justify-center gap-1.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="relative w-10 h-14 rounded overflow-hidden border border-neutral-700">
                  <Image
                    src={CARD_ASSETS.back}
                    alt="face-down card"
                    fill
                    sizes="60px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-neutral-400 text-sm leading-relaxed">
              A match has two rounds of up to three <em>decisive</em> turns
              each — a Citizen-vs-Citizen tie doesn't use up one of those
              three; both cards are simply discarded and play continues. On
              the first turn of a round, the Emperor side leads face-down;
              after any decisive turn, whoever lost must lead next. Both
              cards flip together for the reveal. A round also ends early if
              either side runs out of cards. After round one, the two
              players swap sides completely for round two. Whoever holds the
              most points once both rounds are finished wins the match.
            </p>
          </RuleSection>
        </div>
      </div>
    </main>
  );
}
