#!/bin/bash
# Deployment script for different environments

ENVIRONMENT=${1:-local}
echo "🚀 Deploying to $ENVIRONMENT environment..."

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker first."
    exit 1
fi

case $ENVIRONMENT in
    "local")
        print_status "Starting local development environment..."
        docker-compose up --build -d
        ;;
    "staging")
        print_status "Deploying to staging environment..."
        if [ -f "docker-compose.staging.yml" ]; then
            docker-compose -f docker-compose.yml -f docker-compose.staging.yml up -d --build
        else
            print_warning "docker-compose.staging.yml not found, using default..."
            docker-compose up -d --build
        fi
        ;;
    "production")
        print_status "Deploying to production environment..."
        if [ -f "docker-compose.prod.yml" ]; then
            docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
        else
            print_error "docker-compose.prod.yml not found!"
            exit 1
        fi
        ;;
    "down")
        print_status "Stopping all services..."
        docker-compose down
        ;;
    "clean")
        print_status "Cleaning up containers and volumes..."
        docker-compose down -v --remove-orphans
        docker system prune -f
        ;;
    *)
        echo "Usage: $0 {local|staging|production|down|clean}"
        echo ""
        echo "Commands:"
        echo "  local      - Start local development environment"
        echo "  staging    - Deploy to staging environment"
        echo "  production - Deploy to production environment"
        echo "  down       - Stop all services"
        echo "  clean      - Clean up containers and volumes"
        exit 1
        ;;
esac

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 5

# Run health check
if [ -f "scripts/devops/health-check.sh" ]; then
    print_status "Running health check..."
    ./scripts/devops/health-check.sh
else
    print_warning "Health check script not found, skipping..."
fi

print_status "✅ Deployment to $ENVIRONMENT complete!"
