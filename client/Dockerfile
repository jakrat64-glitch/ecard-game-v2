# ---- Dependencies stage ----
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app

# IMPORTANT: NEXT_PUBLIC_* variables are inlined into the client bundle at
# BUILD time, not read at container start time. Railway lets you set this
# as a build argument (Settings -> Variables, marked "available at build
# time") — if you only set it as a normal runtime env var, the deployed
# frontend will still try to reach whatever URL was baked in at build time
# (or the localhost:4000 fallback), which will be wrong in production.
ARG NEXT_PUBLIC_SOCKET_URL
ENV NEXT_PUBLIC_SOCKET_URL=${NEXT_PUBLIC_SOCKET_URL}

COPY --from=deps /app/node_modules ./node_modules
COPY . .

RUN npm run build

# ---- Runtime stage ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
