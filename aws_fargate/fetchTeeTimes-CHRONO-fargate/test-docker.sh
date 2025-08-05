#!/bin/bash

# Test script for Dockerfile

echo "Building Docker image..."
docker build -t fetch-tee-times-test .

echo "Testing Docker container..."
docker run --rm \
  -e SUPABASE_URL="https://pwgthtueicuiaimfaggt.supabase.co" \
  -e SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB3Z3RodHVlaWN1aWFpbWZhZ2d0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA0NDA3NDMsImV4cCI6MjA2NjAxNjc0M30.LaHq1QHtA2xil4IqDE01nYsRQlhvg4d4mY5v8aiCaLg" \
  fetch-tee-times-test

echo "Docker test completed!" 