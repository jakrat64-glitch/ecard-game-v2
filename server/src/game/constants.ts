import { CardType, Role } from "../types";

/**
 * Card hierarchy (from the prompt):
 *  Citizen  beats Slave,   loses to Emperor, ties Citizen
 *  Emperor  beats Citizen, loses to Slave
 *  Slave    beats Emperor, loses to Citizen
 *
 * Scoring:
 *  Emperor win -> +1
 *  Citizen win -> +1
 *  Slave win   -> +3
 */

export const POINTS_FOR_WIN: Record<CardType, number> = {
  emperor: 1,
  citizen: 1,
  slave: 3,
};

export const TOTAL_ROUNDS = 2;
export const MAX_TURNS_PER_ROUND = 3;

/**
 * Deck composition per side, per the prompt:
 *  Emperor side: 1 Emperor + 4 Citizens (5 cards)
 *  Slave side:   1 Slave   + 4 Citizens (5 cards)
 */
export function buildEmperorSideDeck(): CardType[] {
  return ["emperor", "citizen", "citizen", "citizen", "citizen"];
}

export function buildSlaveSideDeck(): CardType[] {
  return ["slave", "citizen", "citizen", "citizen", "citizen"];
}

export function deckForRole(role: Role): CardType[] {
  return role === "emperor_side" ? buildEmperorSideDeck() : buildSlaveSideDeck();
}
