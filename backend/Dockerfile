# Backend Dockerfile
FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for Piper TTS
RUN apt-get update && apt-get install -y \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for caching
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create directory for TTS models (models should be mounted as volume)
RUN mkdir -p tts_models

# Expose port
EXPOSE 8000

# Environment variables
ENV OLLAMA_URL=http://host.docker.internal:11434
ENV OLLAMA_MODEL=ministral-3:3b

# Run the application
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
