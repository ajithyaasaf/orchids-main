#!/bin/bash

# Wholesale Platform - Daily Firestore Backup Script
# Implements automated backup strategy for greenfield deployment

DATE=$(date +%Y-%m-%d)
TIMESTAMP=$(date +%Y-%m-%d-%H%M%S)
BUCKET="gs://wholesale-orchids-backups"

echo "========================================="
echo "Firestore Backup - Wholesale Platform"
echo "Date: $DATE"
echo "========================================="

# Export Firestore collections
echo "Starting Firestore export..."

gcloud firestore export \
  --collection-ids='products,orders,users,settings' \
  "$BUCKET/daily-backup-$TIMESTAMP"

if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully"
    echo "Location: $BUCKET/daily-backup-$TIMESTAMP"
else
    echo "❌ Backup failed"
    exit 1
fi

# Cleanup old backups (keep last 7 days)
echo ""
echo "Cleaning up old backups (retention: 7 days)..."

SEVEN_DAYS_AGO=$(date -d '7 days ago' +%Y-%m-%d)

gsutil -m rm -r "$BUCKET/daily-backup-$SEVEN_DAYS_AGO-*" 2>/dev/null

echo "✅ Cleanup complete"
echo "========================================="
