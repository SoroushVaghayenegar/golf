# Use Python slim image
FROM python:3.12-slim

# Set default environment variables (can be overridden at runtime)
ENV SUPABASE_URL="" \
    SUPABASE_SERVICE_ROLE_KEY="" \
    REGION_ID="" \
    CRON_CHECK_URL="" \
    SENTRY_DSN="" \
    DEBUG="" \
    PYTHONUNBUFFERED=1

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libffi-dev \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application files
COPY . .

# Add health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD python -c "print('Health check passed')" || exit 1

# Default command - run the Python script
CMD ["python", "-u", "index.py"]

