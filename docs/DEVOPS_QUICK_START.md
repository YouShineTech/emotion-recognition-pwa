# 🚀 DevOps Quick Start Guide

## 🎯 **One-Command Setup**

Run the complete DevOps setup:

```bash
./scripts/devops-setup.sh
```

## 📋 **What Gets Created**

### ✅ **Configuration Files**

- `.env.template` - Environment variables template
- `docker-compose.prod.yml` - Production deployment
- `docker-compose.staging.yml` - Staging deployment
- `.github/workflows/ci-cd.yml` - Complete CI/CD pipeline

### ✅ **Monitoring Stack**

- **Prometheus** at http://localhost:9090
- **Grafana** at http://localhost:3001 (admin/admin123)
- **Node Exporter** for system metrics

### ✅ **DevOps Scripts**

- `./scripts/devops/health-check.sh` - Service health monitoring
- `./scripts/devops/deploy.sh` - Multi-environment deployment
- `./scripts/devops/backup.sh` - Automated backups
- `./scripts/devops/logs.sh` - Log aggregation

## 🏃‍♂️ **Quick Start Commands**

### **1. Initial Setup**

```bash
# Run the setup script
./scripts/devops-setup.sh

# Configure environment
cp .env.template .env
# Edit .env with your values
```

### **2. Local Development**

```bash
# Start all services
./scripts/devops/deploy.sh local

# Check health
./scripts/devops/health-check.sh

# View logs
./scripts/devops/logs.sh
```

### **3. Monitoring**

```bash
# Start monitoring stack
cd monitoring && docker-compose up -d

# Access dashboards
open http://localhost:3001  # Grafana
open http://localhost:9090  # Prometheus
```

### **4. Staging Deployment**

```bash
# Deploy to staging
./scripts/devops/deploy.sh staging

# Run health checks
./scripts/devops/health-check.sh
```

## 🎓 **Training Schedule**

### **Week 1: Foundation**

- Day 1: Run setup script, explore Docker
- Day 2: Practice with health checks
- Day 3: Learn log aggregation
- Day 4: Backup and restore exercises
- Day 5: Environment configuration

### **Week 2: CI/CD**

- Day 1: Study GitHub Actions workflow
- Day 2: Test pipeline locally with `act`
- Day 3: Deploy to staging
- Day 4: Monitor deployment metrics
- Day 5: Practice rollbacks

### **Week 3: Monitoring**

- Day 1: Set up Prometheus + Grafana
- Day 2: Create custom dashboards
- Day 3: Configure alerts
- Day 4: Performance tuning
- Day 5: Incident response drills

## 🔧 **Essential Commands Cheat Sheet**

### **Docker Commands**

```bash
# Build and run
docker-compose up --build

# View logs
docker-compose logs -f [service-name]

# Scale services
docker-compose up -d --scale server=3

# Clean up
docker-compose down -v
```

### **Health Monitoring**

```bash
# Check all services
./scripts/devops/health-check.sh

# Check specific service
./scripts/devops/health-check.sh | grep server

# Monitor resources
docker stats
```

### **Log Management**

```bash
# All service logs
./scripts/devops/logs.sh

# Specific service logs
./scripts/devops/logs.sh server

# Real-time monitoring
./scripts/devops/logs.sh | tail -f
```

### **Backup & Recovery**

```bash
# Create backup
./scripts/devops/backup.sh

# List backups
ls -la backups/

# Restore from backup
# (Manual process - see DEVOPS_TRAINING.md)
```

## 🚨 **Troubleshooting**

### **Common Issues**

1. **Port conflicts**

   ```bash
   # Check what's using ports
   lsof -i :3000
   lsof -i :3001
   ```

2. **Permission issues**

   ```bash
   # Fix script permissions
   chmod +x scripts/devops/*.sh
   ```

3. **Docker issues**
   ```bash
   # Reset Docker environment
   docker system prune -f
   docker-compose down -v
   ```

## 📊 **Training Progress Tracker**

Mark completed items:

- [ ] Setup script executed successfully
- [ ] Local environment running
- [ ] Health checks passing
- [ ] Monitoring stack deployed
- [ ] First CI/CD pipeline run
- [ ] Staging deployment completed
- [ ] Custom dashboard created
- [ ] Incident response drill completed

## 🎓 **Certification Checklist**

### **Level 1: Foundation**

- [ ] Can run local environment
- [ ] Understands Docker basics
- [ ] Can perform health checks
- [ ] Knows log locations

### **Level 2: Intermediate**

- [ ] Can deploy to staging
- [ ] Understands CI/CD pipeline
- [ ] Can create monitoring alerts
- [ ] Can troubleshoot common issues

### **Level 3: Expert**

- [ ] Can optimize performance
- [ ] Can handle incidents
- [ ] Can scale services
- [ ] Can implement security best practices

## 📞 **Support Resources**

### **Documentation**

- Full training guide: `docs/DEVOPS_TRAINING.md`
- Debugging guide: `docs/DEBUGGING_GUIDE.md`
- Module debugging: `.vscode/launch.json`

### **Community**

- GitHub Issues for questions
- Team Slack channel: #devops-training
- Weekly office hours: Fridays 2-3 PM

### **Tools**

- VSCode with recommended extensions
- Docker Desktop
- GitHub CLI (`gh`)
- `act` for testing GitHub Actions locally
