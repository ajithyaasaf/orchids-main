import { collections, db } from '../config/firebase';
import type {
    CustomerInsight,
    CustomerMetadata,
    CustomerFilters,
    WholesaleOrder,
    User
} from '@orchids/shared';

// Helper to safely convert Firestore Timestamp, string, or Date to Date
const parseDate = (d: any): Date | undefined => {
    if (!d) return undefined;
    if (d instanceof Date) return d;
    if (typeof d.toDate === 'function') return d.toDate();
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? undefined : parsed;
};

/**
 * CRITICAL: Update customer cache when order is created
 * Must be called atomically with order creation
 * 
 * Supports both online payments and COD:
 * - Online: Count when paymentStatus === 'paid'
 * - COD: Count when paymentStatus === 'pending' && orderStatus === 'delivered'
 */
export const updateCustomerCacheOnOrder = async (order: WholesaleOrder): Promise<void> => {
    // For wholesale: count immediately when payment is 'paid'
    if (order.paymentStatus !== 'paid') return;

    const userRef = collections.users.doc(order.userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) {
            // User doc may not exist for some wholesale users — skip gracefully
            return;
        }

        const user = userDoc.data() as User;
        const newTotalOrders = (user.totalOrders || 0) + 1;
        const newTotalSpent = (user.totalSpent || 0) + order.totalAmount;
        const newAOV = newTotalSpent / newTotalOrders;
        const orderDate = parseDate(order.createdAt) || new Date();
        const firstOrderDate = parseDate(user.firstOrderDate) || orderDate;

        const segment = determineSegment({
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
            lastOrderDate: orderDate,
            firstOrderDate,
        });

        transaction.update(userRef, {
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
            averageOrderValue: newAOV,
            lastOrderDate: orderDate,
            firstOrderDate,
            segment,
            segmentUpdatedAt: new Date(),
        });
    });
};

/**
 * CRITICAL: Update customer cache when order is cancelled
 * Must be called when order status changes to 'cancelled'
 */
export const updateCustomerCacheOnCancellation = async (order: WholesaleOrder): Promise<void> => {
    if (order.paymentStatus !== 'paid') return; // Only adjust if it was counted

    const userRef = collections.users.doc(order.userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return; // Skip gracefully

        const user = userDoc.data() as User;
        const newTotalOrders = Math.max(0, (user.totalOrders || 1) - 1);
        const newTotalSpent = Math.max(0, (user.totalSpent || 0) - order.totalAmount);
        const newAOV = newTotalOrders > 0 ? newTotalSpent / newTotalOrders : 0;

        const segment = determineSegment({
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
            lastOrderDate: user.lastOrderDate,
            firstOrderDate: user.firstOrderDate,
        });

        transaction.update(userRef, {
            totalOrders: newTotalOrders,
            totalSpent: newTotalSpent,
            averageOrderValue: newAOV,
            segment,
            segmentUpdatedAt: new Date(),
        });
    });
};

/**
 * CRITICAL: Update customer cache when refund is processed
 * Must be called when refund is issued (partial or full)
 */
export const updateCustomerCacheOnRefund = async (
    order: WholesaleOrder,
    refundAmount: number
): Promise<void> => {
    const userRef = collections.users.doc(order.userId);

    await db.runTransaction(async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists) return; // Skip gracefully

        const user = userDoc.data() as User;
        const newTotalSpent = Math.max(0, (user.totalSpent || 0) - refundAmount);
        const totalOrders = user.totalOrders || 0;
        const newAOV = totalOrders > 0 ? newTotalSpent / totalOrders : 0;

        // Recalculate segment after refund
        const segment = determineSegment({
            totalOrders,
            totalSpent: newTotalSpent,
            lastOrderDate: user.lastOrderDate,
            firstOrderDate: user.firstOrderDate,
        });

        transaction.update(userRef, {
            totalSpent: newTotalSpent,
            averageOrderValue: newAOV,
            segment,
            segmentUpdatedAt: new Date(),
        });
    });
};

/**
 * Determine customer segment (cached in user doc)
 * 
 * Segmentation rules:
 * - new: First order within 30 days
 * - vip: ₹5000+ total spent OR 5+ orders
 * - inactive: No order in 180+ days
 * - at-risk: No order in 90-180 days
 * - returning: Active with multiple orders
 */
const determineSegment = (data: {
    totalOrders: number;
    totalSpent: number;
    lastOrderDate?: any;
    firstOrderDate?: any;
}): 'new' | 'returning' | 'vip' | 'at-risk' | 'inactive' => {
    const { totalOrders, totalSpent } = data;
    const lastOrderDate = parseDate(data.lastOrderDate);
    const firstOrderDate = parseDate(data.firstOrderDate);

    if (totalOrders === 0) return 'inactive';

    const daysSinceLastOrder = lastOrderDate
        ? Math.floor((Date.now() - lastOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

    const customerLifetime = firstOrderDate
        ? Math.floor((Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

    // VIP: High value or frequent buyer
    if (totalSpent >= 5000 || totalOrders >= 5) return 'vip';

    // Inactive: No order in 180+ days
    if (daysSinceLastOrder > 180) return 'inactive';

    // At-risk: No order in 90-180 days
    if (daysSinceLastOrder > 90) return 'at-risk';

    // New: First order within 30 days
    if (totalOrders === 1 && customerLifetime <= 30) return 'new';

    // Returning: Active with multiple orders
    return 'returning';
};

/**
 * Get customer with cached metadata and order history
 */
export const getCustomerInsight = async (userId: string): Promise<CustomerInsight | null> => {
    const userDoc = await collections.users.doc(userId).get();
    if (!userDoc.exists) return null;

    const user = userDoc.data() as User;

    // Fetch wholesale order history (correct collection)
    const ordersSnapshot = await collections.wholesaleOrders
        .where('userId', '==', userId)
        .orderBy('createdAt', 'desc')
        .get();

    const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() ?? new Date(doc.data().createdAt),
        updatedAt: doc.data().updatedAt?.toDate?.() ?? new Date(doc.data().updatedAt),
    })) as WholesaleOrder[];

    const firstOrderDate = parseDate(user.firstOrderDate) || new Date();

    return {
        ...user,
        metadata: {
            totalOrders: user.totalOrders || 0,
            totalSpent: user.totalSpent || 0,
            averageOrderValue: user.averageOrderValue || 0,
            firstOrderDate,
            lastOrderDate: user.lastOrderDate,
            lifetime: user.firstOrderDate
                ? Math.floor((Date.now() - firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0,
            favoriteCategory: calculateFavoriteCategory(orders),
            favoriteProducts: calculateFavoriteProducts(orders),
        },
        orderHistory: orders,
        segment: user.segment || 'inactive',
    };
};

/**
 * Calculate favorite category from order history
 * Returns undefined for now - would need product data lookup
 */
const calculateFavoriteCategory = (orders: WholesaleOrder[]): string | undefined => {
    return undefined; // Category aggregation not applicable for bundle-based wholesale
};

/**
 * Calculate top 3 most-ordered products from wholesale order history
 * Uses bundlesOrdered (not quantity) as the wholesale unit
 */
const calculateFavoriteProducts = (orders: WholesaleOrder[]): string[] => {
    const productCounts: Record<string, number> = {};

    orders.forEach(order => {
        order.items.forEach(item => {
            productCounts[item.productId] = (productCounts[item.productId] || 0) + item.bundlesOrdered;
        });
    });

    return Object.entries(productCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 3)
        .map(([productId]) => productId);
};

/**
 * Get all customers with cached metadata (OPTIMIZED with cursor pagination)
 * Uses cursor-based pagination (NOT offset) for better performance at scale
 */
export const getAllCustomersWithInsights = async (
    filters?: CustomerFilters,
    limit = 20,
    lastDocId?: string
): Promise<{ customers: CustomerInsight[]; total: number; lastDocId?: string }> => {
    // Query all users who have placed wholesale orders (role = 'customer' or have totalOrders cached)
    let query = collections.users.where('role', '==', 'customer');

    // Apply filters using cached fields (fast!)
    if (filters?.segment) {
        query = query.where('segment', '==', filters.segment);
    }
    if (filters?.minSpent) {
        query = query.where('totalSpent', '>=', filters.minSpent);
    }

    // Get total count using optimized aggregation
    const totalSnapshot = await query.count().get();
    const total = totalSnapshot.data().count;

    // CURSOR PAGINATION (not offset - more efficient)
    if (lastDocId) {
        const lastDoc = await collections.users.doc(lastDocId).get();
        if (lastDoc.exists) {
            query = query.startAfter(lastDoc);
        }
    }

    const snapshot = await query.limit(limit).get();

    const customers = snapshot.docs.map(doc => {
        const user = doc.data() as User;
        return {
            ...user,
            metadata: {
                totalOrders: user.totalOrders || 0,
                totalSpent: user.totalSpent || 0,
                averageOrderValue: user.averageOrderValue || 0,
                firstOrderDate: user.firstOrderDate || new Date(),
                lastOrderDate: user.lastOrderDate,
                lifetime: user.firstOrderDate
                    ? Math.floor((Date.now() - user.firstOrderDate.getTime()) / (1000 * 60 * 60 * 24))
                    : 0,
                favoriteCategory: undefined,
                favoriteProducts: [],
            },
            orderHistory: [], // Don't load orders for list view (performance)
            segment: user.segment || 'inactive',
        };
    });

    const newLastDocId = snapshot.docs.length > 0
        ? snapshot.docs[snapshot.docs.length - 1].id
        : undefined;

    return { customers, total, lastDocId: newLastDocId };
};

/**
 * ADMIN TOOL: Recalculate all customer metrics (data integrity recovery)
 * WARNING: Expensive operation - use only for data recovery after manual fixes
 */
export const recalculateAllCustomerMetrics = async (): Promise<{ processed: number; errors: number }> => {
    const usersSnapshot = await collections.users.where('role', '==', 'customer').get();
    let processed = 0;
    let errors = 0;

    for (const userDoc of usersSnapshot.docs) {
        try {
            const userId = userDoc.id;

            // Source of truth: wholesaleOrders collection (paid + not cancelled)
            const ordersSnapshot = await collections.wholesaleOrders
                .where('userId', '==', userId)
                .where('paymentStatus', '==', 'paid')
                .get();

            const orders = ordersSnapshot.docs
                .map(d => ({
                    ...d.data(),
                    id: d.id,
                    createdAt: d.data().createdAt?.toDate?.() ?? new Date(d.data().createdAt),
                }) as any)
                .filter(o => o.orderStatus !== 'cancelled') as WholesaleOrder[];

            const totalOrders = orders.length;
            const totalSpent = orders.reduce((sum, o) => sum + o.totalAmount, 0);
            const averageOrderValue = totalOrders > 0 ? totalSpent / totalOrders : 0;

            const sorted = [...orders].sort(
                (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
            const firstOrderDate = sorted.length > 0 ? sorted[0].createdAt : undefined;
            const lastOrderDate = sorted.length > 0 ? sorted[sorted.length - 1].createdAt : undefined;

            const segment = determineSegment({
                totalOrders,
                totalSpent,
                lastOrderDate: lastOrderDate instanceof Date ? lastOrderDate : undefined,
                firstOrderDate: firstOrderDate instanceof Date ? firstOrderDate : undefined,
            });

            await collections.users.doc(userId).update({
                totalOrders,
                totalSpent,
                averageOrderValue,
                firstOrderDate,
                lastOrderDate,
                segment,
                segmentUpdatedAt: new Date(),
            });

            processed++;
        } catch (error) {
            console.error(`Failed to recalculate metrics for user ${userDoc.id}:`, error);
            errors++;
        }
    }

    return { processed, errors };
};

/**
 * Export customer data as CSV (STREAMED in batches to limit Firestore reads)
 */
export const exportCustomersToCSV = async (filters?: CustomerFilters): Promise<string> => {
    const BATCH_SIZE = 100;
    let allCustomers: User[] = [];
    let lastDoc: any = null;

    while (true) {
        let query = collections.users.where('role', '==', 'customer').limit(BATCH_SIZE);
        if (lastDoc) query = query.startAfter(lastDoc);

        const snapshot = await query.get();
        if (snapshot.empty) break;

        allCustomers.push(...snapshot.docs.map(d => d.data() as User));
        lastDoc = snapshot.docs[snapshot.docs.length - 1];
        if (snapshot.docs.length < BATCH_SIZE) break;
    }

    // Apply in-memory filters
    let filtered = allCustomers;
    if (filters?.segment) {
        filtered = filtered.filter(u => u.segment === filters.segment);
    }
    if (filters?.search) {
        const searchLower = filters.search.toLowerCase();
        filtered = filtered.filter(u =>
            u.name.toLowerCase().includes(searchLower) ||
            u.email.toLowerCase().includes(searchLower)
        );
    }

    // Safe date formatter
    const fmtDate = (d: any) => {
        if (!d) return '';
        const dt = d instanceof Date ? d : d.toDate ? d.toDate() : new Date(d);
        return dt.toISOString();
    };

    const headers = 'Email,Name,Phone,Total Orders,Total Spent (₹),Segment,Last Order,First Order\n';
    const rows = filtered.map(u =>
        `${u.email},"${u.name}",${u.phone || ''},${u.totalOrders || 0},${u.totalSpent || 0},${u.segment || 'inactive'},${fmtDate(u.lastOrderDate)},${fmtDate(u.firstOrderDate)}`
    ).join('\n');

    return headers + rows;
};
