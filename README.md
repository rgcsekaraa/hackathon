# Sophiie Space + Orbit

Sophiie Space is a realtime multimodal workspace for trade-service operations.
Orbit is the interaction layer and UI system powering fast voice, text, and structured workflow updates.

## What This Solves

Trade teams lose time switching between calls, notes, quotes, schedule updates, and customer follow-up.
Sophiie Space + Orbit turns that into one continuous flow:

- Capture customer intent from voice/text
- Classify and enrich lead context with AI
- Price and route jobs with business profile rules
- Keep dashboard/workspace state synced in realtime
- Trigger customer actions (for example photo upload links) from the same flow

## Product Roles

- Sophiie Space:
  Internal operations surface for onboarding customers, configuring inbound call setup, and monitoring pipeline/agent health.
- Sophiie Orbit:
  Customer-facing and service-delivery surface for daily appointments, schedules, notifications, and confirmation updates.

## Multimodal Architecture

```text
Customer Voice/Text
   -> Ingestion Layer (Twilio/WebSocket/API)
   -> STT (Deepgram) + Intent/Entity Extraction (LLM via OpenRouter/LangChain)
   -> Orchestration (FastAPI services + profile context + quote logic)
   -> Persistence (SQLite via SQLAlchemy) + Caching (Redis optional)
   -> Realtime Sync (WebSocket events to UI)
   -> Response Layer (Web UI updates, TTS via ElevenLabs, SMS follow-up)
```

### Core Services

- `apps/web`: Next.js customer/admin web experience
- `apps/api`: FastAPI orchestration, auth, voice/lead pipelines, integrations
- Integrations: Deepgram, ElevenLabs, OpenRouter, Twilio, Google APIs (optional)

## Features

- Multimodal lead intake across voice and web
- AI-assisted lead classification and quote scaffolding
- Profile-aware routing and pricing context
- Google OAuth + email/password auth
- Realtime workspace sync via WebSockets
- Readiness endpoint with external dependency checks
- Seed script for demo data and scenario playback

## User Scenario Covered

1. Customer calls or submits a request.
2. Orbit captures conversation and extracts job details.
3. System resolves business profile context (service types, rates, travel radius).
4. AI proposes structured lead + quote draft.
5. Team reviews/edits in dashboard and confirms booking.
6. Customer receives follow-up link/message; workspace remains synced for team members.

## Tech Stack

- Frontend: Next.js (App Router), React, MUI
- Backend: FastAPI, SQLAlchemy, aiosqlite, WebSockets
- AI/Voice: LangChain, OpenRouter, Deepgram, ElevenLabs, LiveKit
- Infra: Docker, docker-compose, Railway/Render manifests

## Usage

1. Install dependencies:

```bash
pnpm install
cd apps/api && pip install -r requirements.txt
```

2. Configure backend environment:

```bash
cp apps/api/.env.example apps/api/.env
```

Set at minimum:
- `SECRET_KEY`
- `DATABASE_URL`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

3. Run API and web:

```bash
pnpm run dev:api
pnpm run dev:web
```

4. Open:
- Web: `http://localhost:3000`
- API health: `http://localhost:8000/health`
- API readiness: `http://localhost:8000/health/ready`

## OAuth Notes (Local)

- Google OAuth callback route in backend: `/auth/google/callback`
- Local redirect URI should be:
  - `http://localhost:8000/auth/google/callback`
- `FRONTEND_URL` should be:
  - `http://localhost:3000`

## Repository Note

This repository currently documents and supports the web + API runtime flow.
