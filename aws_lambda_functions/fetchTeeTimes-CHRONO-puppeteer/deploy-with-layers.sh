#!/bin/bash

# Disable AWS CLI pager to avoid interactive prompts
export AWS_PAGER=""

# Configuration
FUNCTION_NAME=$(basename "$(pwd)")
LAYER_NAME="${FUNCTION_NAME}-dependencies"
REGION="us-west-2"  # Change this to your preferred region
RUNTIME="nodejs20.x"
HANDLER="index.handler"
ROLE_ARN="arn:aws:iam::YOUR_ACCOUNT_ID:role/YOUR_LAMBDA_ROLE"  # Set your Lambda execution role ARN here

echo "Deploying Lambda function with layers: $FUNCTION_NAME"

# Check if AWS CLI is installed
if ! command -v aws &> /dev/null; then
    echo "Error: AWS CLI is not installed"
    exit 1
fi

# Create temporary directories
LAYER_DIR="layer-build"
FUNCTION_DIR="function-build"

echo "Creating build directories..."
rm -rf "$LAYER_DIR" "$FUNCTION_DIR"
mkdir -p "$LAYER_DIR/nodejs" "$FUNCTION_DIR"

# Install all dependencies first (including dev dependencies for TypeScript compilation)
echo "Installing all dependencies for compilation..."
npm install

# Build TypeScript files
echo "Building TypeScript files..."
npm run build

# === LAYER CREATION ===
echo "Creating Lambda Layer with all production dependencies..."

# Copy the original package.json and extract only the dependencies (excluding large ones)
echo "Extracting production dependencies from package.json (excluding large dependencies)..."
node -e "
const pkg = require('./package.json');
const allDeps = pkg.dependencies || {};

// Exclude large dependencies that might exceed layer size limits
const excludedDeps = ['@sparticuz/chromium'];
const layerDeps = {};

Object.keys(allDeps).forEach(dep => {
  if (!excludedDeps.includes(dep)) {
    layerDeps[dep] = allDeps[dep];
  }
});

const layerPkg = {
  name: pkg.name + '-layer',
  version: pkg.version,
  dependencies: layerDeps
};

console.log('Layer dependencies:', Object.keys(layerDeps));
console.log('Excluded dependencies (will be in function):', excludedDeps);

require('fs').writeFileSync('$LAYER_DIR/nodejs/package.json', JSON.stringify(layerPkg, null, 2));
"

# Install layer dependencies
echo "Installing all production dependencies in layer..."
cd "$LAYER_DIR/nodejs"
npm install --production --no-package-lock

# Verify the layer structure
echo "Verifying layer structure..."
echo "Layer contents:"
ls -la
echo "node_modules contents:"
ls -la node_modules/ | head -10
echo "Checking if @sentry/aws-serverless is installed:"
ls -la node_modules/@sentry/ 2>/dev/null || echo "@sentry directory not found"

cd ../..

# Create layer zip with optimizations
echo "Creating optimized layer deployment package..."
cd "$LAYER_DIR"

# Remove unnecessary files to reduce layer size
echo "Optimizing layer size by removing unnecessary files..."
find nodejs/node_modules -name "*.md" -delete
find nodejs/node_modules -name "*.txt" -delete
find nodejs/node_modules -name "LICENSE*" -delete
find nodejs/node_modules -name "CHANGELOG*" -delete
find nodejs/node_modules -name "*.map" -delete
find nodejs/node_modules -name "test" -type d -exec rm -rf {} + 2>/dev/null || true
find nodejs/node_modules -name "tests" -type d -exec rm -rf {} + 2>/dev/null || true
find nodejs/node_modules -name "example" -type d -exec rm -rf {} + 2>/dev/null || true
find nodejs/node_modules -name "examples" -type d -exec rm -rf {} + 2>/dev/null || true
find nodejs/node_modules -name "docs" -type d -exec rm -rf {} + 2>/dev/null || true

# Check final size before zipping
echo "Final layer size before compression:"
du -sh .

zip -r "../${LAYER_NAME}.zip" . -x "*.sh" "*.md" ".git/*"

# Check compressed layer size
LAYER_SIZE=$(du -m "../${LAYER_NAME}.zip" | cut -f1)
echo "Compressed layer size: ${LAYER_SIZE}MB"

if [ "$LAYER_SIZE" -gt 65 ]; then
    echo "⚠️  WARNING: Layer size (${LAYER_SIZE}MB) is close to or exceeds AWS limit (70MB)"
    echo "If deployment fails, we'll need to exclude large dependencies from the layer"
fi

cd ..

# Deploy or update the layer
echo "Deploying Lambda Layer..."
echo "Publishing new layer version..."
LAYER_VERSION_RESPONSE=$(aws lambda publish-layer-version \
    --layer-name "$LAYER_NAME" \
    --zip-file "fileb://${LAYER_NAME}.zip" \
    --compatible-runtimes "$RUNTIME" \
    --region "$REGION")

# Extract the LayerVersionArn more reliably using jq or python
if command -v jq &> /dev/null; then
    LAYER_VERSION_ARN=$(echo "$LAYER_VERSION_RESPONSE" | jq -r '.LayerVersionArn')
else
    # Fallback to python for JSON parsing
    LAYER_VERSION_ARN=$(echo "$LAYER_VERSION_RESPONSE" | python3 -c "import sys, json; print(json.load(sys.stdin)['LayerVersionArn'])")
fi

if [ -z "$LAYER_VERSION_ARN" ]; then
    echo "ERROR: Failed to extract Layer Version ARN"
    echo "Layer response was: $LAYER_VERSION_RESPONSE"
    exit 1
fi

echo "Layer deployed with ARN: $LAYER_VERSION_ARN"

# === FUNCTION CREATION ===
echo "Creating Lambda Function package..."

# Copy function code to build directory
cp -r *.js "$FUNCTION_DIR/" 2>/dev/null || true

# Create package.json for function with excluded dependencies (chromium)
echo "Creating function package.json with excluded dependencies..."
node -e "
const pkg = require('./package.json');
const excludedDeps = ['@sparticuz/chromium'];
const functionDeps = {};

// Include only the excluded dependencies in the function
excludedDeps.forEach(dep => {
  if (pkg.dependencies && pkg.dependencies[dep]) {
    functionDeps[dep] = pkg.dependencies[dep];
  }
});

const functionPkg = {
  name: pkg.name,
  version: pkg.version,
  description: pkg.description,
  main: 'index.js',
  dependencies: functionDeps
};

console.log('Function dependencies:', Object.keys(functionDeps));
require('fs').writeFileSync('$FUNCTION_DIR/package.json', JSON.stringify(functionPkg, null, 2));
"

# Install the excluded dependencies in the function
echo "Installing excluded dependencies in function..."
cd "$FUNCTION_DIR"
npm install --production --no-package-lock
cd ..

# Create function deployment package
echo "Creating function deployment package..."
cd "$FUNCTION_DIR"
zip -r "../${FUNCTION_NAME}.zip" . -x "*.sh" "*.ts" "tsconfig.json" "*.md" ".git/*"
cd ..

# Deploy or update the function
echo "Deploying Lambda Function..."
if aws lambda get-function --function-name "$FUNCTION_NAME" --region "$REGION" &> /dev/null; then
    echo "Function exists. Updating code..."
    aws lambda update-function-code \
        --function-name "$FUNCTION_NAME" \
        --zip-file "fileb://${FUNCTION_NAME}.zip" \
        --region "$REGION"
    
    echo "Updating function configuration with layer..."
    aws lambda update-function-configuration \
        --function-name "$FUNCTION_NAME" \
        --layers "$LAYER_VERSION_ARN" \
        --region "$REGION" \
        --timeout 300 \
        --memory-size 1024
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
        --zip-file "fileb://${FUNCTION_NAME}.zip" \
        --layers "$LAYER_VERSION_ARN" \
        --region "$REGION" \
        --timeout 300 \
        --memory-size 1024 \
        --environment Variables='{}'
fi

# Clean up
echo "Cleaning up build artifacts..."
rm -rf "$LAYER_DIR" "$FUNCTION_DIR"
rm "${LAYER_NAME}.zip" "${FUNCTION_NAME}.zip"

# Verify function configuration
echo "Verifying function configuration..."
FUNCTION_CONFIG=$(aws lambda get-function-configuration --function-name "$FUNCTION_NAME" --region "$REGION")
echo "Function layers:"
echo "$FUNCTION_CONFIG" | python3 -c "import sys, json; config = json.load(sys.stdin); print([layer['Arn'] for layer in config.get('Layers', [])])" 2>/dev/null || echo "No layers found"

echo ""
echo "🚀 Deployment completed successfully!"
echo "📦 Layer: $LAYER_NAME"
echo "🔗 Layer ARN: $LAYER_VERSION_ARN"
echo "⚡ Function: $FUNCTION_NAME"
echo ""
echo "Note: The heavy dependencies (Chromium, Puppeteer, etc.) are now in the layer,"
echo "making your function deployment package much smaller and faster to deploy."
echo ""
echo "🔍 To debug dependency issues, check the layer contents with:"
echo "   aws lambda get-layer-version --layer-name $LAYER_NAME --version-number \$(echo '$LAYER_VERSION_ARN' | cut -d: -f8) --region $REGION"