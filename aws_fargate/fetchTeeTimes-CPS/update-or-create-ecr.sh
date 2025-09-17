#!/bin/bash

# ECR Update/Create Script for fetch-tee-times-cps
# Usage: ./update-or-create-ecr.sh

set -e  # Exit on any error

# Configuration
ECR_REPOSITORY_NAME="fetch-tee-times-cps"
ECR_URI="471900483062.dkr.ecr.us-west-2.amazonaws.com/$ECR_REPOSITORY_NAME"
REGION="us-west-2"
IMAGE_TAG="latest"

echo "🚀 Starting ECR update/create process for $ECR_REPOSITORY_NAME..."

# Step 1: Check if ECR repository exists, create if it doesn't
echo "🔍 Checking if ECR repository exists..."
if aws ecr describe-repositories --repository-names $ECR_REPOSITORY_NAME --region $REGION >/dev/null 2>&1; then
    echo "✅ ECR repository '$ECR_REPOSITORY_NAME' already exists"
else
    echo "📦 Creating ECR repository '$ECR_REPOSITORY_NAME'..."
    aws ecr create-repository \
        --repository-name $ECR_REPOSITORY_NAME \
        --region $REGION \
        --image-scanning-configuration scanOnPush=true \
        --encryption-configuration encryptionType=AES256
    echo "✅ ECR repository '$ECR_REPOSITORY_NAME' created successfully"
fi

# Step 2: Login to ECR
echo "📝 Logging into ECR..."
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ECR_URI

# Step 3: Remove old images (optional, but good for cleanup)
echo "🧹 Cleaning up old images..."
docker rmi $ECR_URI:$IMAGE_TAG 2>/dev/null || echo "No old image to remove"
docker rmi fetch-tee-times-cps:latest 2>/dev/null || echo "No local image to remove"

# Step 4: Build new image for AWS architecture
echo "🔨 Building new image for AWS (linux/amd64)..."
docker build --platform linux/amd64 -t fetch-tee-times-cps .

# Step 5: Tag for ECR
echo "🏷️  Tagging image for ECR..."
docker tag fetch-tee-times-cps:latest $ECR_URI:$IMAGE_TAG

# Step 6: Push to ECR
echo "📤 Pushing to ECR..."
docker push $ECR_URI:$IMAGE_TAG

# Step 7: Verify push
echo "✅ Verifying push..."
aws ecr describe-images \
  --repository-name $ECR_REPOSITORY_NAME \
  --region $REGION \
  --no-paginate \
  --query 'imageDetails[?imageTags[?contains(@, `latest`)]].{Tag:imageTags[0],PushedAt:imagePushedAt,Size:imageSizeInBytes}' \
  --output table

echo "🎉 ECR update/create completed successfully!"
echo "📊 Image URI: $ECR_URI:$IMAGE_TAG"
echo "⏰ Next scheduled task will use the new image automatically"
