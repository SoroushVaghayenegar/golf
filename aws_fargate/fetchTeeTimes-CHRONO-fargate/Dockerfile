# Use node base image with Chromium support
FROM node:22-slim

# Install required packages
RUN apt-get update && apt-get install -y \
  chromium \
  fonts-liberation \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libx11-xcb1 \
  libxcomposite1 \
  libxdamage1 \
  libxrandr2 \
  xdg-utils \
  --no-install-recommends && \
  apt-get clean && rm -rf /var/lib/apt/lists/*

# Puppeteer environment variables
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium \
    PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

# Set default environment variables (can be overridden at runtime)
ENV SUPABASE_URL="" \
    SUPABASE_SERVICE_ROLE_KEY=""

# Set working directory
WORKDIR /app

# Copy your files
COPY . .

# Install dependencies
RUN npm install

# Install ts-node globally for running TypeScript directly
RUN npm install -g ts-node

# Build TypeScript to check for compilation errors
RUN npm run build

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD node -e "console.log('Health check passed')" || exit 1

# Default command - run the TypeScript file directly
CMD ["ts-node", "index.ts"]
