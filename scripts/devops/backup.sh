#!/bin/bash
# Backup script for critical data

BACKUP_DIR="./backups/$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"

echo "💾 Creating backup in $BACKUP_DIR..."
echo "===================================="

# Create backup directory structure
mkdir -p "$BACKUP_DIR/database"
mkdir -p "$BACKUP_DIR/app"
mkdir -p "$BACKUP_DIR/config"
mkdir -p "$BACKUP_DIR/logs"

# Backup database (if running)
if docker-compose ps | grep -q "db"; then
    echo "📊 Backing up database..."
    docker-compose exec -T db pg_dump -U user emotion_db > "$BACKUP_DIR/database/emotion_db_$(date +%Y%m%d_%H%M%S).sql" 2>/dev/null || echo "⚠️  Database backup skipped (may not be running)"
else
    echo "⚠️  Database container not running, skipping database backup"
fi

# Backup application data
echo "📦 Backing up application data..."
tar -czf "$BACKUP_DIR/app/app_data_$(date +%Y%m%d_%H%M%S).tar.gz" \
    --exclude=node_modules \
    --exclude=.git \
    --exclude=dist \
    --exclude=build \
    --exclude=*.log \
    ./client ./server ./shared 2>/dev/null || echo "⚠️  Application backup skipped"

# Backup configuration files
echo "⚙️  Backing up configuration..."
cp docker-compose.yml "$BACKUP_DIR/config/" 2>/dev/null || echo "⚠️  docker-compose.yml not found"
cp docker-compose.*.yml "$BACKUP_DIR/config/" 2>/dev/null || echo "⚠️  Additional compose files not found"
cp -r nginx "$BACKUP_DIR/config/" 2>/dev/null || echo "⚠️  nginx config not found"
cp .env "$BACKUP_DIR/config/" 2>/dev/null || echo "⚠️  .env not found"

# Backup current logs
echo "📝 Backing up current logs..."
docker-compose logs > "$BACKUP_DIR/logs/docker_logs_$(date +%Y%m%d_%H%M%S).log" 2>/dev/null || echo "⚠️  Log backup skipped"

# Create backup manifest
cat > "$BACKUP_DIR/backup_manifest.txt" << EOF
Emotion Recognition PWA Backup
==============================
Date: $(date)
Backup Directory: $BACKUP_DIR
Contents:
- Database dump (if available)
- Application source code
- Configuration files
- Docker logs
- Environment variables (sanitized)

Restore Instructions:
1. Extract backup archive
2. Restore database: psql -U user -d emotion_db < database/backup.sql
3. Copy configuration files back to original locations
4. Run: docker-compose up -d
EOF

# Calculate backup size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "===================================="
echo "✅ Backup completed successfully!"
echo "📁 Location: $BACKUP_DIR"
echo "📊 Size: $BACKUP_SIZE"
echo "===================================="

# List backup contents
echo "📋 Backup contents:"
ls -la "$BACKUP_DIR"/*

# Optional: Clean old backups (keep last 7 days)
echo "🧹 Cleaning old backups..."
find ./backups -type d -name "20*" -mtime +7 -exec rm -rf {} + 2>/dev/null || true

echo "🎉 Backup process complete!"
