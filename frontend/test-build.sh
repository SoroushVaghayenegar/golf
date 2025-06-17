#!/bin/bash

# Exit on any error
set -e

echo "Starting build process..."

# Run the build command
npm run build

# If build is successful (script will exit if build fails due to set -e)
echo "Build successful! Cleaning up build files..."

# Remove the .next directory
rm -rf .next

echo "Cleanup complete!" 