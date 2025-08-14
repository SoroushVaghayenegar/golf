#!/bin/bash

# Exit on any error
set -e

# Configuration
LAMBDA_FUNCTION_NAME=$(basename "$(pwd)")
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

# Install dependencies compatible with Lambda runtime/arch
echo "📦 Resolving Lambda runtime and architecture..."
RUNTIME=$(aws lambda get-function-configuration --function-name $LAMBDA_FUNCTION_NAME --query 'Runtime' --output text)
ARCH=$(aws lambda get-function-configuration --function-name $LAMBDA_FUNCTION_NAME --query 'Architectures[0]' --output text)

if [ -z "$RUNTIME" ] || [ "$RUNTIME" = "None" ]; then
  echo "❌ Could not determine Lambda runtime. Ensure the function exists and AWS credentials are configured."
  exit 1
fi

PY_VER=$(echo "$RUNTIME" | sed -E 's/python([0-9]+)\.([0-9]+)/\1.\2/')
if [ -z "$PY_VER" ]; then
  echo "❌ Unable to parse Python version from runtime: $RUNTIME"
  exit 1
fi

if [ "$ARCH" = "arm64" ]; then
  PLATFORM="manylinux2014_aarch64"
else
  PLATFORM="manylinux2014_x86_64"
fi

echo "📦 Installing dependencies for runtime=$RUNTIME (python $PY_VER), arch=$ARCH, platform=$PLATFORM..."

# Use pip download to fetch correct manylinux wheels, then install from those wheels
WHEELS_DIR="$TEMP_DIR/wheels"
mkdir -p "$WHEELS_DIR"

python3 -m pip download -r requirements.txt \
  --platform "$PLATFORM" \
  --only-binary=:all: \
  --implementation cp \
  --python-version "$PY_VER" \
  --dest "$WHEELS_DIR"

echo "📦 Installing wheels into target directory..."
# Install by extracting wheels directly to avoid local interpreter tag checks
for whl in "$WHEELS_DIR"/*.whl; do
  echo "   → Unpacking $(basename "$whl")"
  unzip -q -o "$whl" -d "$TEMP_DIR"
done

# Create zip file
echo "🗜️ Creating deployment package..."
cd $TEMP_DIR
zip -r ../$ZIP_FILE . -x "*.pyc" -x "__pycache__/*" -x "*.DS_Store" -x "test.py" -x "email_preview.html"
cd ..

# Upload to AWS Lambda
echo "☁️ Uploading to AWS Lambda..."
aws lambda update-function-code \
    --function-name $LAMBDA_FUNCTION_NAME \
    --zip-file fileb://$ZIP_FILE \
    --no-cli-pager > /dev/null 2>&1

# Cleanup
echo "🧹 Cleaning up..."
rm -rf $TEMP_DIR

echo "✅ Deployment completed successfully!" 