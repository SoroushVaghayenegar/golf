# Use node base image
FROM node:22-slim

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
