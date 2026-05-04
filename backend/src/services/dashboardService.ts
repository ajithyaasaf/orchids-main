import { collections, db } from '../config/firebase';
import type { DashboardAnalytics, WholesaleOrder, WholesaleBundleItem } from '@orchids/shared';
import logger from '../utils/logger';

const ANALYTICS_DOC_ID = 'wholesale_dashboard_cache';

// Type Guard for Wholesale Items
const isWholesaleItem = (item: any): item is WholesaleBundleItem => {
    return item.bundlesOrdered !== undefined;
};

/**
 * Get comprehensive dashboard analytics (CACHED VERSION - 1 read instead of 10,000+)
 * 
 * Performance: Loads from single cached document, only refreshes customer counts
 */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
    const cacheDoc = await collections.analytics.doc(ANALYTICS_DOC_ID).get();

    if (!cacheDoc.exists || (cacheDoc.data() as any).placedCount === undefined) {
        if (logger) logger.info('Analytics cache incomplete or missing, rebuilding...');
        else console.log('Analytics cache incomplete or missing, rebuilding...');
        return await rebuildAnalyticsCache();
    }

    const cached = cacheDoc.data() as DashboardAnalytics;

    // Get fresh customer metrics using optimized aggregation
    const usersSnapshot = await collections.users.where('role', '==', 'customer').count().get();
    const totalCustomers = usersSnapshot.data().count;

    return {
        ...cached,
        totalCustomers,
    };
};

/**
 * CRITICAL: Update analytics cache incrementally on each order
 * Called after order creation or payment verification
 * 
 * Performance: Single transactional update instead of re-aggregating all orders
 */
export const updateAnalyticsCache = async (order: WholesaleOrder): Promise<void> => {
    const wOrder = order;

    if (wOrder.paymentStatus !== 'paid') return;

    const analyticsRef = collections.analytics.doc(ANALYTICS_DOC_ID);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(analyticsRef);

        if (!doc.exists) {
            await rebuildAnalyticsCache();
            return;
        }

        const cached = doc.data() as DashboardAnalytics;

        const orderDate: any = wOrder.createdAt;
        const actualDate = typeof orderDate.toDate === 'function' ? orderDate.toDate() : new Date(orderDate);

        const isToday = actualDate >= today;
        const isThisMonth = actualDate >= thisMonth;
        const isThisYear = actualDate >= thisYear;

        const newTotalRevenue = cached.totalRevenue + wOrder.totalAmount;
        const newTotalOrders = cached.totalOrders + 1;

        // Update top products
        const productMap = new Map<string, { productId: string; productTitle: string; unitsSold: number; revenue: number }>();
        cached.topProducts.forEach(p => productMap.set(p.productId, { ...p }));

        wOrder.items.forEach((item: any) => {
            if (isWholesaleItem(item)) {
                const existing = productMap.get(item.productId);
                const units = item.bundlesOrdered || 0;
                const revenue = item.lineTotal || 0;

                if (existing) {
                    existing.unitsSold += units;
                    existing.revenue += revenue;
                } else {
                    productMap.set(item.productId, {
                        productId: item.productId,
                        productTitle: item.productTitle || 'Unknown',
                        unitsSold: units,
                        revenue: revenue,
                    });
                }
            }
        });

        // Update top states
        const stateMap = new Map<string, { state: string; orderCount: number; revenue: number }>();
        cached.topStates.forEach(s => stateMap.set(s.state, { ...s }));

        const state = wOrder.address.state;
        const existingState = stateMap.get(state);
        if (existingState) {
            existingState.orderCount++;
            existingState.revenue += wOrder.totalAmount;
        } else {
            stateMap.set(state, { state, orderCount: 1, revenue: wOrder.totalAmount });
        }

        transaction.update(analyticsRef, {
            totalRevenue: newTotalRevenue,
            revenueToday: isToday ? cached.revenueToday + wOrder.totalAmount : cached.revenueToday,
            revenueThisMonth: isThisMonth ? cached.revenueThisMonth + wOrder.totalAmount : cached.revenueThisMonth,
            revenueThisYear: isThisYear ? cached.revenueThisYear + wOrder.totalAmount : cached.revenueThisYear,
            totalOrders: newTotalOrders,
            ordersToday: isToday ? cached.ordersToday + 1 : cached.ordersToday,
            ordersThisMonth: isThisMonth ? cached.ordersThisMonth + 1 : cached.ordersThisMonth,
            averageOrderValue: newTotalRevenue / newTotalOrders,
            topProducts: Array.from(productMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
            topStates: Array.from(stateMap.values()).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
            lastUpdated: new Date(),
        });
    });
};

/**
 * ADMIN TOOL: Rebuild analytics cache from scratch (data recovery)
 * WARNING: Expensive - reads ALL orders. Use only for:
 * - Initial setup
 * - Data recovery after manual fixes
 * - Resync after data migration
 */
export const rebuildAnalyticsCache = async (): Promise<DashboardAnalytics> => {
    console.log('Rebuilding analytics cache from scratch...');

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    const allOrdersSnapshot = await collections.wholesaleOrders.get();
    
    const allOrders = allOrdersSnapshot.docs.map(d => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
    })) as any[];

    // Paid orders for revenue metrics
    const orders = allOrders.filter(o => o.paymentStatus === 'paid' && o.orderStatus !== 'cancelled');

    console.log(`Processing ${allOrders.length} total wholesale orders (${orders.length} paid)...`);

    // Calculate metrics
    const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueToday = orders
        .filter(o => o.createdAt >= today)
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueThisMonth = orders
        .filter(o => o.createdAt >= thisMonth)
        .reduce((sum, o) => sum + o.totalAmount, 0);
    const revenueThisYear = orders
        .filter(o => o.createdAt >= thisYear)
        .reduce((sum, o) => sum + o.totalAmount, 0);

    const totalOrders = orders.length;
    const ordersToday = orders.filter(o => o.createdAt >= today).length;
    const ordersThisMonth = orders.filter(o => o.createdAt >= thisMonth).length;
    const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Customer metrics
    const usersSnapshot = await collections.users.where('role', '==', 'customer').get();
    const totalCustomers = usersSnapshot.size;
    const newCustomersToday = usersSnapshot.docs.filter(d => d.data().createdAt?.toDate() >= today).length;
    const newCustomersThisMonth = usersSnapshot.docs.filter(d => d.data().createdAt?.toDate() >= thisMonth).length;

    const returningCustomers = usersSnapshot.docs.filter(d => (d.data().totalOrders || 0) > 1).length;
    const returningCustomerRate = totalCustomers > 0 ? (returningCustomers / totalCustomers) * 100 : 0;

    // Top products
    const productRevenue: Record<string, { title: string; units: number; revenue: number }> = {};
    orders.forEach(order => {
        order.items.forEach((item: any) => {
            if (isWholesaleItem(item)) {
                if (!productRevenue[item.productId]) {
                    productRevenue[item.productId] = {
                        title: item.productTitle || 'Unknown Bundle',
                        units: 0,
                        revenue: 0,
                    };
                }
                productRevenue[item.productId].units += (item.bundlesOrdered || 0);
                productRevenue[item.productId].revenue += (item.lineTotal || 0);
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

    // Top states
    const stateRevenue: Record<string, { orderCount: number; revenue: number }> = {};
    orders.forEach(order => {
        const state = order.address.state;
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

        const dayOrders = orders.filter(o => o.createdAt >= dayStart && o.createdAt < dayEnd);

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
        unpaidAmount: allOrders.filter(o => o.paymentStatus !== 'paid' && o.orderStatus !== 'cancelled').reduce((sum, o) => sum + (o.totalAmount || 0), 0),
    };

    await collections.analytics.doc(ANALYTICS_DOC_ID).set(analytics);
    console.log(`Analytics cache rebuilt successfully. Total revenue: ₹${totalRevenue}, Total orders: ${totalOrders}`);

    return analytics;
};
