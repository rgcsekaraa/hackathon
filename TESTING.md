# Testing Instructions

This document provides step-by-step instructions to set up, run, and test Sophiie Space locally.

## Prerequisites

- Node.js (v18 or higher)
- Python (3.9 or higher)
- npm or yarn
- Virtualenv (recommended for Python)

## 1. Backend Setup (API)

The backend is built with FastAPI and handles data persistence and real-time communication.

```bash
# Navigate to the api directory
cd apps/api

# Create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize the database
# The database file (spatial_voice.db) is automatically created on first run.
# Ensure the directory has write permissions.

# Start the backend server
python main.py
```

The backend will be available at `http://localhost:8000` and `ws://localhost:8000`.

## 2. Frontend Setup (Web)

The frontend is a Next.js application.

```bash
# Navigate to the web directory
cd apps/web

# Install dependencies
npm install

# Configure environment variables
# Create a .env.local file if it doesn't exist
# NEXT_PUBLIC_API_URL=http://localhost:8000
# NEXT_PUBLIC_WS_URL=ws://localhost:8000

# Start the development server
npm run dev
```

The frontend will be available at `http://localhost:3000`.

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
