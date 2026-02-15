# apps/api/Dockerfile

# Base image
FROM python:3.11-slim as builder

# Set environment variables
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Install system dependencies
# ffmpeg: for audio processing
# libsodium-dev: for PyNaCl (LiveKit dependency)
# build-essential: for compiling some python packages
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsodium-dev \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Work directory
WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install -r requirements.txt

# Final stage
FROM python:3.11-slim

# Copy system dependencies from builder (complex for libs, easier to just reinstall minimal runtime deps)
# Actually, for slim images, it's safer to reinstall runtime deps.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    libsodium23 \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy installed python packages
COPY --from=builder /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# Copy app code
COPY . .

# Expose port
EXPOSE 8000

# Default command (can be overridden in Railway for worker)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
