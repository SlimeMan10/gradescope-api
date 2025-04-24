#!/bin/bash
cd backend
echo "Starting Gradescope API server with auto-reload enabled..."
uvicorn src.gradescopeapi.api.api:app --reload --port 8000 