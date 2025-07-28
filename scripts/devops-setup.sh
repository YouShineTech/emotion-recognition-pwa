#!/bin/bash
# 🏗️ DevOps Setup Script for Emotion Recognition PWA
# This script sets up the complete DevOps environment

set -e

echo "🚀 Starting DevOps Environment Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Create necessary directories
print_status "Creating DevOps directories..."
mkdir -p monitoring/prometheus
mkdir -p monitoring/grafana/dashboards
mkdir -p monitoring/grafana/provisioning/dashboards
mkdir -p monitoring/grafana/provisioning/datasources
mkdir -p scripts/devops
mkdir -p .github/workflows

# Create Prometheus configuration
print_status "Setting up Prometheus configuration..."
cat > monitoring/prometheus/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  - "alert_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node-exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'emotion-client'
    static_configs:
      - targets: ['client:3000']
    metrics_path: '/metrics'

  - job_name: 'emotion-server'
    static_configs:
      - targets: ['server:3001']
    metrics_path: '/metrics'
EOF

# Create Grafana datasource configuration
print_status "Setting up Grafana datasources..."
cat > monitoring/grafana/provisioning/datasources/prometheus.yml << EOF
apiVersion: 1
datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Create basic dashboard
print_status "Creating basic monitoring dashboard..."
cat > monitoring/grafana/dashboards/emotion-app-dashboard.json << EOF
{
  "dashboard": {
    "id": null,
    "title": "Emotion Recognition PWA",
    "tags": ["emotion", "pwa"],
    "timezone": "browser",
    "panels": [
      {
        "id": 1,
        "title": "Request Rate",
        "type": "graph",
        "targets": [
          {
            "expr": "rate(http_requests_total[5m])",
            "legendFormat": "{{method}} {{status}}"
          }
        ]
      },
      {
        "id": 2,
        "title": "Response Time",
        "type": "graph",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))",
            "legendFormat": "95th percentile"
          }
        ]
      }
    ]
  }
}
EOF

# Create GitHub Actions workflow
print_status "Setting up CI/CD pipeline..."
cat > .github/workflows/ci-cd.yml << EOF
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'
        cache-dependency-path: |
          client/package-lock.json
          server/package-lock.json

    - name: Install client dependencies
      run: npm ci --prefix client

    - name: Install server dependencies
      run: npm ci --prefix server

    - name: Run client tests
      run: npm test --prefix client

    - name: Run server tests
      run: npm test --prefix server

    - name: Build client
      run: npm run build --prefix client

    - name: Build server
      run: npm run build --prefix server

    - name: Security scan
      run: |
        npm audit --prefix client
        npm audit --prefix server

    - name: Build Docker images
      run: |
        docker build -t emotion-client ./client
        docker build -t emotion-server ./server

    - name: Test Docker images
      run: |
        docker run --rm emotion-client npm test
        docker run --rm emotion-server npm test

  deploy-staging:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/develop'

    steps:
    - uses: actions/checkout@v4

    - name: Deploy to staging
      run: |
        echo "Deploying to staging environment..."
        # Add staging deployment commands here

  deploy-production:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Deploy to production
      run: |
        echo "Deploying to production environment..."
        # Add production deployment commands here
EOF

# Create monitoring stack
print_status "Creating monitoring stack..."
cat > monitoring/docker-compose.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    ports:
      - "9090:9090"
    volumes:
      - ./prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/etc/prometheus/console_libraries'
      - '--web.console.templates=/etc/prometheus/consoles'
      - '--storage.tsdb.retention.time=200h'
      - '--web.enable-lifecycle'

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    ports:
      - "3001:3000"
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/provisioning:/etc/grafana/provisioning
      - ./grafana/dashboards:/var/lib/grafana/dashboards
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
      - GF_USERS_ALLOW_SIGN_UP=false

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    ports:
      - "9100:9100"
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    command:
      - '--path.procfs=/host/proc'
      - '--path.rootfs=/rootfs'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)($$|/)'

volumes:
  prometheus_data:
  grafana_data:
EOF

# Create health check script
print_status "Creating health check script..."
cat > scripts/devops/health-check.sh << 'EOF'
#!/bin/bash
# Health check script for all services

SERVICES=("client" "server" "nginx")
BASE_URL="http://localhost"

echo "🔍 Health Check Report - $(date)"
echo "================================"

for service in "${SERVICES[@]}"; do
    case $service in
        "client")
            response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL:3000" 2>/dev/null)
            ;;
        "server")
            response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL:3001/health" 2>/dev/null)
            ;;
        "nginx")
            response=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL:80" 2>/dev/null)
            ;;
    esac

    if [ "$response" = "200" ]; then
        echo "✅ $service: HEALTHY"
    else
        echo "❌ $service: UNHEALTHY (HTTP $response)"
    fi
done

echo "================================"
EOF

chmod +x scripts/devops/health-check.sh

# Create deployment script
print_status "Creating deployment script..."
cat > scripts/devops/deploy.sh << 'EOF'
#!/bin/bash
# Deployment script for different environments

ENVIRONMENT=${1:-staging}
echo "🚀 Deploying to $ENVIRONMENT environment..."

case $ENVIRONMENT in
    "local")
        docker-compose up --build -d
        ;;
    "staging")
        docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d
        ;;
    "production")
        docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
        ;;
    *)
        echo "Usage: $0 {local|staging|production}"
        exit 1
        ;;
esac

echo "✅ Deployment to $ENVIRONMENT complete!"
EOF

chmod +x scripts/devops/deploy.sh

# Create backup script
print_status "Creating backup script..."
cat > scripts/devops/backup.sh << 'EOF'
#!/bin/bash
# Backup script for critical data

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup in $BACKUP_DIR..."

# Backup database
docker-compose exec -T db pg_dump -U user emotion_db > "$BACKUP_DIR/database.sql"

# Backup application data
tar -czf "$BACKUP_DIR/app_data.tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    ./client ./server ./shared

# Backup configuration
cp docker-compose.yml "$BACKUP_DIR/"
cp -r nginx "$BACKUP_DIR/"

echo "✅ Backup completed: $BACKUP_DIR"
EOF

chmod +x scripts/devops/backup.sh

# Create log aggregation script
print_status "Creating log aggregation script..."
cat > scripts/devops/logs.sh << 'EOF'
#!/bin/bash
# Log aggregation and analysis script

SERVICE=${1:-all}
LOG_DIR="./logs/$(date +%Y%m%d)"

mkdir -p "$LOG_DIR"

case $SERVICE in
    "all")
        docker-compose logs --tail=1000 > "$LOG_DIR/all_services.log"
        ;;
    *)
        docker-compose logs --tail=1000 "$SERVICE" > "$LOG_DIR/${SERVICE}.log"
        ;;
esac

echo "📋 Logs saved to $LOG_DIR"
EOF

chmod +x scripts/devops/logs.sh

# Create environment configuration templates
print_status "Creating environment templates..."
cat > .env.template << EOF
# Environment Configuration Template
NODE_ENV=development
PORT=3000
SERVER_PORT=3001

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/emotion_db
REDIS_URL=redis://localhost:6379

# Security
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# External Services
WEBRTC_STUN_SERVER=stun:stun.l.google.com:19302
WEBRTC_TURN_SERVER=turn:your-turn-server.com:3478
WEBRTC_TURN_USERNAME=username
WEBRTC_TURN_PASSWORD=password

# Monitoring
PROMETHEUS_PORT=9090
GRAFANA_PORT=3001
EOF

# Create production compose file
print_status "Creating production configuration..."
cat > docker-compose.prod.yml << EOF
version: '3.8'

services:
  nginx:
    build: ./nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.prod.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - client
      - server

  client:
    build:
      context: ./client
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
    depends_on:
      - server

  server:
    build:
      context: ./server
      dockerfile: Dockerfile.prod
    environment:
      - NODE_ENV=production
      - DATABASE_URL=\${DATABASE_URL}
      - REDIS_URL=\${REDIS_URL}
    depends_on:
      - db
      - redis

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: emotion_db
      POSTGRES_USER: \${DB_USER}
      POSTGRES_PASSWORD: \${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  redis:
    image: redis:7-alpine
    command: redis-server --requirepass \${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"

volumes:
  postgres_data:
  redis_data:
EOF

# Create staging compose file
print_status "Creating staging configuration..."
cat > docker-compose.staging.yml << EOF
version: '3.8'

services:
  nginx:
    build: ./nginx
    ports:
      - "8080:80"
    depends_on:
      - client
      - server

  client:
    build: ./client
    environment:
      - NODE_ENV=staging
    depends_on:
      - server

  server:
    build: ./server
    environment:
      - NODE_ENV=staging
      - DATABASE_URL=postgresql://staging_user:staging_pass@db:5432/emotion_staging
    depends_on:
      - db

  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: emotion_staging
      POSTGRES_USER: staging_user
      POSTGRES_PASSWORD: staging_pass
    volumes:
      - postgres_staging_data:/var/lib/postgresql/data

volumes:
  postgres_staging_data:
EOF

print_status "✅ DevOps environment setup complete!"
print_status "Next steps:"
echo "1. Copy .env.template to .env and configure"
echo "2. Run: ./scripts/devops/health-check.sh"
echo "3. Start monitoring: cd monitoring && docker-compose up -d"
echo "4. Deploy locally: ./scripts/devops/deploy.sh local"
echo ""
print_status "📚 Training materials available in .vscode/DEVOPS_TRAINING.md"
