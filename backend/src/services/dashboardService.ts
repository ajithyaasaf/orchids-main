import * as admin from 'firebase-admin';
import { collections, db } from '../config/firebase';
import type { DashboardAnalytics, WholesaleOrder, WholesaleBundleItem } from '@orchids/shared';
import logger from '../utils/logger';

const ANALYTICS_DOC_ID = 'wholesale_dashboard_cache';

// Type Guard for Wholesale Items
const isWholesaleItem = (item: any): item is WholesaleBundleItem => {
    return item && item.bundlesOrdered !== undefined;
};

// Safe date parser
const parseDate = (d: any): Date | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) return isNaN(d.getTime()) ? undefined : d;
    if (typeof d.toDate === 'function') {
        const res = d.toDate();
        return isNaN(res.getTime()) ? undefined : res;
    }
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? undefined : parsed;
};

// Safe number helper
const getSafeNumber = (n: any): number => {
    return typeof n === 'number' && !isNaN(n) ? n : 0;
};

// Normalize Indian state names for proper geographic aggregation
const normalizeState = (raw?: string): string => {
    if (!raw) return 'Unknown';
    const trimmed = raw.trim();
    if (!trimmed) return 'Unknown';
    const lower = trimmed.toLowerCase();
    if (lower === 'tamilnadu' || lower === 'tamil nadu') return 'Tamil Nadu';
    if (lower === 'karnataka') return 'Karnataka';
    if (lower === 'kerala') return 'Kerala';
    if (lower === 'maharashtra') return 'Maharashtra';
    if (lower === 'andhra pradesh' || lower === 'andhrapradesh') return 'Andhra Pradesh';
    if (lower === 'telangana') return 'Telangana';
    return trimmed.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');
};

/**
 * Get comprehensive dashboard analytics (CACHED VERSION - 1 read instead of 10,000+)
 */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
    const cacheDoc = await collections.analytics.doc(ANALYTICS_DOC_ID).get();

    if (!cacheDoc.exists || (cacheDoc.data() as any).placedCount === undefined) {
        if (logger) logger.info('Analytics cache incomplete or missing, rebuilding...');
        else console.log('Analytics cache incomplete or missing, rebuilding...');
        return await rebuildAnalyticsCache();
    }

    return cacheDoc.data() as DashboardAnalytics;
};

/**
 * Record a newly created order into analytics pipeline counts
 */
export const recordOrderCreatedInAnalytics = async (order: WholesaleOrder): Promise<void> => {
    const analyticsRef = collections.analytics.doc(ANALYTICS_DOC_ID);
    const amount = getSafeNumber(order.totalAmount);
    const isPaid = order.paymentStatus === 'paid';

    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(analyticsRef);
            if (!doc.exists) return;

            const updatePayload: any = {
                placedCount: admin.firestore.FieldValue.increment(1),
                lastUpdated: new Date(),
            };
            if (!isPaid) {
                updatePayload.unpaidAmount = admin.firestore.FieldValue.increment(amount);
            }
            transaction.update(analyticsRef, updatePayload);
        });
    } catch (err) {
        logger.error('Failed to record order creation in analytics cache:', err);
    }
};

/**
 * Update analytics pipeline counts when order status transitions
 */
export const updateOrderStatusInAnalytics = async (
    previousStatus: string,
    newStatus: string,
    order: WholesaleOrder
): Promise<void> => {
    if (previousStatus === newStatus) return;

    const analyticsRef = collections.analytics.doc(ANALYTICS_DOC_ID);
    const orderTotal = getSafeNumber(order.totalAmount);
    const isPaid = order.paymentStatus === 'paid';

    const statusFieldMap: Record<string, string> = {
        placed: 'placedCount',
        processing: 'processingCount',
        shipped: 'shippedCount',
        delivered: 'deliveredCount',
        cancelled: 'cancelledCount',
    };

    const prevField = statusFieldMap[previousStatus];
    const newField = statusFieldMap[newStatus];

    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(analyticsRef);
            if (!doc.exists) return;

            const updatePayload: any = {
                lastUpdated: new Date(),
            };

            if (prevField) {
                updatePayload[prevField] = admin.firestore.FieldValue.increment(-1);
            }
            if (newField) {
                updatePayload[newField] = admin.firestore.FieldValue.increment(1);
            }

            // If order cancelled
            if (newStatus === 'cancelled') {
                if (isPaid) {
                    updatePayload.totalRevenue = admin.firestore.FieldValue.increment(-orderTotal);
                    updatePayload.totalOrders = admin.firestore.FieldValue.increment(-1);
                } else {
                    updatePayload.unpaidAmount = admin.firestore.FieldValue.increment(-orderTotal);
                }
            }

            transaction.update(analyticsRef, updatePayload);
        });
    } catch (err) {
        logger.error(`Failed to update order status transition (${previousStatus} -> ${newStatus}) in analytics:`, err);
    }
};

/**
 * CRITICAL: Update analytics cache incrementally on payment confirmation
 */
export const updateAnalyticsCache = async (order: WholesaleOrder): Promise<void> => {
    const wOrder = order;
    if (wOrder.paymentStatus !== 'paid') return;

    const analyticsRef = collections.analytics.doc(ANALYTICS_DOC_ID);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const docCheck = await analyticsRef.get();
    if (!docCheck.exists) {
        await rebuildAnalyticsCache();
        return;
    }

    try {
        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(analyticsRef);
            if (!doc.exists) {
                throw new Error('Analytics document missing');
            }

            const cached = doc.data() as DashboardAnalytics;
            const actualDate = parseDate(wOrder.createdAt) || now;

            const isToday = actualDate >= today;
            const isThisMonth = actualDate >= thisMonth;
            const isThisYear = actualDate >= thisYear;

            const orderTotal = getSafeNumber(wOrder.totalAmount);
            const newTotalRevenue = getSafeNumber(cached.totalRevenue) + orderTotal;
            const newTotalOrders = getSafeNumber(cached.totalOrders) + 1;
            const newUnpaidAmount = Math.max(0, getSafeNumber(cached.unpaidAmount) - orderTotal);

            // Update top products
            const productMap = new Map<string, { productId: string; productTitle: string; unitsSold: number; revenue: number }>();
            (cached.topProducts || []).forEach(p => productMap.set(p.productId, { ...p }));

            (wOrder.items || []).forEach((item: any) => {
                if (isWholesaleItem(item)) {
                    const existing = productMap.get(item.productId);
                    const units = getSafeNumber(item.bundlesOrdered);
                    const revenue = getSafeNumber(item.lineTotal);

                    if (existing) {
                        existing.unitsSold += units;
                        existing.revenue += revenue;
                    } else {
                        productMap.set(item.productId, {
                            productId: item.productId,
                            productTitle: item.productTitle || 'Unknown Bundle',
                            unitsSold: units,
                            revenue: revenue,
                        });
                    }
                }
            });

            // Update top states
            const stateMap = new Map<string, { state: string; orderCount: number; revenue: number }>();
            (cached.topStates || []).forEach(s => stateMap.set(s.state, { ...s }));

            const state = normalizeState(wOrder.address?.state);
            const existingState = stateMap.get(state);
            if (existingState) {
                existingState.orderCount++;
                existingState.revenue += orderTotal;
            } else {
                stateMap.set(state, { state, orderCount: 1, revenue: orderTotal });
            }

            transaction.update(analyticsRef, {
                totalRevenue: newTotalRevenue,
                revenueToday: isToday ? getSafeNumber(cached.revenueToday) + orderTotal : getSafeNumber(cached.revenueToday),
                revenueThisMonth: isThisMonth ? getSafeNumber(cached.revenueThisMonth) + orderTotal : getSafeNumber(cached.revenueThisMonth),
                revenueThisYear: isThisYear ? getSafeNumber(cached.revenueThisYear) + orderTotal : getSafeNumber(cached.revenueThisYear),
                totalOrders: newTotalOrders,
                ordersToday: isToday ? getSafeNumber(cached.ordersToday) + 1 : getSafeNumber(cached.ordersToday),
                ordersThisMonth: isThisMonth ? getSafeNumber(cached.ordersThisMonth) + 1 : getSafeNumber(cached.ordersThisMonth),
                averageOrderValue: newTotalOrders > 0 ? newTotalRevenue / newTotalOrders : 0,
                unpaidAmount: newUnpaidAmount,
                topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
                topStates: Array.from(stateMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
                lastUpdated: new Date(),
            });
        });
    } catch (err: any) {
        if (err.message === 'Analytics document missing') {
            await rebuildAnalyticsCache();
        } else {
            throw err;
        }
    }
};

/**
 * ADMIN TOOL: Rebuild analytics cache from scratch (data recovery)
 */
export const rebuildAnalyticsCache = async (): Promise<DashboardAnalytics> => {
    logger.info('Rebuilding analytics cache from raw database orders...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const allOrdersSnapshot = await collections.wholesaleOrders.get();

    const allOrders = allOrdersSnapshot.docs.map(d => {
        const data = d.data();
        return {
            ...data,
            id: d.id,
            totalAmount: getSafeNumber(data.totalAmount),
            createdAt: parseDate(data.createdAt),
            updatedAt: parseDate(data.updatedAt),
        };
    }) as any[];

    // Paid orders for revenue metrics (exclude cancelled)
    const paidOrders = allOrders.filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled');

    // Calculate revenue metrics safely
    const totalRevenue = paidOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueToday = paidOrders
        .filter(o => o.createdAt && o.createdAt >= today)
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueThisMonth = paidOrders
        .filter(o => o.createdAt && o.createdAt >= thisMonth)
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueThisYear = paidOrders
        .filter(o => o.createdAt && o.createdAt >= thisYear)
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = paidOrders.length;
    const ordersToday = paidOrders.filter(o => o.createdAt && o.createdAt >= today).length;
    const ordersThisMonth = paidOrders.filter(o => o.createdAt && o.createdAt >= thisMonth).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Customer Metrics:
    // 1. Registered customer accounts from users collection (exclude staff)
    const usersSnapshot = await collections.users.get();
    const customerUsers = usersSnapshot.docs.filter(d => {
        const r = d.data().role;
        return r !== 'superadmin' && r !== 'admin';
    });

    // 2. Distinct buying accounts from orders
    const orderUserIds = new Set<string>();
    const orderCountsByUser = new Map<string, number>();
    const firstOrderByUser = new Map<string, Date>();

    for (const order of allOrders) {
        if (!order.userId || order.orderStatus === 'cancelled') continue;
        orderUserIds.add(order.userId);
        orderCountsByUser.set(order.userId, (orderCountsByUser.get(order.userId) || 0) + 1);

        if (order.createdAt) {
            const existingFirst = firstOrderByUser.get(order.userId);
            if (!existingFirst || order.createdAt < existingFirst) {
                firstOrderByUser.set(order.userId, order.createdAt);
            }
        }
    }

    const allCustomerIds = new Set<string>([
        ...customerUsers.map(d => d.id),
        ...Array.from(orderUserIds)
    ]);

    const totalCustomers = allCustomerIds.size;

    // Returning customers: accounts with >= 2 active/paid orders
    const returningCustomers = Array.from(orderCountsByUser.values()).filter(count => count > 1).length;
    const returningCustomerRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // New customers today / this month based on earliest registration or first order
    let newCustomersToday = 0;
    let newCustomersThisMonth = 0;

    for (const customerId of allCustomerIds) {
        const userDoc = usersSnapshot.docs.find(d => d.id === customerId);
        const registeredAt = parseDate(userDoc?.data()?.createdAt);
        const firstOrderAt = firstOrderByUser.get(customerId);

        const earliestDate = registeredAt && firstOrderAt
            ? (registeredAt < firstOrderAt ? registeredAt : firstOrderAt)
            : (registeredAt || firstOrderAt);

        if (earliestDate) {
            if (earliestDate >= today) newCustomersToday++;
            if (earliestDate >= thisMonth) newCustomersThisMonth++;
        }
    }

    // Top products aggregation
    const productRevenue: Record<string, { title: string; units: number; revenue: number }> = {};
    paidOrders.forEach(order => {
        (order.items || []).forEach((item: any) => {
            if (isWholesaleItem(item)) {
                const pId = item.productId || 'unknown';
                if (!productRevenue[pId]) {
                    productRevenue[pId] = {
                        title: item.productTitle || 'Unknown Bundle',
                        units: 0,
                        revenue: 0,
                    };
                }
                productRevenue[pId].units += getSafeNumber(item.bundlesOrdered);
                productRevenue[pId].revenue += getSafeNumber(item.lineTotal);
            }
        });
    });

    const topProducts = Object.entries(productRevenue)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([productId, data]) => ({
            productId,
            productTitle: data.title,
            unitsSold: data.units,
            revenue: data.revenue,
        }));

    // Top states aggregation (with state name normalization)
    const stateRevenue: Record<string, { orderCount: number; revenue: number }> = {};
    paidOrders.forEach(order => {
        const state = normalizeState(order.address?.state);
        if (!stateRevenue[state]) {
            stateRevenue[state] = { orderCount: 0, revenue: 0 };
        }
        stateRevenue[state].orderCount++;
        stateRevenue[state].revenue += order.totalAmount;
    });

    const topStates = Object.entries(stateRevenue)
        .sort(([, a], [, b]) => b.revenue - a.revenue)
        .slice(0, 10)
        .map(([state, data]) => ({
            state,
            orderCount: data.orderCount,
            revenue: data.revenue,
        }));

    // Revenue trend (last 30 days)
    const revenueTrend: Array<{ date: Date; revenue: number; orders: number }> = [];
    for (let i = 29; i >= 0; i--) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
        const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

        const dayOrders = paidOrders.filter(o => o.createdAt && o.createdAt >= dayStart && o.createdAt < dayEnd);

        revenueTrend.push({
            date: dayStart,
            revenue: dayOrders.reduce((sum, o) => sum + o.totalAmount, 0),
            orders: dayOrders.length,
        });
    }

    const analytics: DashboardAnalytics = {
        totalRevenue,
        revenueToday,
        revenueThisMonth,
        revenueThisYear,
        totalOrders,
        ordersToday,
        ordersThisMonth,
        averageOrderValue,
        totalCustomers,
        newCustomersToday,
        newCustomersThisMonth,
        returningCustomerRate,
        topProducts,
        topStates,
        revenueTrend,
        // Fulfillment Metrics
        placedCount: allOrders.filter(o => o.orderStatus === 'placed').length,
        processingCount: allOrders.filter(o => o.orderStatus === 'processing').length,
        shippedCount: allOrders.filter(o => o.orderStatus === 'shipped').length,
        deliveredCount: allOrders.filter(o => o.orderStatus === 'delivered').length,
        cancelledCount: allOrders.filter(o => o.orderStatus === 'cancelled').length,
        unpaidAmount: allOrders
            .filter(o => o.paymentStatus === 'pending' && o.orderStatus !== 'cancelled')
            .reduce((sum, o) => sum + o.totalAmount, 0),
    };

    await collections.analytics.doc(ANALYTICS_DOC_ID).set(analytics);
    logger.info(`Analytics cache rebuilt successfully. Total revenue: ₹${totalRevenue}, Total orders: ${totalOrders}, Total customers: ${totalCustomers}`);

    return analytics;
};
