# syntax=docker/dockerfile:1.7
FROM node:20-alpine AS deps
WORKDIR /workspace
COPY package.json package-lock.json* ./
COPY services/risk-service/package.json ./services/risk-service/
COPY libs ./libs
RUN npm install --workspaces --include-workspace-root

FROM node:20-alpine AS builder
WORKDIR /workspace
COPY --from=deps /workspace/node_modules ./node_modules
COPY --from=deps /workspace/libs ./libs
COPY tsconfig.base.json ./
COPY services/risk-service ./services/risk-service
RUN npm run build -w @amos/risk-service

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production PORT=3003
RUN apk add --no-cache tini && \
    addgroup -g 1001 -S node && adduser -S amos -u 1001 -G node
COPY --from=builder --chown=amos:node /workspace/services/risk-service/dist ./dist
COPY --from=builder --chown=amos:node /workspace/node_modules ./node_modules
COPY --from=builder --chown=amos:node /workspace/libs ./libs
COPY --from=builder --chown=amos:node /workspace/services/risk-service/package.json ./
USER amos
EXPOSE 3003
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/main.js"]
