# Sophiie Space

**The future of spatial AI interaction.**

Sophiie Space is an advanced AI agent workspace designed for high-density information management and natural human-AI interaction. Built during the Sophiie AI Agents Hackathon 2026, it focuses on providing a premium, professional experience through Material Design 3 and seamless voice/text integration.

---

## Project Overview

### Participant
| Field | Information |
|-------|-------------|
| Name | [User Name] |
| University / Employer | [Institution] |

### Project Details
| Field | Information |
|-------|-------------|
| Project Name | Sophiie Space |
| One-Line Description | A high-density AI workspace with spatial voice interaction and M3 aesthetics. |
| Tech Stack | Next.js, FastAPI, MUI, WebSockets, SQLAlchemy |
| AI Provider(s) | OpenAI / Anthropic (via API layer) |

---

## Core Features

### Sophiie Orbit Interaction
Natural voice capture and processing that allows users to interact with their workspace hands-free. The system uses Web Speech API for real-time recognition.

### Material Design 3 UI
A complete overhaul of the interface using M3 design tokens, featuring tonal palettes, dynamic elevations, and refined typography for a professional look.

### Real-time Workspace Sync
Powered by WebSockets, the workspace stays in sync across devices, providing instant updates for tasks, notes, and AI responses.

### High-Density Dashboard
Optimized for productivity, the dashboard provides a compact yet readable view of all active projects, tasks, and communications.

---

## Tech Stack

### Frontend
- Next.js 14 (App Router)
- Material UI (MUI) with M3 tokens
- React Hook Form + Zod
- Web Speech API

### Backend
- FastAPI
- SQLAlchemy + aiosqlite
- WebSockets for real-time communication
- JWT Authentication

---

## Getting Started

Refer to [TESTING.md](TESTING.md) for detailed instructions on how to set up and run Sophiie Space locally.

---

## Architecture

Sophiie Space follows a modern client-server architecture:
1. **Frontend**: A Next.js application that handles UI/UX and voice recognition.
2. **Backend**: A FastAPI server managing authentication, database persistence, and real-time state synchronization via WebSockets.
3. **Database**: SQLite for lightweight, efficient local storage.

---

## License

This project is submitted as part of the Sophiie AI Agents Hackathon 2026.
