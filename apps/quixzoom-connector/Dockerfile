# syntax=docker/dockerfile:1.6
############################################
# Build stage
############################################
FROM node:20-alpine AS build
WORKDIR /app

# Install dependencies first to leverage the layer cache.
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# Compile TypeScript.
COPY tsconfig.json ./
COPY src ./src
RUN npx tsc -p tsconfig.json

############################################
# Runtime stage
############################################
FROM node:20-alpine AS runtime
WORKDIR /app

ENV NODE_ENV=production \
    PORT=3000 \
    KAFKAJS_NO_PARTITIONER_WARNING=1

# Non-root user.
RUN addgroup -S app && adduser -S app -G app

COPY package.json package-lock.json* ./
RUN npm ci --only=production --no-audit --no-fund \
    && npm cache clean --force

COPY --from=build /app/dist ./dist

USER app
EXPOSE 3000

HEALTHCHECK --interval=15s --timeout=5s --start-period=30s --retries=3 \
  CMD wget -qO- http://localhost:3000/health || exit 1

CMD ["node", "dist/index.js"]
