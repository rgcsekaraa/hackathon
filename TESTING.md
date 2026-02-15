# Testing Instructions

This document provides step-by-step instructions to set up, run, and test Sophiie Space locally.

## Prerequisites

- Node.js (v18 or higher)
- Python (3.9 or higher)
- npm or yarn
- Virtualenv (recommended for Python)

## 1. Start Services

Run the web and API services in separate terminals:

```bash
pnpm run dev:api
pnpm run dev:web
```

Services:
- **Web Dashboard**: `http://localhost:3000`
- **API Server**: `http://localhost:8000`

## 2. Manual Start (Individual Services)

If you prefer running services in separate terminals or need to debug a specific service:

### Frontend (Web)
```bash
npx nx serve web
# or
cd apps/web && pnpm run dev
```

### Backend (API)
```bash
cd apps/api && uv run uvicorn main:app --reload
```

## 3. Verification Steps

### User Signup & Login
1. Navigate to `http://localhost:3000/auth/signup`.
2. Create a new account.
3. Verify redirection to the dashboard after successful signup.
4. Try logging out and logging back in at `http://localhost:3000/auth/login`.

### Dashboard & Navigation
1. Explore the dashboard view.
2. Verify that the M3 Sidebar and Top Bar are rendering correctly.
3. Toggle between dark and light modes.

### Voice Capture
1. Click the voice capture button in the workspace.
2. Provide microphone permissions when prompted.
3. Speak a few sentences and verify that the AI processes the input.

### Real-time Sync
1. Open the dashboard in two different browser windows/tabs.
2. Perform an action (e.g., add a task or message) in one window.
3. Verify that the update appears instantly in the other window.

## 4. Linting

To ensure code quality and stability, run the following command in the `apps/web` directory:

```bash
npm run lint
```
