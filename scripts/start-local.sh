#!/bin/bash

# Exit on any error
set -e

# Define colors for better readability
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Redis with Docker...${NC}"
# Start Redis if not already running
export DOCKER_HOST=unix:///Users/Anton_Dvorson/.colima/default/docker.sock
if ! docker ps | grep -q omdbflix-redis; then
  docker-compose up -d redis
fi

# Get API key from .env file
if [ -f backend/.env ]; then
  OMDB_API_KEY=$(grep -E "^OMDB_API_KEY=" backend/.env | cut -d= -f2)
  echo -e "${GREEN}Found OMDB API key from .env file${NC}"
else
  OMDB_API_KEY="60babe8f"  # Use default key if .env doesn't exist
  echo -e "${BLUE}Using default OMDB API key${NC}"
fi

echo -e "${BLUE}Starting the backend in development mode...${NC}"
# Start the backend
cd backend
npm install
NODE_ENV=development PORT=5000 REDIS_URL=redis://localhost:6380 OMDB_API_KEY=$OMDB_API_KEY npm run dev &
BACKEND_PID=$!

# Wait for backend to start
echo -e "${BLUE}Waiting for backend to start...${NC}"
sleep 3

echo -e "${BLUE}Starting the frontend...${NC}"
# Start the frontend
cd ../frontend
npm install
NEXT_PUBLIC_API_URL=http://localhost:5000/api npm run dev &
FRONTEND_PID=$!

# Function to handle Ctrl+C
function cleanup() {
  echo -e "${BLUE}Shutting down services...${NC}"
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null || true
  echo -e "${GREEN}All services stopped.${NC}"
  exit 0
}

# Trap Ctrl+C
trap cleanup INT

echo -e "${GREEN}All services started!${NC}"
echo -e "${GREEN}Backend running at: http://localhost:5000${NC}"
echo -e "${GREEN}Frontend running at: http://localhost:3000${NC}"
echo -e "${BLUE}Press Ctrl+C to stop all services${NC}"

# Wait for signals
wait 