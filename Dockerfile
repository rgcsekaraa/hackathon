# Multi-stage Dockerfile for sophiie-space (Monolithic)

# Stage 1: Build Frontend
FROM node:20-slim AS frontend-builder
WORKDIR /app
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
# Install dependencies (ignoring workspace issues by focusing on web)
RUN npm install
COPY apps/web ./apps/web
COPY tsconfig.base.json ./
RUN npm run build:web

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

# Copy backend
COPY --from=backend-builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=backend-builder /usr/local/bin /usr/local/bin
COPY apps/api ./apps/api

# Copy frontend standalone output
COPY --from=frontend-builder /app/apps/web/.next/standalone ./apps/web/standalone
COPY --from=frontend-builder /app/apps/web/.next/static ./apps/web/standalone/apps/web/.next/static
COPY --from=frontend-builder /app/apps/web/public ./apps/web/standalone/apps/web/public

# Entrypoint script to run both
COPY scripts/start-prod.sh /usr/local/bin/start-prod.sh
RUN chmod +x /usr/local/bin/start-prod.sh

ENV PORT=3000
ENV API_PORT=8000
ENV HOST=0.0.0.0

# In a monolithic hackathon setup, we normally use a proxy. 
# For now, let's expose the frontend port and have it proxy /api.
EXPOSE 3000 8000

CMD ["start-prod.sh"]
