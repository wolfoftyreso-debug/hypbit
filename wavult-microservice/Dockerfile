# syntax=docker/dockerfile:1.7

# ---- Stage 1: deps ---------------------------------------------------------
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat tini
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# ---- Stage 2: build --------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build && \
    npm prune --production

# ---- Stage 3: runtime ------------------------------------------------------
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production \
    PORT=8080 \
    HOST=0.0.0.0

RUN apk add --no-cache tini curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S wavult -u 1001 -G nodejs

COPY --from=builder --chown=wavult:nodejs /app/dist ./dist
COPY --from=builder --chown=wavult:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=wavult:nodejs /app/package.json ./package.json

USER wavult
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -fsS http://localhost:8080/health/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
