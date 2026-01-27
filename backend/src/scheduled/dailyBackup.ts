import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

/**
 * Scheduled Firestore Export
 * Runs daily at 2 AM UTC via Cloud Scheduler
 * 
 * Setup:
 * gcloud scheduler jobs create pubsub daily-firestore-backup \
 *   --schedule="0 2 * * *" \
 *   --topic="firestore-backup" \
 *   --message-body="trigger"
 */

const BACKUP_BUCKET = 'gs://wholesale-orchids-backups';
const COLLECTIONS = ['products', 'orders', 'users', 'settings'];

export const scheduledFirestoreExport = functions.pubsub
    .topic('firestore-backup')
    .onPublish(async (message) => {
        const timestamp = new Date().toISOString().split('T')[0];
        const outputUriPrefix = `${BACKUP_BUCKET}/${timestamp}`;

        try {
            const client = new admin.firestore.v1.FirestoreAdminClient();
            const projectId = process.env.GCP_PROJECT || process.env.GCLOUD_PROJECT;
            const databaseName = client.databasePath(project Id!, '(default)');

            console.log(`Starting Firestore export to: ${outputUriPrefix}`);

            const [operation] = await client.exportDocuments({
                name: databaseName,
                collectionIds: COLLECTIONS,
                outputUriPrefix,
            });

            console.log(`✅ Backup operation initiated: ${operation.name}`);
            console.log(`Collections: ${COLLECTIONS.join(', ')}`);

            return {
                success: true,
                operation: operation.name,
                timestamp,
            };
        } catch (error) {
            console.error('❌ Backup failed:', error);
            throw error;
        }
    });
