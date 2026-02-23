#!/bin/bash
# Deploy backend and frontend to CapRover
# Usage: ./deploy.sh <caprover-password> [backend-app-name] [frontend-app-name]
#
# Example:
#   ./deploy.sh mypassword oath-logistics-backend oath-logistics-frontend

set -e

CAPROVER_URL="https://captain.cap.oathone.com"
PASSWORD="${1:?Usage: ./deploy.sh <caprover-password> [backend-app] [frontend-app]}"
BACKEND_APP="${2:-oath-logistics-backend}"
FRONTEND_APP="${3:-oath-logistics-frontend}"

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

echo "=== Deploying to CapRover at $CAPROVER_URL ==="
echo ""

# --- Deploy Backend ---
echo ">>> Packaging backend..."
BACKEND_TAR="$ROOT_DIR/backend-deploy.tar"
tar \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./.env' \
  --exclude='*.log' \
  -czf "$BACKEND_TAR" \
  -C "$ROOT_DIR/backend" .

echo ">>> Deploying backend to app: $BACKEND_APP"
caprover deploy \
  --host "$CAPROVER_URL" \
  --password "$PASSWORD" \
  --appName "$BACKEND_APP" \
  --tarFile "$BACKEND_TAR"

rm -f "$BACKEND_TAR"
echo ">>> Backend deployed!"
echo ""

# --- Deploy Frontend ---
echo ">>> Packaging frontend..."
FRONTEND_TAR="$ROOT_DIR/frontend-deploy.tar"
tar \
  --exclude='./node_modules' \
  --exclude='./dist' \
  --exclude='./.env' \
  --exclude='*.log' \
  -czf "$FRONTEND_TAR" \
  -C "$ROOT_DIR/frontend" .

echo ">>> Deploying frontend to app: $FRONTEND_APP"
caprover deploy \
  --host "$CAPROVER_URL" \
  --password "$PASSWORD" \
  --appName "$FRONTEND_APP" \
  --tarFile "$FRONTEND_TAR"

rm -f "$FRONTEND_TAR"
echo ">>> Frontend deployed!"
echo ""
echo "=== Done! ==="
