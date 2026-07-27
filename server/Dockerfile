# ---- Build stage ----
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json ./
COPY src ./src

RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json* ./
RUN npm ci --omit=dev

COPY --from=builder /app/dist ./dist

# Railway injects PORT at runtime (8080 in practice) and detects the port the
# process actually listens on, so EXPOSE does not drive routing here. The app
# reads process.env.PORT and binds 0.0.0.0 — see src/index.ts.

CMD ["node", "dist/index.js"]
