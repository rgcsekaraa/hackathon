# Sophiie Platform

> Voice-first AI workspace for trade-service operations.

## Architecture

```
apps/
├── api/         → FastAPI backend (shared)         :8000
├── customer/    → Sophiie Orbit (customer portal)  :3000
└── admin/       → Sophiie Space (admin portal)     :3001
packages/
└── shared/      → Shared TypeScript utilities
```

| Service | Description | Port |
|---------|-------------|------|
| **Sophiie Orbit** (`apps/customer`) | Customer/tradie dashboard — appointments, calendar, enquiries, voice | `3000` |
| **Sophiie Space** (`apps/admin`) | Super-admin console — user management, system health, call logs | `3001` |
| **API** (`apps/api`) | FastAPI backend — auth, voice pipeline, integrations, WebSocket | `8000` |

## Quick Start

```bash
# 1. Install dependencies
pnpm install
cd apps/api && pip install -r requirements.txt

# 2. Configure environment
cp apps/api/.env.example apps/api/.env
# Edit .env with your API keys

# 3. Run all services
cd apps/api && uvicorn main:app --reload --port 8000
cd apps/customer && npm run dev       # port 3000
cd apps/admin && npm run dev          # port 3001
```

### NX Commands

```bash
npx nx show projects                  # List all projects
npx nx serve customer                 # Start customer portal
npx nx serve admin                    # Start admin portal
npx nx build customer                 # Build customer portal
npx nx build admin                    # Build admin portal
npx nx run-many --target=build        # Build everything
```

## Admin Credentials

The bootstrap super-admin is created automatically at API startup.

| Field | Value |
|-------|-------|
| **Email** | `superadmin@sophiie.com` |
| **Password** | `d3m0-p@s5` |
| **Login alias** | `demo-SA` |

Override via environment variables:

- `BOOTSTRAP_ADMIN_ENABLED` / `BOOTSTRAP_ADMIN_EMAIL` / `BOOTSTRAP_ADMIN_PASSWORD`

## What This Solves

Trade teams lose time switching between calls, notes, quotes, schedule updates, and customer follow-up. Sophiie turns that into one continuous flow:

1. Customer calls or submits a request
2. Orbit captures conversation and extracts job details via AI
3. System resolves business context (service types, rates, travel radius)
4. AI proposes structured lead + quote draft
5. Team reviews/edits in dashboard and confirms booking
6. Customer receives follow-up via SMS; workspace stays synced

## Features

- **Voice AI Pipeline** — Real-time bidirectional voice (LiveKit + Deepgram + ElevenLabs)
- **Intelligent Classification** — LangChain agents classify intent, extract entities, assess urgency
- **Context-Aware Responses** — Business profile context injected into AI conversations
- **Dual Portals** — Dedicated interfaces for admins and customers
- **Realtime Sync** — WebSocket events push updates to connected dashboards
- **Vision Analysis** — Automated photo analysis for accurate quoting

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, MUI 7, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, aiosqlite, WebSockets
- **AI/Voice:** LiveKit Agents, LangChain, OpenRouter, Deepgram, ElevenLabs
- **Infra:** Docker, Railway (multi-service), pnpm + NX monorepo

## Environment Variables

Set in `apps/api/.env`:

| Variable | Required | Description |
|----------|----------|-------------|
| `SECRET_KEY` | Yes | JWT signing key |
| `DATABASE_URL` | Yes | SQLite/Postgres URL |
| `FRONTEND_URL` | Yes | Customer portal URL |
| `DEEPGRAM_API_KEY` | Yes | Speech-to-text |
| `ELEVENLABS_API_KEY` | Yes | Text-to-speech |
| `LIVEKIT_URL` | Yes | LiveKit server URL |
| `LIVEKIT_API_KEY` | Yes | LiveKit API key |
| `LIVEKIT_API_SECRET` | Yes | LiveKit API secret |
| `OPENROUTER_API_KEY` | Yes | LLM provider |
| `TWILIO_ACCOUNT_SID` | Optional | SMS/voice |
| `TWILIO_AUTH_TOKEN` | Optional | SMS/voice |
| `GOOGLE_CLIENT_ID` | Optional | OAuth |
| `GOOGLE_CLIENT_SECRET` | Optional | OAuth |

## Deployment (Railway)

Configured in `railway.toml` for 4 services:

- `api` — Python backend
- `worker` — LiveKit voice agent
- `customer` — Next.js customer portal
- `admin` — Next.js admin portal

Each service has its own `Dockerfile` in its respective `apps/` directory.
