import { db } from '../config/firebase';
import { ComboAnalyticsEvent, ComboAnalyticsEventType, ComboAnalytics } from '@tntrends/shared';

/**
 * Combo Analytics Service - Event tracking and aggregation
 * 
 * Design: Event-sourcing pattern
 * - Track individual events for flexibility
 * - Aggregate on-demand for dashboards
 * - Easy to add new metrics in Path 2
 */

const ANALYTICS_COLLECTION = 'combo-analytics';

/**
 * Track a combo event (view, applied, converted, removed, expired)
 */
export const trackComboEvent = async (
    event: ComboAnalyticsEventType,
    comboId: string,
    metadata: {
        cartValue?: number;
        savings?: number;
        orderId?: string;
        itemCount?: number;
        userId?: string;
        reason?: string;
    } = {}
): Promise<void> => {
    try {
        await db.collection(ANALYTICS_COLLECTION).add({
            comboId,
            event,
            metadata,
            timestamp: new Date(),
        });
    } catch (error: any) {
        // Don't throw - analytics failures shouldn't block operations
        console.error('Failed to track combo event:', error);
    }
};

/**
 * Get aggregated analytics for a specific combo
 */
export const getComboAnalytics = async (
    comboId: string,
    startDate?: Date,
    endDate?: Date
): Promise<ComboAnalytics | null> => {
    try {
        let query = db.collection(ANALYTICS_COLLECTION)
            .where('comboId', '==', comboId);

        // Apply date filters if provided
        if (startDate) {
            query = query.where('timestamp', '>=', startDate);
        }
        if (endDate) {
            query = query.where('timestamp', '<=', endDate);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return null;
        }

        // Aggregate events
        let viewCount = 0;
        let appliedCount = 0;
        let convertedCount = 0;
        let removedCount = 0;
        let totalRevenue = 0;
        let totalSavingsGiven = 0;
        const orderValues: number[] = [];

        snapshot.docs.forEach(doc => {
            const data = doc.data() as ComboAnalyticsEvent;

            switch (data.event) {
                case 'view':
                    viewCount++;
                    break;
                case 'applied':
                    appliedCount++;
                    if (data.metadata.savings) {
                        totalSavingsGiven += data.metadata.savings;
                    }
                    break;
                case 'converted':
                    convertedCount++;
                    if (data.metadata.cartValue) {
                        totalRevenue += data.metadata.cartValue;
                        orderValues.push(data.metadata.cartValue);
                    }
                    break;
                case 'removed':
                    removedCount++;
                    break;
            }
        });

        const avgOrderValue = orderValues.length > 0
            ? orderValues.reduce((sum, val) => sum + val, 0) / orderValues.length
            : 0;

        const conversionRate = appliedCount > 0 ? convertedCount / appliedCount : 0;

        // Get combo name (fetch from combo document)
        const { getComboById } = await import('./comboService');
        const combo = await getComboById(comboId);

        return {
            comboId,
            comboName: combo?.name || 'Unknown Combo',
            viewCount,
            appliedCount,
            convertedCount,
            removedCount,
            totalRevenue,
            totalSavingsGiven,
            avgOrderValue,
            conversionRate,
            startDate: startDate || new Date(0),
            endDate: endDate || new Date(),
        };
    } catch (error: any) {
        console.error('Failed to get combo analytics:', error);
        return null;
    }
};

/**
 * Get analytics for all combos (dashboard summary)
 */
export const getAllCombosAnalytics = async (
    startDate?: Date,
    endDate?: Date
): Promise<ComboAnalytics[]> => {
    try {
        const { getAllCombos } = await import('./comboService');
        const allCombos = await getAllCombos();

        const analyticsPromises = allCombos.map(combo =>
            getComboAnalytics(combo.id, startDate, endDate)
        );

        const results = await Promise.all(analyticsPromises);

        // Filter out nulls and sort by conversion rate
        return results
            .filter((analytics): analytics is ComboAnalytics => analytics !== null)
            .sort((a, b) => b.conversionRate - a.conversionRate);
    } catch (error: any) {
        console.error('Failed to get all combos analytics:', error);
        return [];
    }
};

/**
 * Clean up old analytics events (optional - for storage optimization)
 * Can be run as a scheduled job
 */
export const cleanupOldAnalytics = async (daysToKeep: number = 90): Promise<number> => {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

        const snapshot = await db.collection(ANALYTICS_COLLECTION)
            .where('timestamp', '<', cutoffDate)
            .get();

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });

        await batch.commit();

        return snapshot.size;
    } catch (error: any) {
        console.error('Failed to cleanup old analytics:', error);
        return 0;
    }
};
