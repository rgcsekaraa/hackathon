#!/bin/bash

# Start the Backend (FastAPI)
cd /app/apps/api && uvicorn main:app --host 0.0.0.0 --port 8000 &

# Start the Frontend (Next.js)
cd /app/apps/web/standalone && PORT=3000 node server.js

# Wait for all processes to finish
wait -n
exit $?
