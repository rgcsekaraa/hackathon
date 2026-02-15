# apps/admin/Dockerfile

# 1. Base image
FROM node:20-alpine AS base

# 2. Dependencies
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY package.json pnpm-lock.yaml* ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# 3. Builder
FROM base AS builder
WORKDIR /app
RUN npm install -g pnpm

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Next.js telemetry disable
ENV NEXT_TELEMETRY_DISABLED 1

# Build the app
RUN pnpm build

# 4. Runner
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs

EXPOSE 3001

ENV PORT 3001
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]
