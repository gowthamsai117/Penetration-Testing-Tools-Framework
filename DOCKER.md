# Docker setup instructions for Pentest Tools Backend

## Prerequisites
- Docker installed
- Docker Compose installed

## Quick Start

### 1. Build and Run the Container

```bash
# Navigate to project root
cd pentest-tools

# Build and start the backend container
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

### 2. Check Container Status

```bash
# View running containers
docker ps

# View logs
docker logs pentest-backend

# Follow logs in real-time
docker logs -f pentest-backend
```

### 3. Stop the Container

```bash
# Stop container
docker-compose down

# Stop and remove volumes
docker-compose down -v
```

---

## Configure Frontend to Connect

The backend will be available at:
- **From Windows:** `http://localhost:5000`
- **From Docker Container:** `http://pentest-backend:5000`
- **From Kali VM (if applicable):** `http://192.168.x.x:5000`

Update [src/config.js](src/config.js):

```javascript
export const API_BASE_URL = 'http://localhost:5000';
```

---

## Run Frontend with Backend

```bash
# Terminal 1: Start backend
docker-compose up

# Terminal 2: Start frontend
npm start
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process on port 5000
lsof -i :5000

# Stop Docker container
docker-compose down
```

### Rebuild Container After Changes
```bash
docker-compose up --build --force-recreate
```

### Access Backend Shell
```bash
docker exec -it pentest-backend bash
```

---

## Included Tools

The Docker container includes all Kali Linux pentest tools:
- ✅ Nmap
- ✅ Dig / nslookup
- ✅ Dnsmap
- ✅ Dnsenum
- ✅ Sublist3r
- ✅ theHarvester
- ✅ Recon-ng
- ✅ WhatWeb
- ✅ Wappalyzer
- ✅ WPScan
- ✅ Wafw00f
- ✅ Traceroute
- ✅ Zmap
