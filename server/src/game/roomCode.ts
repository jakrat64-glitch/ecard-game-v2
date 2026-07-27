/**
 * Generates short, human-friendly room codes (e.g. "7XQK2") for players to
 * share with a friend. Deliberately excludes visually ambiguous characters
 * (0/O, 1/I/L) since these codes get read aloud or typed on mobile keyboards.
 */
const CODE_ALPHABET = "23456789ABCDEFGHJKMNPQRSTUVWXYZ";
const CODE_LENGTH = 5;

export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return code;
}

/** Normalizes user-typed room codes: uppercase, strip whitespace. */
export function normalizeRoomCode(raw: string): string {
  return raw.trim().toUpperCase().replace(/\s+/g, "");
}
