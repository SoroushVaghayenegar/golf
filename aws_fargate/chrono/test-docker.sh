#!/bin/bash

# Script to test Docker container locally
# Usage: ./test-docker.sh

set -e

# Load environment variables from .env file if it exists
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(cat .env | grep -v '^#' | xargs)
else
    echo "Warning: .env file not found. Make sure environment variables are set."
fi

# Build Docker image
echo "Building Docker image..."
docker build -t fetchteetimes-chrono-test .

# Run Docker container with environment variables
echo "Running Docker container..."
docker run --rm \
    -e SUPABASE_URL="$SUPABASE_URL" \
    -e SUPABASE_SERVICE_ROLE_KEY="$SUPABASE_SERVICE_ROLE_KEY" \
    -e REGION_ID="$REGION_ID" \
    -e CRON_CHECK_URL="$CRON_CHECK_URL" \
    -e SENTRY_DSN="$SENTRY_DSN" \
    fetchteetimes-chrono-test

echo "Docker test completed!"

