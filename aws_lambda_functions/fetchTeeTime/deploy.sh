#!/bin/bash

set -Eeuo pipefail
trap 'echo "Error: command failed at line $LINENO" >&2' ERR

# Disable AWS CLI pager to avoid interactive prompts
export AWS_PAGER=""

# Get the current directory name to use as Lambda function name
FUNCTION_NAME=$(basename "$(pwd)")
REGION="us-west-2"  # Change this to your preferred region
RUNTIME="nodejs20.x"
HANDLER="index.handler"
ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE"  # Set your Lambda execution role ARN here

echo "Deploying Lambda function: $FUNCTION_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Install dependencies (including dev dependencies for TypeScript compilation)
echo "Installing dependencies..."
npm install

# Build TypeScript files
echo "Building TypeScript files..."
npm run build

# Install production dependencies only for deployment
echo "Installing production dependencies for deployment..."
npm install --production

# Create deployment package including compiled JS files
echo "Creating deployment package..."
zip -r "$FUNCTION_NAME.zip" . -x "*.sh" "*.ts" "tsconfig.json" "*.md" ".git/*" "node_modules/.cache/*" "src/*"

# Check if function exists
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "Function exists. Updating code..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://$FUNCTION_NAME.zip" \
        --region "$REGION"
else
    echo "Function doesn't exist. Creating new function..."
    if [ -z "$ROLE_ARN" ]; then
        echo "Error: ROLE_ARN is not set. Please set the Lambda execution role ARN in the script."
        exit 1
    fi
    
    aws lambda create-function \
        --function-name "$FUNCTION_NAME" \
        --runtime "$RUNTIME" \
        --role "$ROLE_ARN" \
        --handler "$HANDLER" \
        --zip-file "fileb://$FUNCTION_NAME.zip" \
        --region "$REGION" \
        --timeout 300 \
        --memory-size 512
fi

# Clean up
echo "Cleaning up..."
rm "$FUNCTION_NAME.zip"

echo "Deployment completed for function: $FUNCTION_NAME" 