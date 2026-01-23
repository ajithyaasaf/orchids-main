import { collections } from '../config/firebase';
import { Coupon, AppliedCoupon } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';
import admin from 'firebase-admin';

/**
 * Coupon Service
 * 
 * Handles coupon code CRUD operations and validation logic
 * for the code-only discount system (no auto-discounts)
 */

/**
 * Create a new coupon code
 * @throws AppError if code already exists
 */
export const createCoupon = async (
    couponData: Omit<Coupon, 'id' | 'createdAt' | 'usedCount' | 'usedBy'>
): Promise<Coupon> => {
    try {
        // Normalize code to uppercase
        const normalizedCode = couponData.code.toUpperCase().trim();

        // Check if code already exists
        const existing = await collections.coupons
            .where('code', '==', normalizedCode)
            .limit(1)
            .get();

        if (!existing.empty) {
            throw new AppError('Coupon code already exists', 400);
        }

        // Validate value is positive
        if (couponData.value <= 0) {
            throw new AppError('Coupon value must be greater than 0', 400);
        }

        // Validate dates
        if (couponData.validFrom >= couponData.validUntil) {
            throw new AppError('Valid until date must be after valid from date', 400);
        }

        const newCoupon = {
            ...couponData,
            code: normalizedCode,
            usedCount: 0,
            usedBy: [],
            createdAt: new Date(),
        };

        const docRef = await collections.coupons.add(newCoupon);
        return { id: docRef.id, ...newCoupon };
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error creating coupon:', error);
        throw new AppError('Failed to create coupon', 500);
    }
};

/**
 * Validate coupon code and calculate discount
 * 
 * Performs all validation checks:
 * - Code exists
 * - Is active
 * - Within validity period
 * - Usage limits not exceeded
 * - User hasn't already used it (if perUserLimit reached)
 * - Minimum order requirement met
 * - Applies to user's order type (firstOrder check)
 * 
 * @returns Object with validation status and discount amount
 */
export const validateCoupon = async (
    code: string,
    userId: string,
    cartValue: number,
    userOrderCount: number = 0
): Promise<{
    valid: boolean;
    coupon?: Coupon;
    discount: number;
    reason?: string;
}> => {
    try {
        const normalizedCode = code.toUpperCase().trim();

        // Find coupon by code
        const snapshot = await collections.coupons
            .where('code', '==', normalizedCode)
            .limit(1)
            .get();

        if (snapshot.empty) {
            return { valid: false, discount: 0, reason: 'Invalid coupon code' };
        }

        const couponDoc = snapshot.docs[0];
        const coupon = { id: couponDoc.id, ...couponDoc.data() } as Coupon;

        // Check if active
        if (!coupon.active) {
            return { valid: false, discount: 0, reason: 'This coupon is no longer active' };
        }

        // Check validity period
        const now = new Date();
        const validFrom = coupon.validFrom instanceof admin.firestore.Timestamp
            ? coupon.validFrom.toDate()
            : new Date(coupon.validFrom);
        const validUntil = coupon.validUntil instanceof admin.firestore.Timestamp
            ? coupon.validUntil.toDate()
            : new Date(coupon.validUntil);

        if (now < validFrom) {
            return { valid: false, discount: 0, reason: 'This coupon is not yet valid' };
        }

        if (now > validUntil) {
            return { valid: false, discount: 0, reason: 'This coupon has expired' };
        }

        // Check total usage limit
        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return { valid: false, discount: 0, reason: 'Coupon usage limit reached' };
        }

        // Check per-user limit
        const userUsageCount = coupon.usedBy.filter(id => id === userId).length;
        if (userUsageCount >= coupon.perUserLimit) {
            return {
                valid: false,
                discount: 0,
                reason: coupon.perUserLimit === 1
                    ? 'You have already used this coupon'
                    : `You can only use this coupon ${coupon.perUserLimit} times`
            };
        }

        // Check first-order restriction
        if (coupon.appliesTo === 'firstOrder' && userOrderCount > 0) {
            return {
                valid: false,
                discount: 0,
                reason: 'This coupon is only valid for first-time customers'
            };
        }

        // Check minimum order requirement
        if (coupon.minOrder && cartValue < coupon.minOrder) {
            return {
                valid: false,
                discount: 0,
                reason: `Minimum order value of ₹${coupon.minOrder} required`
            };
        }

        // Calculate discount
        let discount = 0;

        if (coupon.type === 'flat') {
            discount = coupon.value;
        } else if (coupon.type === 'percentage') {
            discount = (cartValue * coupon.value) / 100;

            // Apply max discount cap if set
            if (coupon.maxDiscount && discount > coupon.maxDiscount) {
                discount = coupon.maxDiscount;
            }
        }

        // Ensure discount doesn't exceed cart value
        discount = Math.min(discount, cartValue);

        return { valid: true, coupon, discount };
    } catch (error) {
        console.error('Error validating coupon:', error);
        return { valid: false, discount: 0, reason: 'Failed to validate coupon' };
    }
};

/**
 * Mark coupon as used by a user
 * Increments usage count and adds user to usedBy array
 */
export const useCoupon = async (couponId: string, userId: string): Promise<void> => {
    try {
        await collections.coupons.doc(couponId).update({
            usedCount: admin.firestore.FieldValue.increment(1),
            usedBy: admin.firestore.FieldValue.arrayUnion(userId),
        });
    } catch (error) {
        console.error('Error marking coupon as used:', error);
        throw new AppError('Failed to record coupon usage', 500);
    }
};

/**
 * Get all coupons (admin only)
 * Returns all coupons (sorting handled client-side to avoid Firestore index requirement)
 */
export const getAllCoupons = async (): Promise<Coupon[]> => {
    try {
        const snapshot = await collections.coupons.get();

        const coupons: Coupon[] = [];

        // Convert each document, skipping any with errors
        snapshot.docs.forEach(doc => {
            try {
                const data = doc.data();

                // Convert Firestore Timestamps to Dates
                const coupon: Coupon = {
                    id: doc.id,
                    ...data,
                    createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
                    validFrom: data.validFrom?.toDate ? data.validFrom.toDate() : new Date(data.validFrom),
                    validUntil: data.validUntil?.toDate ? data.validUntil.toDate() : new Date(data.validUntil),
                } as Coupon;

                coupons.push(coupon);
            } catch (docError) {
                // Skip this coupon if there's a conversion error
                console.warn(`Skipping malformed coupon ${doc.id}:`, docError);
            }
        });

        // Sort by createdAt desc (newest first) - done client-side
        return coupons.sort((a, b) => {
            const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
            const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
            return dateB - dateA;
        });
    } catch (error) {
        console.error('Error fetching coupons:', error);
        throw new AppError('Failed to fetch coupons', 500);
    }
};

/**
 * Get coupon by ID
 */
export const getCouponById = async (id: string): Promise<Coupon | null> => {
    try {
        const doc = await collections.coupons.doc(id).get();

        if (!doc.exists) {
            return null;
        }

        const data = doc.data()!;
        return {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            validFrom: data.validFrom?.toDate(),
            validUntil: data.validUntil?.toDate(),
        } as Coupon;
    } catch (error) {
        console.error('Error fetching coupon:', error);
        throw new AppError('Failed to fetch coupon', 500);
    }
};

/**
 * Update coupon
 */
export const updateCoupon = async (
    id: string,
    updateData: Partial<Omit<Coupon, 'id' | 'createdAt' | 'createdBy' | 'usedCount' | 'usedBy'>>
): Promise<Coupon> => {
    try {
        const couponRef = collections.coupons.doc(id);
        const doc = await couponRef.get();

        if (!doc.exists) {
            throw new AppError('Coupon not found', 404);
        }

        // If updating code, check for duplicates
        if (updateData.code) {
            const normalizedCode = updateData.code.toUpperCase().trim();
            const existing = await collections.coupons
                .where('code', '==', normalizedCode)
                .limit(1)
                .get();

            if (!existing.empty && existing.docs[0].id !== id) {
                throw new AppError('Coupon code already exists', 400);
            }

            updateData.code = normalizedCode;
        }

        await couponRef.update(updateData);

        return await getCouponById(id) as Coupon;
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error updating coupon:', error);
        throw new AppError('Failed to update coupon', 500);
    }
};

/**
 * Delete coupon
 * Soft delete by setting active to false (preserves historical data)
 */
export const deleteCoupon = async (id: string): Promise<void> => {
    try {
        const couponRef = collections.coupons.doc(id);
        const doc = await couponRef.get();

        if (!doc.exists) {
            throw new AppError('Coupon not found', 404);
        }

        // Soft delete - just deactivate
        await couponRef.update({ active: false });
    } catch (error) {
        if (error instanceof AppError) throw error;
        console.error('Error deleting coupon:', error);
        throw new AppError('Failed to delete coupon', 500);
    }
};

/**
 * Get user's completed order count
 * Used to check if user is eligible for firstOrder coupons
 */
export const getUserOrderCount = async (userId: string): Promise<number> => {
    try {
        const ordersSnapshot = await collections.orders
            .where('userId', '==', userId)
            .where('paymentStatus', '==', 'paid')
            .get();

        return ordersSnapshot.size;
    } catch (error) {
        console.error('Error getting user order count:', error);
        return 0; // Fail safe - if we can't determine, assume they have orders
    }
};
