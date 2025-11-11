#!/bin/bash
# Production Deployment Script for VPS
# Usage: ./deploy-production.sh

set -e  # Exit on error

echo "========================================"
echo "OATH Logistics Production Deployment"
echo "========================================"
echo ""

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if git is available
if ! command -v git &> /dev/null; then
    echo "Error: git is not installed"
    exit 1
fi

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null && ! command -v docker compose &> /dev/null; then
    echo "Error: docker-compose is not installed"
    exit 1
fi

# Determine docker-compose command
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

echo "Fetching latest changes from main branch..."
git fetch origin main

echo "Checking out main branch..."
git checkout main

echo "Pulling latest changes..."
git pull origin main

echo ""
echo "Stopping existing services..."
$DOCKER_COMPOSE down

echo ""
echo "Building new images..."
$DOCKER_COMPOSE build --no-cache

echo ""
echo "Starting services..."
$DOCKER_COMPOSE up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo ""
echo "Checking service status..."
$DOCKER_COMPOSE ps

echo ""
echo "========================================"
echo "Deployment Complete!"
echo "========================================"
echo ""
echo "Services should be available at:"
echo "  Frontend: https://mail.oathone.com"
echo "  Backend:  https://mailbackend.oathone.com/api"
echo ""
echo "To view logs:"
echo "  $DOCKER_COMPOSE logs -f"
echo ""

