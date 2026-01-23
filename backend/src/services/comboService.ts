import { db } from '../config/firebase';
import { ComboOffer, ComboType } from '@tntrends/shared';

/**
 * Combo Service - CRUD operations for combo offers
 * 
 * Design Pattern: Service Layer
 * - All business logic isolated here for testability
 * - Firestore operations abstracted
 * - Ready for Path 2 expansion (just add combo type handlers)
 */

const COMBOS_COLLECTION = 'combo-offers';

/**
 * Check if combo is currently active based on dates and status
 */
export const isComboActive = (combo: ComboOffer): boolean => {
    if (!combo.active) return false;

    const now = new Date();
    const startDate = combo.startDate instanceof Date ? combo.startDate : new Date(combo.startDate);

    // Check if combo has started
    if (startDate > now) return false;

    // Check if combo has ended (if endDate exists)
    if (combo.endDate) {
        const endDate = combo.endDate instanceof Date ? combo.endDate : new Date(combo.endDate);
        if (endDate < now) return false;
    }

    return true;
};

/**
 * Get all active combos (public API)
 */
export const getAllActiveCombos = async (): Promise<ComboOffer[]> => {
    try {
        const snapshot = await db.collection(COMBOS_COLLECTION)
            .where('active', '==', true)
            .orderBy('createdAt', 'desc')
            .get();

        const combos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        })) as ComboOffer[];

        // Filter by date validity
        return combos.filter(isComboActive);
    } catch (error: any) {
        throw new Error(`Failed to fetch active combos: ${error.message}`);
    }
};

/**
 * Get all combos (admin API)
 */
export const getAllCombos = async (): Promise<ComboOffer[]> => {
    try {
        const snapshot = await db.collection(COMBOS_COLLECTION)
            .orderBy('createdAt', 'desc')
            .get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            startDate: doc.data().startDate?.toDate(),
            endDate: doc.data().endDate?.toDate(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate(),
        })) as ComboOffer[];
    } catch (error: any) {
        throw new Error(`Failed to fetch combos: ${error.message}`);
    }
};

/**
 * Get single combo by ID
 */
export const getComboById = async (comboId: string): Promise<ComboOffer | null> => {
    try {
        const doc = await db.collection(COMBOS_COLLECTION).doc(comboId).get();

        if (!doc.exists) return null;

        return {
            id: doc.id,
            ...doc.data(),
            startDate: doc.data()?.startDate?.toDate(),
            endDate: doc.data()?.endDate?.toDate(),
            createdAt: doc.data()?.createdAt?.toDate(),
            updatedAt: doc.data()?.updatedAt?.toDate(),
        } as ComboOffer;
    } catch (error: any) {
        throw new Error(`Failed to fetch combo: ${error.message}`);
    }
};

/**
 * Create new combo (admin only)
 */
export const createCombo = async (
    comboData: Omit<ComboOffer, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'totalRevenue' | 'createdBy'>,
    adminUid: string
): Promise<ComboOffer> => {
    try {
        // Validate required fields
        if (!comboData.name || !comboData.type || !comboData.minimumQuantity || !comboData.comboPrice) {
            throw new Error('Missing required combo fields');
        }

        if (comboData.comboPrice <= 0) {
            throw new Error('Combo price must be greater than 0');
        }

        if (comboData.minimumQuantity < 2) {
            throw new Error('Minimum quantity must be at least 2');
        }

        const now = new Date();
        const docRef = await db.collection(COMBOS_COLLECTION).add({
            ...comboData,
            createdBy: adminUid,
            createdAt: now,
            usageCount: 0,
            totalRevenue: 0,
        });

        const createdCombo = await getComboById(docRef.id);
        if (!createdCombo) {
            throw new Error('Failed to retrieve created combo');
        }

        return createdCombo;
    } catch (error: any) {
        throw new Error(`Failed to create combo: ${error.message}`);
    }
};

/**
 * Update existing combo (admin only)
 */
export const updateCombo = async (
    comboId: string,
    updates: Partial<Omit<ComboOffer, 'id' | 'createdAt' | 'createdBy'>>
): Promise<ComboOffer> => {
    try {
        const comboRef = db.collection(COMBOS_COLLECTION).doc(comboId);
        const doc = await comboRef.get();

        if (!doc.exists) {
            throw new Error('Combo not found');
        }

        // Validate updates if provided
        if (updates.comboPrice !== undefined && updates.comboPrice <= 0) {
            throw new Error('Combo price must be greater than 0');
        }

        if (updates.minimumQuantity !== undefined && updates.minimumQuantity < 2) {
            throw new Error('Minimum quantity must be at least 2');
        }

        await comboRef.update({
            ...updates,
            updatedAt: new Date(),
        });

        const updatedCombo = await getComboById(comboId);
        if (!updatedCombo) {
            throw new Error('Failed to retrieve updated combo');
        }

        return updatedCombo;
    } catch (error: any) {
        throw new Error(`Failed to update combo: ${error.message}`);
    }
};

/**
 * Delete combo (soft delete by setting active to false)
 */
export const deleteCombo = async (comboId: string): Promise<void> => {
    try {
        const comboRef = db.collection(COMBOS_COLLECTION).doc(comboId);
        const doc = await comboRef.get();

        if (!doc.exists) {
            throw new Error('Combo not found');
        }

        // Soft delete - just deactivate
        await comboRef.update({
            active: false,
            updatedAt: new Date(),
        });
    } catch (error: any) {
        throw new Error(`Failed to delete combo: ${error.message}`);
    }
};

/**
 * Increment combo usage count (for analytics)
 */
export const incrementComboUsage = async (
    comboId: string,
    revenue: number
): Promise<void> => {
    try {
        const comboRef = db.collection(COMBOS_COLLECTION).doc(comboId);

        await db.runTransaction(async (transaction) => {
            const doc = await transaction.get(comboRef);

            if (!doc.exists) {
                throw new Error('Combo not found');
            }

            const currentUsage = doc.data()?.usageCount || 0;
            const currentRevenue = doc.data()?.totalRevenue || 0;

            transaction.update(comboRef, {
                usageCount: currentUsage + 1,
                totalRevenue: currentRevenue + revenue,
            });
        });
    } catch (error: any) {
        throw new Error(`Failed to increment combo usage: ${error.message}`);
    }
};
