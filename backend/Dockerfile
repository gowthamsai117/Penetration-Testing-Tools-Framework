# Use Python slim base image (faster and more stable than Kali)
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install essential system tools and utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    nmap \
    dnsutils \
    traceroute \
    curl \
    wget \
    git \
    net-tools \
    iputils-ping \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy backend files from backend directory
COPY requirements.txt .
COPY server.py .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Expose port
EXPOSE 5000

# Set environment for Flask
ENV FLASK_APP=server.py
ENV FLASK_ENV=development
ENV PYTHONUNBUFFERED=1

# Run the server
CMD ["python3", "-u", "server.py"]
