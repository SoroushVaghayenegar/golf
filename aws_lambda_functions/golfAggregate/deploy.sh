#!/bin/bash

set -Eeuo pipefail
trap 'echo "Error: command failed at line $LINENO" >&2' ERR

# Configuration
LAMBDA_FUNCTION_NAME="golfAggregate"  # Change this to your Lambda function name
TEMP_DIR="deploy_temp"
ZIP_FILE="deploy_file.zip"

echo "🚀 Starting deployment process..."

# Create temporary directory
echo "📁 Creating temporary directory..."
rm -rf $TEMP_DIR
mkdir $TEMP_DIR

# Copy Python files
echo "📋 Copying Python files..."
cp *.py $TEMP_DIR/

# Install dependencies
echo "📦 Installing dependencies..."
pip install -r requirements.txt -t $TEMP_DIR/

# Create zip file
echo "🗜️ Creating deployment package..."
cd $TEMP_DIR
zip -r ../$ZIP_FILE . -x "*.pyc" -x "__pycache__/*" -x "*.DS_Store" -x "test.py"
cd ..

# Upload to AWS Lambda
echo "☁️ Uploading to AWS Lambda..."
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://$ZIP_FILE \
    --no-cli-pager --output json

# Cleanup
echo "🧹 Cleaning up..."
rm -rf $TEMP_DIR

echo "✅ Deployment completed successfully!" 