#!/bin/bash

# ECR Update Script for fetch-tee-times
# Usage: ./update-ecr.sh

set -e  # Exit on any error

# Configuration
ECR_URI="471900483062.dkr.ecr.us-west-2.amazonaws.com/fetch-tee-times-chrono-region-1"
REGION="us-west-2"
IMAGE_TAG="latest"

echo "🚀 Starting ECR update process..."

# Step 1: Check if ECR repository exists, create if it doesn't
REPO_NAME="fetch-tee-times-chrono-region-1"
echo "🔍 Checking if ECR repository exists..."
if ! aws ecr describe-repositories --repository-names $REPO_NAME --region $REGION --no-paginate >/dev/null 2>&1; then
    echo "📦 Creating ECR repository: $REPO_NAME"
    aws ecr create-repository \
        --repository-name $REPO_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256 \
        --no-paginate
    echo "✅ Repository created successfully"
else
    echo "✅ Repository already exists"
fi

# Step 2: Login to ECR
echo "📝 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 3: Remove old images (optional, but good for cleanup)
echo "🧹 Cleaning up old images..."
docker rmi $ECR_URI:$IMAGE_TAG 2>/dev/null || echo "No old image to remove"
docker rmi fetch-tee-times:latest 2>/dev/null || echo "No local image to remove"

# Step 4: Build new image for AWS architecture
echo "🔨 Building new image for AWS (linux/amd64)..."
docker build --platform linux/amd64 -t fetch-tee-times .

# Step 5: Tag for ECR
echo "🏷️  Tagging image for ECR..."
docker tag fetch-tee-times:latest $ECR_URI:$IMAGE_TAG

# Step 6: Push to ECR
echo "📤 Pushing to ECR..."
docker push $ECR_URI:$IMAGE_TAG

# Step 7: Verify push
echo "✅ Verifying push..."
aws ecr describe-images \
  --repository-name $REPO_NAME \
  --region $REGION \
  --query 'imageDetails[?imageTags[?contains(@, `latest`)]].{Tag:imageTags[0],PushedAt:imagePushedAt,Size:imageSizeInBytes}' \
  --output table \
  --no-paginate

echo "🎉 ECR update completed successfully!"
echo "📊 Image URI: $ECR_URI:$IMAGE_TAG"
echo "⏰ Next scheduled task will use the new image automatically" 