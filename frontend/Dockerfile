# Base image
FROM node:20-alpine AS base

# 1. Installation Stage (Deps)
# Use a specific stage name for clarity
FROM base AS deps
WORKDIR /app

# Copy root package files and tsconfigs needed for install
# Assuming package-lock.json might exist or npm-shrinkwrap.yaml etc.
COPY package.json package-lock.json* ./
COPY tsconfig*.json ./

# Copy workspace package.json files (needed for npm ci to detect workspaces)
COPY frontend/package.json ./frontend/
# Copy shared packages definitions (adjust path if needed)
COPY packages/types/package.json ./packages/types/
# If other shared packages are needed for build deps, copy their package.json too

# Install ALL workspace dependencies needed for the build
# Use --omit=dev if build doesn't require devDependencies, otherwise omit it
# Consider adding --prefer-offline if lock file is consistent
RUN npm ci

# 2. Builder Stage
FROM base AS builder
WORKDIR /app

# Copy ALL source code from context (monorepo root)
# This ensures tsconfig paths, shared packages, etc. are resolved
COPY . .

# Copy installed node_modules from deps stage (very important!)
# This leverages the cache from the deps stage
COPY --from=deps /app/node_modules ./node_modules

# Set environment variables for build time
ENV NEXT_TELEMETRY_DISABLED 1
# NEXT_PUBLIC_API_URL is generally a runtime variable for the client,
# but set it here if needed during the actual 'next build' process itself.

# Build the specific frontend application using workspace command
# This assumes 'build' script exists in frontend/package.json
# It will build based on frontend/next.config.js, etc.
RUN npm run build --workspace=frontend

# 3. Runner Stage (Using Next.js Standalone Output)
FROM base AS runner

# Set the final working directory later

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED 1

# Create non-root user first
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Create the target directory
WORKDIR /app/standalone

# Copy the entire standalone output directory contents
# Source path ends with /. to copy contents, not the directory itself
COPY --from=builder /app/frontend/.next/standalone/. ./

# Copy static assets into the correct relative path
COPY --from=builder /app/frontend/.next/static ./.next/static

# Install production dependencies as ROOT based on the standalone package.json
RUN npm install --omit=dev --ignore-scripts

# Set ownership *after* npm install, targeting the /app/standalone directory
RUN chown -R nextjs:nodejs /app/standalone

# Switch to non-root user
USER nextjs

# Expose port and set runtime environment variables
EXPOSE 3000
ENV PORT 3000
ENV NEXT_PUBLIC_API_URL=http://backend-service.movie-explorer.svc.cluster.local:5001/api
# Explicitly set NODE_PATH relative to the new WORKDIR
ENV NODE_PATH=/app/standalone/node_modules

# The CMD should still work as server.js is copied into the WORKDIR
CMD ["node", "server.js"] 