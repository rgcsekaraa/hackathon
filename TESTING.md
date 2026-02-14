# Testing Instructions

This document provides step-by-step instructions to set up, run, and test Sophiie Space locally.

## Prerequisites

- Node.js (v18 or higher)
- Python (3.9 or higher)
- npm or yarn
- Virtualenv (recommended for Python)

## 1. Unified Start (Recommended)

Run all services (Web, API, Mobile) in parallel:
```bash
npm run dev
```
This command uses Nx to launch:
- **Web Dashboard**: `http://localhost:3000`
- **API Server**: `http://localhost:8000`
- **Mobile (Expo)**: QR code in terminal

## 2. Manual Start (Individual Services)

If you prefer running services in separate terminals or need to debug a specific service:

### Frontend (Web)
```bash
npx nx serve web
# or
cd apps/web && npm run dev
```

### Backend (API)
```bash
npx nx serve api
# or
cd apps/api && source .venv/bin/activate && uvicorn main:app --reload
```

### Mobile (Expo)
```bash
npx nx serve mobile
# or
cd apps/mobile && npx expo start
```

## 3. Verification Steps

### User Signup & Login
1. Navigate to `http://localhost:3000/auth/signup`.
2. Create a new account.
3. Verify that you are redirected to the dashboard after successful signup.
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
