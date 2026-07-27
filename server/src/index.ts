import "dotenv/config";
import express from "express";
import cors, { CorsOptions } from "cors";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/handlers";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;

// The deployed client is listed here rather than relying solely on an env
// var, so a missing CLIENT_ORIGIN in the Railway dashboard can never be the
// thing that breaks production again. Extra origins can still be added via
// CLIENT_ORIGINS (comma-separated) without a code change.
const ALLOWED_ORIGINS = [
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "https://ecard-game-client-production.up.railway.app",
];

function parseOrigins(rawValue?: string): string[] {
  return (rawValue || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function resolveAllowedOrigins(): string[] {
  return Array.from(
    new Set([
      ...ALLOWED_ORIGINS,
      ...parseOrigins(process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN),
    ])
  );
}

function buildCorsOptions(): CorsOptions {
  const allowedOrigins = resolveAllowedOrigins();

  return {
    origin: (origin, callback) => {
      // Same-origin requests, curl and server-to-server calls send no Origin
      // header at all — these are not subject to the browser's same-origin
      // policy, so there is nothing to enforce against.
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      console.warn(`[ecard-server] rejected CORS origin: ${origin}`);
      callback(null, false);
    },
    credentials: true,
    methods: ["GET", "POST", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
}

const app = express();
const corsOptions = buildCorsOptions();

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ecard-server", timestamp: Date.now() });
});

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: corsOptions,
});

registerSocketHandlers(io);

httpServer.listen(PORT, "0.0.0.0", () => {
  console.log(`[ecard-server] listening on 0.0.0.0:${PORT}`);
  console.log(`[ecard-server] accepting client origins: ${resolveAllowedOrigins().join(", ")}`);
});
