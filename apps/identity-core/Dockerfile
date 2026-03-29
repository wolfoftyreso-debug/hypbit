FROM node:22-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --omit=dev
COPY dist/ ./dist/
EXPOSE 3005
HEALTHCHECK --interval=30s --timeout=10s CMD wget -qO- http://localhost:3005/health || exit 1
CMD ["node", "dist/index.js"]
