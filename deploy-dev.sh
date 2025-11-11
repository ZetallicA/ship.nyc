#!/bin/bash
# Dev/Stage Deployment Script
# Usage: ./deploy-dev.sh

set -e  # Exit on error

echo "========================================"
echo "OATH Logistics Dev/Stage Deployment"
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

echo "Fetching latest changes from develop branch..."
git fetch origin develop

echo "Checking out develop branch..."
git checkout develop

echo "Pulling latest changes..."
git pull origin develop

echo ""
echo "Stopping existing dev services..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml down

echo ""
echo "Building new images..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml build --no-cache

echo ""
echo "Starting dev services..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml up -d

echo ""
echo "Waiting for services to be healthy..."
sleep 10

echo ""
echo "Checking service status..."
$DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml ps

echo ""
echo "========================================"
echo "Dev/Stage Deployment Complete!"
echo "========================================"
echo ""
echo "Services should be available at:"
echo "  Frontend: https://dev.mail.oathone.com"
echo "  Backend:  https://dev.mailbackend.oathone.com/api"
echo ""
echo "To view logs:"
echo "  $DOCKER_COMPOSE -f docker-compose.yml -f docker-compose.dev.yml logs -f"
echo ""

