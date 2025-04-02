# 1. Builder Stage
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files and tsconfigs needed for install
COPY package.json package-lock.json* ./
COPY tsconfig*.json ./

# Copy workspace package.json files (needed for npm ci to detect workspaces)
COPY backend/package.json ./backend/
COPY packages/types/package.json ./packages/types/

# Install ALL workspace dependencies
RUN npm ci

# Copy ALL source code from context (monorepo root)
COPY . .

# Build shared types first
RUN npm run build --workspace=@repo/types

# Build the backend application
RUN npm run build --workspace=backend

# 2. Runner Stage
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copy necessary built artifacts from builder stage
COPY --from=builder /app/backend/dist ./backend/dist
COPY --from=builder /app/packages/types/dist ./packages/types/dist

# Copy necessary package files for production install
COPY package.json package-lock.json* ./
COPY backend/package.json ./backend/
COPY packages/types/package.json ./packages/types/

# Install only production dependencies for the entire workspace relevant to the backend
# This ensures shared prod dependencies are also installed
# Add --ignore-scripts to prevent husky install from running
RUN npm ci --omit=dev --ignore-scripts

# Copy .env.example to the backend directory
# Note: In a real deployment, you'd inject secrets/config, not rely on .env
COPY backend/.env.example ./backend/.env

# Set WORKDIR to the backend for the CMD
WORKDIR /app/backend

# Expose backend port (ensure this matches service/deployment)
EXPOSE 5001

# Start the application
CMD ["node", "dist/server.js"] 