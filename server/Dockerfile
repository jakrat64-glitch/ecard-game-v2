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

# Railway (and most PaaS providers) inject PORT at runtime — the app reads
# process.env.PORT itself (see src/index.ts), so no hardcoded EXPOSE value
# should be relied upon for actual routing, but we document the default here.
EXPOSE 4000

CMD ["node", "dist/index.js"]
