# Multi-stage Dockerfile for Sophiie Space (Monolithic)

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

# Copy workspace config files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml* ./
COPY nx.json tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN pnpm install --frozen-lockfile || pnpm install

# Copy source
COPY apps/web ./apps/web
COPY packages/shared ./packages/shared

# Build web app
RUN pnpm exec nx build web

# Stage 2: Build Backend
FROM python:3.11-slim AS backend-builder
WORKDIR /app
COPY apps/api/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Stage 3: Final Runtime
FROM python:3.11-slim AS runtime
WORKDIR /app

# Install Node.js in the Python runtime to run Next.js
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

# Copy backend Python packages
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin

# Copy backend source
COPY apps/api ./apps/api

# Copy frontend standalone output
COPY --from=frontend-builder /app/apps/web/.next/standalone ./apps/web/standalone
COPY --from=frontend-builder /app/apps/web/.next/static ./apps/web/standalone/apps/web/.next/static
COPY --from=frontend-builder /app/apps/web/public ./apps/web/standalone/apps/web/public

# Entrypoint script to run both
COPY scripts/start-prod.sh /usr/local/bin/start-prod.sh
RUN chmod +x /usr/local/bin/start-prod.sh

# Create data directory for SQLite
RUN mkdir -p /app/data

ENV PORT=3000
ENV API_PORT=8000
ENV HOST=0.0.0.0
ENV NODE_ENV=production

EXPOSE 3000 8000

CMD ["start-prod.sh"]
