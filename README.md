# E-Card — Real-Time Multiplayer Psychological Card Game

A full-stack, server-authoritative implementation of the "E-Card" game from
*Kaiji*: Citizen, Emperor, and Slave cards, hidden face-down plays, and a
simultaneous dramatic reveal.

## Modes

- **Single Player** — play against a server-side bot ("Tonegawa"). The
  bot's decisions run entirely on the server, not the client, so there's no
  way to inspect or influence its hand from devtools.
- **Multiplayer** — one player creates a room and gets a short shareable
  code; their friend enters that code to join. Rooms are capped at 2
  players. A given browser can only have one active game at a time (see
  "One game per browser" below).
- **Tournament** — stubbed as "coming soon."
- **Rules** — an in-app explainer covering the card hierarchy, scoring, and
  turn structure.

## Stack

- **Server**: Node.js, Express, Socket.io, TypeScript (authoritative game
  logic — hand management, turn resolution, scoring, and the bot's decision
  policy all live here)
- **Client**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Framer
  Motion, Zustand, Socket.io-client, lucide-react

## Why server-authoritative

The client is never trusted with anything beyond "which card id do you want
to play." Card resolution, hand depletion, round/turn advancement, and the
bot's own move selection all happen server-side. This is required for a
bluffing game — if the client computed outcomes or could see the bot's
hand, a player could simply read it out of the page source.

## One game per browser

Each browser generates and persists a random client token in
`localStorage` (see `client/lib/clientToken.ts`). The server refuses a
second `create_room` / `join_room` / `start_single_player` call from a
token that already has an active (non-finished) match — see
`server/src/game/MatchManager.ts`'s `activeRoomForToken`. This is a
convenience/anti-confusion guard, not a security boundary: it stops one
browser tab from accidentally opening two simultaneous games, not a
determined user from clearing localStorage.

## Terminal Setup (local development)

### 1. Server

```bash
cd server
npm install
cp .env.example .env
npm run dev     # http://localhost:4000, hot reload via ts-node-dev
```

### 2. Client

```bash
cd client
npm install
echo "NEXT_PUBLIC_SOCKET_URL=http://localhost:4000" > .env.local
npm run dev     # http://localhost:3000
```

### 3. Add your card assets

Place these 4 files in `client/public/assets/`:
```
citizen.jpg
emperor.jpg
slave.jpg
back.jpg
```

### 4. Play

Open `http://localhost:3000`. For multiplayer, open a second browser
session (or an incognito window — regular tabs in the *same* browser share
`localStorage` and will collide with the one-game-per-browser guard) and
join with the room code shown in the first session.

## Docker (local)

A `docker-compose.yml` at the repo root builds and runs both services
together, matching how they'll run in production:

```bash
docker compose up --build
```

Server: `http://localhost:4000` · Client: `http://localhost:3000`

Note: the client's `NEXT_PUBLIC_SOCKET_URL` is baked in at **build** time
(Next.js inlines `NEXT_PUBLIC_*` vars into the client bundle), which is why
it's passed as a build arg in `docker-compose.yml` rather than a plain
runtime environment variable.

## Deploying to Railway

See [`RAILWAY_DEPLOY.md`](./RAILWAY_DEPLOY.md) for the full walkthrough —
Railway needs each service pointed at its own subdirectory (`server/`,
`client/`) since they have separate Dockerfiles, and there's a specific
order to follow so the server's `CLIENT_ORIGIN` and the client's
`NEXT_PUBLIC_SOCKET_URL` end up pointing at each other's real deployed
domains instead of placeholders.

## Known reference-implementation bugs this project deliberately avoids

While building this, an earlier reference implementation of E-Card was
reviewed for comparison. Three real bugs were found in it and are called
out here so the fixes aren't accidentally undone in future edits:

1. **Hands were regenerated every turn instead of depleting across a
   round.** A round should draw down a fixed 5-card hand per side over up
   to 3 *decisive* turns; regenerating fresh hands after every turn breaks
   the "cards run out" dynamic entirely. Fixed in `Match.ts` — hands are
   built once per round in `beginRound()` and only ever `splice()`d down in
   `playCard()`.
2. **Draws (Citizen vs Citizen) should not count toward the 3-turn cap.**
   A round ends after 3 *decisive* (win/lose) turns, or when either side
   runs out of cards — whichever comes first. Citizen-vs-Citizen draws are
   "free": both cards are discarded and the round continues without
   consuming one of the 3 turn slots, so a round can involve more than 3
   total card exchanges if draws happen along the way. This is implemented
   in `Match.ts`'s `advanceAfterReveal()` — the turn counter only
   increments when `reveal.outcome !== "draw_discard"`.
3. **Hand-exhaustion must also end a round independently of the turn
   cap.** Since each side only holds 5 cards (4 Citizens + 1 special) and
   draws consume Citizens without advancing the turn counter, a round can
   run out of cards before reaching 3 decisive turns. `advanceAfterReveal()`
   checks both `emperorSideExhausted` and `slaveSideExhausted` in addition
   to the turn cap, and ends the round on whichever condition is met first.

## Production notes

- Replace the in-memory `MatchManager` Map with Redis (or a DB-backed
  store) before scaling beyond a single Node process — in-memory state and
  Socket.io rooms are pinned to whichever instance holds them.
- Put the Socket.io server behind a sticky-session load balancer if you do
  scale horizontally (or adopt the Socket.io Redis adapter).
