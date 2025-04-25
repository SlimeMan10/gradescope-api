#!/bin/bash
cd backend

# Check if virtual environment exists, create if it doesn't
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing dependencies..."
pip install gradescopeapi fastapi uvicorn
pip install -e .

# Start the server
echo "Starting Gradescope API server with auto-reload enabled..."
uvicorn src.gradescopeapi.api.api:app --reload --port 8000