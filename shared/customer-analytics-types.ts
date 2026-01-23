import type { User, Order } from './types';

// Customer Analytics Types
export interface CustomerMetadata {
    totalOrders: number;
    totalSpent: number;
    averageOrderValue: number;
    firstOrderDate: Date;
    lastOrderDate?: Date;
    lifetime: number; // Days since first order
    favoriteCategory?: string;
    favoriteProducts: string[]; // Product IDs
}

export interface CustomerInsight extends User {
    metadata: CustomerMetadata;
    orderHistory: Order[];
    segment: 'new' | 'returning' | 'vip' | 'at-risk' | 'inactive';
}

// Dashboard Analytics Types
export interface DashboardAnalytics {
    // Revenue Metrics
    totalRevenue: number;
    revenueToday: number;
    revenueThisMonth: number;
    revenueThisYear: number;

    // Order Metrics
    totalOrders: number;
    ordersToday: number;
    ordersThisMonth: number;
    averageOrderValue: number;

    // Customer Metrics
    totalCustomers: number;
    newCustomersToday: number;
    newCustomersThisMonth: number;
    returningCustomerRate: number;

    // Product Metrics
    topProducts: Array<{
        productId: string;
        productTitle: string;
        unitsSold: number;
        revenue: number;
    }>;

    // Geographic Distribution
    topStates: Array<{
        state: string;
        orderCount: number;
        revenue: number;
    }>;

    // Trend Data (last 30 days)
    revenueTrend: Array<{
        date: Date;
        revenue: number;
        orders: number;
    }>;
}

export interface CustomerFilters {
    segment?: 'new' | 'returning' | 'vip' | 'at-risk' | 'inactive';
    state?: string;
    minSpent?: number;
    maxSpent?: number;
    minOrders?: number;
    search?: string; // Name or email
}
