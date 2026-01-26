#!/bin/bash

WEBHOOK_ENDPOINT="localhost:3000/api/webhooks/stripe"
SECRET_FILE="/tmp/stripe_webhook_secret_$$"

cleanup() {
  rm -f "$SECRET_FILE"
  # Kill all child processes
  pkill -P $$ 2>/dev/null
}
trap cleanup EXIT INT TERM

echo "Starting Stripe listener..."

# Start stripe listen in background and capture output
stripe listen --forward-to "$WEBHOOK_ENDPOINT" 2>&1 &
STRIPE_PID=$!

# Wait for the secret to appear in stripe listen output
echo "Waiting for webhook secret..."
sleep 2

# Get the secret from stripe listen --print-secret (same session)
WEBHOOK_SECRET=$(stripe listen --print-secret 2>/dev/null)

if [ -z "$WEBHOOK_SECRET" ]; then
  echo "Failed to get webhook secret. Make sure Stripe CLI is logged in."
  kill $STRIPE_PID 2>/dev/null
  exit 1
fi

echo ""
echo "=========================================="
echo "Webhook secret: $WEBHOOK_SECRET"
echo "=========================================="
echo ""

# Start Next.js with the webhook secret
STRIPE_WEBHOOK_SECRET="$WEBHOOK_SECRET" next dev &
NEXT_PID=$!

# Wait for both processes
wait $STRIPE_PID $NEXT_PID
