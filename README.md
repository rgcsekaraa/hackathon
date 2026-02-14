# Sophiie Space

**The future of spatial AI interaction.**

Sophiie Space is an advanced AI agent workspace designed for high-density information management and natural human-AI interaction. Built during the Sophiie AI Agents Hackathon 2026, it focuses on providing a premium, professional experience through a custom "Orbit" design system and continuous voice/text integration.

## Project Overview

### Participant
| Field | Information |
|-------|-------------|
| Name | [User Name] |

### Project Details
| Field | Information |
|-------|-------------|
| Project Name | Sophiie Space |
| One-Line Description | A high-density AI workspace with spatial voice interaction and Orbit aesthetics. |
| Tech Stack | Next.js, FastAPI, Expo (Web/Mobile), LiveKit, LangChain |
| AI Provider(s) | OpenAI / Anthropic (via API layer) |

---

## Core Features

### Sophiie Orbit Interaction
Natural voice capture and processing (STT/TTS/LLM) that allows users to interact with their workspace hands-free. The system uses LiveKit Agents for robust, real-time voice streaming.

### Orbit Design System
A complete overhaul of the interface using custom "Orbit" design tokens, featuring deep space gradients, glassmorphism, staggered animations, and refined typography.

### Real-time Workspace Sync
Powered by WebSockets, the workspace stays in sync across devices, providing instant updates for tasks, notes, and AI responses.

### High-Density Dashboard
Optimized for productivity, the dashboard provides a compact yet readable view of all active projects, tasks, and communications.

---

## Tech Stack

### Frontend (Web)
- Next.js 14 (App Router)
- Material UI (MUI) with M3 tokens
- React Hook Form + Zod

### Mobile (New!)
- Expo Router
- React Native Web (Shimmed for browser compatibility)
- Reanimated + Linear Gradient
- Orbit Design System

### Backend
- FastAPI
- SQLAlchemy + aiosqlite
- WebSockets for real-time communication
- JWT Authentication

### AI & Voice Pipeline
- **Orchestration**: LiveKit Agents Framework
- **STT**: Deepgram Nova-2
- **LLM**: LangChain + OpenAI (GPT-4o)
- **TTS**: ElevenLabs Turbo v2
- **RAG**: ChromaDB (Vector Search)

---

## Quick Start

1.  **Install Dependencies**:
    ```bash
    # Install tools (if needed)
    npm install -g pnpm nx
    pip install uv

    # Install project dependencies
    pnpm install
    # API dependencies are auto-handled via uv, or manually:
    # cd apps/api && uv sync
    ```

2.  **Environment Setup**:
    - Copy `.env.example` to `.env` in `apps/api` and `apps/web`.
    - Fill in keys for OpenAI, Deepgram, ElevenLabs, LiveKit.

3.  **Start Everything (Web + API + Mobile)**:
    ```bash
    pnpm run dev
    ```
    This launches all three services in parallel:
    - **Web Dashboard**: [http://localhost:3000](http://localhost:3000)
    - **API Server**: [http://localhost:8000](http://localhost:8000)
    - **Mobile App**: [http://localhost:8081](http://localhost:8081)

4.  **Manual Start (Optional)**:
    - Web: `nx serve web`
    - API: `nx serve api`
    - Mobile: `nx serve mobile`

5.  **Build Everything**:
    ```bash
    pnpm run build
    ```

Refer to `walkthrough.md` for detailed milestones and `task.md` for progress tracking.

---

## License

This project is submitted as part of the Sophiie AI Agents Hackathon 2026.
