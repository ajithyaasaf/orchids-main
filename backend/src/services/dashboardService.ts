import { collections, db } from '../config/firebase';
import type { DashboardAnalytics, Order } from '@tntrends/shared';

const ANALYTICS_DOC_ID = 'dashboard_cache';

/**
 * Get comprehensive dashboard analytics (CACHED VERSION - 1 read instead of 10,000+)
 * 
 * Performance: Loads from single cached document, only refreshes customer counts
 */
export const getDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
    const cacheDoc = await collections.analytics.doc(ANALYTICS_DOC_ID).get();

    if (!cacheDoc.exists) {
        // First time - initialize cache from orders
        console.log('Analytics cache not found, rebuilding...');
        return await rebuildAnalyticsCache();
    }

    const cached = cacheDoc.data() as DashboardAnalytics;

    // Get fresh customer metrics (lightweight - just counts)
    const usersSnapshot = await collections.users.where('role', '==', 'customer').get();
    const totalCustomers = usersSnapshot.size;
    const returningCustomers = usersSnapshot.docs.filter(
        d => (d.data().totalOrders || 0) > 1
    ).length;

    return {
        ...cached,
        totalCustomers,
        returningCustomerRate: totalCustomers > 0
            ? (returningCustomers / totalCustomers) * 100
            : 0,
    };
};

/**
 * CRITICAL: Update analytics cache incrementally on each order
 * Called after order creation or payment verification
 * 
 * Performance: Single transactional update instead of re-aggregating all orders
 */
export const updateAnalyticsCache = async (order: Order): Promise<void> => {
    if (order.paymentStatus !== 'paid') return; // Only count paid orders

    const analyticsRef = collections.analytics.doc(ANALYTICS_DOC_ID);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisYear = new Date(now.getFullYear(), 0, 1);

    await db.runTransaction(async (transaction) => {
        const doc = await transaction.get(analyticsRef);

        if (!doc.exists) {
            // Initialize cache if doesn't exist
            console.log('Analytics cache not found during update, rebuilding...');
            await rebuildAnalyticsCache();
            return;
        }

        const cached = doc.data() as DashboardAnalytics;

        // Determine if order is today/month/year
        const isToday = order.createdAt >= today;
        const isThisMonth = order.createdAt >= thisMonth;
        const isThisYear = order.createdAt >= thisYear;

        // Update totals
        const newTotalRevenue = cached.totalRevenue + order.totalAmount;
        const newTotalOrders = cached.totalOrders + 1;

        // Update top products
        const productMap = new Map<string, { productId: string; productTitle: string; unitsSold: number; revenue: number }>();

        // Load existing top products into map
        cached.topProducts.forEach(p => {
            productMap.set(p.productId, { ...p });
        });

        // Update with new order items
        order.items.forEach(item => {
            const existing = productMap.get(item.productId);
            if (existing) {
                existing.unitsSold += item.quantity;
                existing.revenue += item.price * item.quantity;
            } else {
                productMap.set(item.productId, {
                    productId: item.productId,
                    productTitle: item.productTitle || 'Unknown',
                    unitsSold: item.quantity,
                    revenue: item.price * item.quantity,
                });
            }
        });

        // Update top states
        const stateMap = new Map<string, { state: string; orderCount: number; revenue: number }>();

        // Load existing top states into map
        cached.topStates.forEach(s => {
            stateMap.set(s.state, { ...s });
        });

        // Update with new order
        const state = order.address.state;
        const existingState = stateMap.get(state);
        if (existingState) {
            existingState.orderCount++;
            existingState.revenue += order.totalAmount;
        } else {
            stateMap.set(state, {
                state,
                orderCount: 1,
                revenue: order.totalAmount,
            });
        }

        // Update transaction
        transaction.update(analyticsRef, {
            totalRevenue: newTotalRevenue,
            revenueToday: isToday ? cached.revenueToday + order.totalAmount : cached.revenueToday,
            revenueThisMonth: isThisMonth ? cached.revenueThisMonth + order.totalAmount : cached.revenueThisMonth,
            revenueThisYear: isThisYear ? cached.revenueThisYear + order.totalAmount : cached.revenueThisYear,
            totalOrders: newTotalOrders,
            ordersToday: isToday ? cached.ordersToday + 1 : cached.ordersToday,
            ordersThisMonth: isThisMonth ? cached.ordersThisMonth + 1 : cached.ordersThisMonth,
            averageOrderValue: newTotalRevenue / newTotalOrders,
            topProducts: Array.from(productMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10),
            topStates: Array.from(stateMap.values())
                .sort((a, b) => b.revenue - a.revenue)
                .slice(0, 10),
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

    // Fetch all paid orders (expensive - only for rebuild)
    const ordersSnapshot = await collections.orders
        .where('paymentStatus', '==', 'paid')
        .where('orderStatus', '!=', 'cancelled')
        .get();

    const orders = ordersSnapshot.docs.map(d => ({
        ...d.data(),
        createdAt: d.data().createdAt?.toDate(),
        updatedAt: d.data().updatedAt?.toDate(),
    })) as Order[];

    console.log(`Processing ${orders.length} orders...`);

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
    const newCustomersToday = usersSnapshot.docs.filter(
        d => d.data().createdAt?.toDate() >= today
    ).length;
    const newCustomersThisMonth = usersSnapshot.docs.filter(
        d => d.data().createdAt?.toDate() >= thisMonth
    ).length;
    const returningCustomers = usersSnapshot.docs.filter(
        d => (d.data().totalOrders || 0) > 1
    ).length;
    const returningCustomerRate = totalCustomers > 0
        ? (returningCustomers / totalCustomers) * 100
        : 0;

    // Top products
    const productRevenue: Record<string, { title: string; units: number; revenue: number }> = {};
    orders.forEach(order => {
        order.items.forEach(item => {
            if (!productRevenue[item.productId]) {
                productRevenue[item.productId] = {
                    title: item.productTitle || 'Unknown Product',
                    units: 0,
                    revenue: 0,
                };
            }
            productRevenue[item.productId].units += item.quantity;
            productRevenue[item.productId].revenue += item.price * item.quantity;
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

        const dayOrders = orders.filter(
            o => o.createdAt >= dayStart && o.createdAt < dayEnd
        );

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
    };

    // Save to cache
    await collections.analytics.doc(ANALYTICS_DOC_ID).set(analytics);

    console.log(`Analytics cache rebuilt successfully. Total revenue: ₹${totalRevenue}, Total orders: ${totalOrders}`);

    return analytics;
};
