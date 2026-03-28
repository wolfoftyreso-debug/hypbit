FROM node:22-alpine
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY tsconfig.json ./
COPY src/ ./src/

# Kompilera TypeScript till JavaScript
RUN npx tsc --outDir dist

CMD ["node", "dist/index.js"]
