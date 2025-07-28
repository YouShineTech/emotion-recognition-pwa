#!/bin/bash
# Log aggregation and analysis script

SERVICE=${1:-all}
LOG_DIR="./logs/$(date +%Y%m%d)"
DAYS=${2:-1}

mkdir -p "$LOG_DIR"

echo "📋 Log Collection Report - $(date)"
echo "=================================="

case $SERVICE in
    "all")
        echo "📊 Collecting logs for all services..."
        docker-compose logs --tail=1000 > "$LOG_DIR/all_services_$(date +%H%M%S).log"

        # Also collect individual service logs
        for service in $(docker-compose config --services); do
            docker-compose logs --tail=500 "$service" > "$LOG_DIR/${service}_$(date +%H%M%S).log" 2>/dev/null
        done
        ;;
    "realtime")
        echo "🔴 Starting real-time log monitoring..."
        echo "Press Ctrl+C to stop"
        docker-compose logs -f
        ;;
    "errors")
        echo "❌ Collecting error logs..."
        docker-compose logs --tail=1000 2>&1 | grep -i error > "$LOG_DIR/errors_$(date +%H%M%S).log" || echo "No errors found"
        ;;
    *)
        if docker-compose ps | grep -q "$SERVICE"; then
            echo "📄 Collecting logs for $SERVICE..."
            docker-compose logs --tail=1000 "$SERVICE" > "$LOG_DIR/${SERVICE}_$(date +%H%M%S).log"
        else
            echo "❌ Service '$SERVICE' not found"
            echo "Available services:"
            docker-compose config --services
            exit 1
        fi
        ;;
esac

# Generate summary report
echo "📊 Generating log summary..."
cat > "$LOG_DIR/summary_$(date +%H%M%S).txt" << EOF
Log Collection Summary
======================
Date: $(date)
Service: $SERVICE
Log Directory: $LOG_DIR

Quick Analysis:
$(docker-compose ps 2>/dev/null || echo "Docker not running")

Recent Errors:
$(docker-compose logs --tail=100 2>&1 | grep -i error | head -10 || echo "No recent errors")

Container Status:
$(docker-compose ps --format "table {{.Service}}\t{{.Status}}\t{{.Ports}}" 2>/dev/null || echo "Unable to get status")
EOF

# Show log location
echo "=================================="
echo "✅ Logs collected successfully!"
echo "📁 Location: $LOG_DIR"
echo "📋 Files:"
ls -la "$LOG_DIR" | grep -v "^total"

# Optional: Show tail of logs
if [ "$SERVICE" != "realtime" ]; then
    echo ""
    echo "📖 Recent log entries:"
    tail -20 "$LOG_DIR"/*.log 2>/dev/null | head -10 || echo "No logs to display"
fi

# Usage instructions
echo ""
echo "🔧 Usage:"
echo "  ./scripts/devops/logs.sh [service|all|realtime|errors] [days]"
echo ""
echo "Examples:"
echo "  ./scripts/devops/logs.sh server      # Server logs only"
echo "  ./scripts/devops/logs.sh all         # All services"
echo "  ./scripts/devops/logs.sh realtime    # Real-time monitoring"
echo "  ./scripts/devops/logs.sh errors      # Error logs only"
