#!/bin/bash

# Script to build and push Docker image to AWS ECR
# Usage: ./update-or-create-ecr.sh [repository-name] [region]

set -e

# Default values
REPOSITORY_NAME="${1:-fetch-tee-times-chrono-region-based}"
AWS_REGION="${2:-us-west-2}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "=========================================="
echo "Building and pushing Docker image to ECR"
echo "Repository: $REPOSITORY_NAME"
echo "Region: $AWS_REGION"
echo "Account ID: $AWS_ACCOUNT_ID"
echo "=========================================="

# Create ECR repository if it doesn't exist
echo "Checking if ECR repository exists..."
if ! aws ecr describe-repositories --repository-names "$REPOSITORY_NAME" --region "$AWS_REGION" &> /dev/null; then
    echo "Creating ECR repository: $REPOSITORY_NAME"
    aws ecr create-repository \
        --repository-name "$REPOSITORY_NAME" \
        --region "$AWS_REGION" \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo "Repository created successfully!"
else
    echo "Repository already exists."
fi

# Login to ECR
echo "Logging in to ECR..."
aws ecr get-login-password --region "$AWS_REGION" | docker login --username AWS --password-stdin "$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com"

# Build Docker image
echo "Building Docker image for linux/amd64 platform..."
docker build --platform linux/amd64 -t "$REPOSITORY_NAME" .

# Tag the image
IMAGE_URI="$AWS_ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$REPOSITORY_NAME:latest"
echo "Tagging image: $IMAGE_URI"
docker tag "$REPOSITORY_NAME:latest" "$IMAGE_URI"

# Push to ECR
echo "Pushing image to ECR..."
docker push "$IMAGE_URI"

echo "=========================================="
echo "SUCCESS!"
echo "Image URI: $IMAGE_URI"
echo "=========================================="

