#!/bin/bash
set -e

# Trap to forward signals to child processes
trap 'kill $(jobs -p) 2>/dev/null; exit' SIGINT SIGTERM

echo "Starting Sophiie Orbit..."

# Start the Backend (FastAPI)
echo "Starting API on port ${API_PORT:-8000}..."
cd /app/apps/api && uvicorn main:app --host 0.0.0.0 --port ${API_PORT:-8000} &
API_PID=$!

# Start the Frontend (Next.js standalone)
echo "Starting Web on port ${PORT:-3000}..."
cd /app/apps/web/standalone && PORT=${PORT:-3000} HOSTNAME=0.0.0.0 node apps/web/server.js &
WEB_PID=$!

echo "API PID: $API_PID, Web PID: $WEB_PID"

# Wait for either process to exit — if one crashes, bring down the other
wait -n
EXIT_CODE=$?

echo "A process exited with code $EXIT_CODE. Shutting down..."
kill $(jobs -p) 2>/dev/null
exit $EXIT_CODE
