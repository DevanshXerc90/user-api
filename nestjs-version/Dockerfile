# ─────────────────────────── Stage 1: Build ───────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy dependency manifests and install all deps (including devDeps for build)
COPY package*.json ./
RUN npm ci

# Copy source and compile TypeScript → dist/
COPY . .
RUN npm run build

# Prune devDependencies so the runner stage only copies production deps
RUN npm prune --production

# ─────────────────────────── Stage 2: Runner ──────────────────────────────
FROM node:20-alpine AS runner

# Run as non-root user (mirrors Go Dockerfile's USER nonroot:nonroot)
RUN addgroup -S nestjs && adduser -S nestjs -G nestjs

WORKDIR /app

# Copy compiled output and production node_modules only
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

USER nestjs

EXPOSE 3001

# Start the compiled server
CMD ["node", "dist/main"]
