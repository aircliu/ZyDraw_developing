# Stage 1: Base image
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
# Install required dependencies
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package manager files and install dependencies
COPY package.json yarn.lock* package-lock.json* pnpm-lock.yaml* ./
RUN \
  if [ -f yarn.lock ]; then yarn --frozen-lockfile; \
  elif [ -f package-lock.json ]; then npm ci; \
  elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm i --frozen-lockfile; \
  else echo "Lockfile not found." && exit 1; \
  fi

# Stage 2: Build the Next.js application
FROM base AS builder
WORKDIR /app

# Copy dependencies installed from the previous stage
COPY --from=deps /app/node_modules ./node_modules

# Copy the rest of the application files
COPY . .

# Build the Next.js application
RUN set -e; \
    if [ -f yarn.lock ]; then yarn run build; \
    elif [ -f package-lock.json ]; then npm run build; \
    elif [ -f pnpm-lock.yaml ]; then corepack enable pnpm && pnpm run build; \
    else echo "Lockfile not found." && exit 1; \
    fi

# Stage 3: Production image
FROM base AS runner
WORKDIR /app

# Set NODE_ENV to production
ENV NODE_ENV=production

# Install curl for health check
RUN apk add --no-cache curl

# Add a non-root user to run the application securely
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy the necessary files from the build stage
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Set permissions for the Next.js cache directory
RUN mkdir -p .next && chown nextjs:nodejs .next

# Use the non-root user to run the application
USER nextjs

# Expose the port the application will run on
EXPOSE 3000

# Set environment variables
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Use the Next.js API route for the health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD curl -f http://localhost:3000/api/health || exit 1

# Command to run the application in production
CMD ["node", "server.js"]
