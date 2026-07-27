import "dotenv/config";
import express from "express";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { registerSocketHandlers } from "./socket/handlers";
import { ClientToServerEvents, ServerToClientEvents } from "./types";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 4000;
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";

const app = express();
app.use(cors({ origin: CLIENT_ORIGIN }));
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "ecard-server", timestamp: Date.now() });
});

const httpServer = http.createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`[ecard-server] listening on port ${PORT}`);
  console.log(`[ecard-server] accepting client origin: ${CLIENT_ORIGIN}`);
});
