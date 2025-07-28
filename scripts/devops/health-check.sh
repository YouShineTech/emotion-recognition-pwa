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

# Check Docker containers
echo "🐳 Docker Container Status:"
docker-compose ps

# Check resource usage
echo "📊 Resource Usage:"
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
