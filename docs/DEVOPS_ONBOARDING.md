# 🚀 DevOps Onboarding Guide - Emotion Recognition PWA

## Overview

This comprehensive guide takes you from zero to DevOps expert for the Emotion Recognition PWA. Whether you need to get running quickly or want deep understanding, this guide has you covered.

## 🏃‍♂️ Quick Start (10 Minutes)

### **Prerequisites**

- Docker & Docker Compose installed
- Git access to the repository
- Basic terminal knowledge

### **Get Running Now**

```bash
# 1. Clone and enter project
git clone [repository-url]
cd emotion-recognition-pwa

# 2. Start all services
docker-compose up --build -d

# 3. Verify everything is running
docker-compose ps
curl http://localhost:3000/health
curl http://localhost:3001/api/health
```

### **Essential Commands**

```bash
# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart specific service
docker-compose restart server

# Check resource usage
docker stats
```

### **Quick Health Check**

```bash
# Use existing health check script
./scripts/devops/health-check.sh

# Check specific service
./scripts/devops/health-check.sh | grep server
```

## 📚 Learning Path (Comprehensive Training)

### **Week 1: Foundation & Local Development**

#### **Day 1-2: Docker Fundamentals**

**Understanding the Architecture:**

```
┌─────────────────────────────────────────┐
│              Docker Host                │
│  ┌─────────┐  ┌─────────┐  ┌─────────┐ │
│  │ Client  │  │ Server  │  │Database │ │
│  │Container│  │Container│  │Container│ │
│  └─────────┘  └─────────┘  └─────────┘ │
│       │            │            │      │
│  ┌─────────────────────────────────┐   │
│  │        Docker Network          │   │
│  └─────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

**Hands-on Exercises:**

```bash
# Explore containers
docker-compose ps
docker-compose exec server sh

# Check networks
docker network ls
docker network inspect emotion-recognition-pwa_default

# Examine volumes
docker volume ls
docker volume inspect emotion-recognition-pwa_postgres_data
```

#### **Day 3-4: Service Management**

**Using Existing DevOps Scripts:**

```bash
# Deploy to different environments
./scripts/devops/deploy.sh local
./scripts/devops/deploy.sh staging

# View aggregated logs
./scripts/devops/logs.sh
./scripts/devops/logs.sh server

# Create backups
./scripts/devops/backup.sh
```

#### **Day 5: Environment Configuration**

**Create Environment Files:**

```bash
# Copy example environment
cp .env.example .env.development
cp .env.example .env.production

# Edit with your values
nano .env.development
```

**Environment Variables:**

```bash
# Development
NODE_ENV=development
PORT=3001
REDIS_URL=redis://localhost:6379
CORS_ORIGIN=http://localhost:3000

# Production
NODE_ENV=production
PORT=3001
REDIS_URL=redis://redis:6379
CORS_ORIGIN=https://yourdomain.com
```

### **Week 2: CI/CD Pipeline**

#### **Understanding GitHub Actions**

**Current Workflow Structure:**

```yaml
# .github/workflows/ci.yml (if exists)
name: CI/CD Pipeline
on:
  push: { branches: [main, develop] }
  pull_request: { branches: [main] }

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }

      - name: Install dependencies
        run: npm run install:all

      - name: Run tests
        run: npm test

      - name: Build
        run: npm run build:prod
```

#### **Local Pipeline Testing**

```bash
# Test build process locally
npm run build:prod

# Run all tests
npm test

# Check code quality
npm run lint
npm run format:check
```

### **Week 3: Monitoring & Observability**

#### **Setting Up Monitoring Stack**

**Create Monitoring Configuration:**

```bash
# Create monitoring directory
mkdir -p monitoring

# Create docker-compose for monitoring
cat > monitoring/docker-compose.yml << EOF
version: '3.8'
services:
  prometheus:
    image: prom/prometheus:latest
    ports: ['9090:9090']
    volumes: ['./prometheus.yml:/etc/prometheus/prometheus.yml']

  grafana:
    image: grafana/grafana:latest
    ports: ['3001:3000']
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
    volumes: ['grafana_data:/var/lib/grafana']

volumes:
  grafana_data:
EOF
```

**Start Monitoring:**

```bash
cd monitoring
docker-compose up -d

# Access dashboards
open http://localhost:3001  # Grafana (admin/admin123)
open http://localhost:9090  # Prometheus
```

#### **Key Metrics to Monitor**

- **Application**: Response times, error rates, active connections
- **Infrastructure**: CPU, memory, disk usage, network I/O
- **Business**: Emotion detection accuracy, user sessions
- **Real-time**: WebRTC connection quality, processing latency

### **Week 4: Advanced Operations**

#### **Scaling & Performance**

**Horizontal Scaling:**

```yaml
# docker-compose.prod.yml
version: '3.8'
services:
  server:
    deploy:
      replicas: 3
      resources:
        limits: { cpus: '0.5', memory: 512M }
        reservations: { cpus: '0.25', memory: 256M }
```

**Load Testing:**

```bash
# Install artillery
npm install -g artillery

# Basic load test
artillery quick --count 50 --num 100 http://localhost:3000

# Test WebRTC endpoints
artillery run tests/load/webrtc-load.yml
```

#### **Security Best Practices**

```bash
# Container security scan
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
  aquasec/trivy:latest image emotion-client:latest

# Dependency audit
npm audit --audit-level=high
npm audit fix

# Check for secrets
git log --grep="password\|secret\|key" --oneline
```

## 🔧 **Daily Operations**

### **Morning Checklist**

```bash
# Check service health
./scripts/devops/health-check.sh

# Review overnight logs
./scripts/devops/logs.sh | grep ERROR

# Check resource usage
docker stats --no-stream

# Verify backups
ls -la backups/ | tail -5
```

### **Deployment Process**

```bash
# 1. Test locally
npm test
npm run build:prod

# 2. Deploy to staging
./scripts/devops/deploy.sh staging

# 3. Run health checks
./scripts/devops/health-check.sh

# 4. Deploy to production (if staging passes)
./scripts/devops/deploy.sh production
```

### **Incident Response**

**Service Down:**

```bash
# 1. Check container status
docker-compose ps

# 2. Check logs
./scripts/devops/logs.sh | tail -100

# 3. Restart if needed
docker-compose restart [service-name]

# 4. Verify recovery
./scripts/devops/health-check.sh
```

**High Error Rate:**

```bash
# 1. Check application logs
./scripts/devops/logs.sh server | grep ERROR

# 2. Check recent deployments
git log --oneline -10

# 3. Rollback if needed
git checkout [previous-commit]
./scripts/devops/deploy.sh production
```

## 🎯 **Certification Levels**

### **Level 1: Foundation (Week 1)**

- [ ] Can start/stop local environment
- [ ] Understands Docker basics
- [ ] Can read logs and check health
- [ ] Knows where configuration files are

### **Level 2: Operations (Week 2-3)**

- [ ] Can deploy to staging/production
- [ ] Understands CI/CD pipeline
- [ ] Can set up monitoring
- [ ] Can troubleshoot common issues

### **Level 3: Expert (Week 4+)**

- [ ] Can optimize performance
- [ ] Can handle security incidents
- [ ] Can scale services
- [ ] Can mentor other team members

## 🚨 **Troubleshooting Guide**

### **Common Issues**

**Port Conflicts:**

```bash
# Check what's using ports
lsof -i :3000
lsof -i :3001

# Kill processes if needed
npm run kill:ports
```

**Docker Issues:**

```bash
# Reset Docker environment
docker system prune -f
docker-compose down -v

# Rebuild from scratch
docker-compose up --build --force-recreate
```

**Permission Issues:**

```bash
# Fix script permissions
chmod +x scripts/devops/*.sh

# Fix Docker permissions (Linux)
sudo usermod -aG docker $USER
newgrp docker
```

**Memory Issues:**

```bash
# Check Docker memory usage
docker stats

# Clean up unused resources
docker system prune -a
docker volume prune
```

## 📊 **Progress Tracking**

### **Week 1 Checklist**

- [ ] Local environment running
- [ ] Can use health check scripts
- [ ] Understands log locations
- [ ] Can restart services

### **Week 2 Checklist**

- [ ] Can deploy to staging
- [ ] Understands build process
- [ ] Can run tests locally
- [ ] Knows rollback procedure

### **Week 3 Checklist**

- [ ] Monitoring stack deployed
- [ ] Can create basic dashboards
- [ ] Understands key metrics
- [ ] Can respond to alerts

### **Week 4 Checklist**

- [ ] Can scale services
- [ ] Understands security scanning
- [ ] Can optimize performance
- [ ] Ready for production operations

## 📚 **Additional Resources**

### **Documentation**

- **Architecture**: `docs/ARCHITECTURE.md`
- **Build Guide**: `docs/BUILD_GUIDE.md`
- **Debugging**: `docs/DEBUGGING_GUIDE.md`

### **Scripts Reference**

- **Health Check**: `./scripts/devops/health-check.sh`
- **Deployment**: `./scripts/devops/deploy.sh`
- **Logs**: `./scripts/devops/logs.sh`
- **Backup**: `./scripts/devops/backup.sh`

### **External Resources**

- [Docker Documentation](https://docs.docker.com/)
- [Docker Compose Reference](https://docs.docker.com/compose/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)

## 🎓 **Next Steps**

1. **Start with Quick Start** - Get the system running
2. **Follow Week 1** - Build foundation knowledge
3. **Practice Daily Operations** - Build muscle memory
4. **Join Team Standups** - Learn from experienced team members
5. **Take on Incidents** - Apply knowledge in real scenarios

Remember: DevOps is learned by doing. Don't just read - practice with real systems and real problems.
