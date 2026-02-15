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

- **System Space (Admin):**
  Internal control plane for monitoring system health, onboarding customers, and managing node configurations. Features high-contrast, data-dense UI for system administrators.

- **Command Center (Tradie Dashboard):**
  Mobile-first workspace for daily operations. Handles voice memos, job tracking, and real-time lead updates.

- **Customer Portal:**
  Customer-facing surface for job status tracking and secure photo uploads.

## Multimodal Architecture

    Customer Voice/Text
       -> Ingestion Layer (Twilio/WebSocket/API)
       -> STT (Deepgram) + Intent/Entity Extraction (LLM via OpenRouter/LangChain)
       -> Orchestration (FastAPI services + profile context + quote logic)
       -> Persistence (SQLite via SQLAlchemy) + Caching (Redis optional)
       -> Realtime Sync (WebSocket events to UI)
       -> Response Layer (Web UI updates, TTS via ElevenLabs, SMS follow-up)

### Core Services

- `apps/web`: Next.js customer/admin/tradie web experience
- `apps/api`: FastAPI orchestration, auth, voice/lead pipelines, integrations
- Integrations: Deepgram, ElevenLabs, OpenRouter, Twilio, Google APIs (optional)

## Features

- **Voice AI Pipeline:** Real-time bidirectional voice (Twilio Media Streams + Deepgram + ElevenLabs).
- **Intelligent Classification:** LangChain agents classify intent, extract entities, and assess urgency.
- **Context-Aware Responses:** Injects business context (service radius, pricing) into AI conversations.
- **Portals:** Dedicated interfaces for Admins, Tradies, and Customers.
- **Realtime Sync:** WebSocket events push updates instantly to connected dashboards.
- **Vision Analysis:** Automated photo analysis for accurate quoting.

## User Scenario Covered

1. Customer calls or submits a request.
2. Orbit captures conversation and extracts job details.
3. System resolves business profile context (service types, rates, travel radius).
4. AI proposes structured lead + quote draft.
5. Team reviews/edits in dashboard and confirms booking.
6. Customer receives follow-up link/message via SMS; workspace remains synced for team members.

## Tech Stack

- **Frontend:** Next.js (App Router), React, MUI, Tailwind CSS
- **Backend:** FastAPI, SQLAlchemy, aiosqlite, WebSockets
- **AI/Voice:** LangChain, OpenRouter, Deepgram, ElevenLabs
- **Infra:** Docker, docker-compose, Railway/Render manifests

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
- `GOOGLE_CLIENT_ID` (optional for local dev)
- `GOOGLE_CLIENT_SECRET` (optional for local dev)
- `DEEPGRAM_API_KEY`
- `ELEVENLABS_API_KEY`
- `TWILIO_ACCOUNT_SID`
- `TWILIO_AUTH_TOKEN`

3. Run API and web:

```bash
# In separate terminals:
cd apps/api && uvicorn main:app --reload --port 8000
cd apps/web && pnpm dev
```

4. Open:
- Web: `http://localhost:3000`
- API health: `http://localhost:8000/health`
- API docs: `http://localhost:8000/docs`

## Default Super Admin (Sophiie Space)

Space bootstrap admin is created automatically at API startup (unless disabled).

- Login alias: `demo-SA`
- Email (resolved alias): `superadmin@sophiie.com`
- Password: `d3m0-p@s5`

Environment variables (optional overrides):

- `BOOTSTRAP_ADMIN_ENABLED`
- `BOOTSTRAP_ADMIN_ALIAS`
- `BOOTSTRAP_ADMIN_EMAIL`
- `BOOTSTRAP_ADMIN_PASSWORD`
- `BOOTSTRAP_ADMIN_NAME`

Web aliases for login UI:

- `NEXT_PUBLIC_BOOTSTRAP_ADMIN_ALIAS`
- `NEXT_PUBLIC_BOOTSTRAP_ADMIN_EMAIL`
- `NEXT_PUBLIC_BOOTSTRAP_ADMIN_PASSWORD`

## Portal Routes

- Sophiie Space (admin): `http://localhost:3000/admin-portal`
- Sophiie Orbit (customer/tradie): `http://localhost:3000/customer-portal`

## Repository Note

This repository currently documents and supports the web + API runtime flow.
