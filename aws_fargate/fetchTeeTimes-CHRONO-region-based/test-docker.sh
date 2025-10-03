#!/bin/bash

# Test script for Dockerfile

echo "Building Docker image..."
docker build -t fetch-tee-times-chrono-test .

echo "Testing Docker container..."
docker run --rm \
  --env-file .env \
  fetch-tee-times-chrono-test

echo "Docker test completed!"
