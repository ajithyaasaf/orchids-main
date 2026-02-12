import { db } from '../config/firebase';
import admin from 'firebase-admin';
import { Collection, CollectionWithProducts, Product, CollectionQueryParams, WholesaleProduct } from '@tntrends/shared';
import { getWholesaleProductsByIds } from './wholesaleProductService';

class CollectionService {
    private collectionRef = db.collection('collections');

    /**
     * Get all active collections for homepage showcase
     * Returns only collections that should be displayed on homepage
     */
    async getActiveCollections(): Promise<Collection[]> {
        const now = new Date();

        const snapshot = await this.collectionRef
            .where('status', '==', 'active')
            .where('startDate', '<=', now)
            .where('displaySettings.showOnHomepage', '==', true)
            .orderBy('startDate', 'asc')
            .orderBy('displaySettings.homepageOrder', 'asc')
            .get();

        const collections = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Collection[];

        // Filter out expired collections (client-side since Firestore can't do multiple inequalities)
        const active = collections.filter(c => {
            if (!c.endDate) return true; // No end date = permanent
            return c.endDate.toDate() > now;
        });

        return active;
    }

    /**
     * Get collection by slug with resolved products
     */
    async getCollectionBySlug(slug: string): Promise<CollectionWithProducts | null> {
        const snapshot = await this.collectionRef
            .where('slug', '==', slug)
            .where('status', '==', 'active')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return null;
        }

        const doc = snapshot.docs[0];
        const collection = {
            id: doc.id,
            ...doc.data()
        } as Collection;

        // Check if collection is within valid date range
        const now = new Date();
        if (collection.startDate.toDate() > now) {
            return null; // Not started yet
        }
        if (collection.endDate && collection.endDate.toDate() < now) {
            return null; // Expired
        }

        // Resolve products
        const products = await this.resolveProducts(collection);

        return {
            ...collection,
            products
        } as any; // Type mismatch: Collection expects Product[] but we return WholesaleProduct[]
    }

    /**
     * Get collection by ID (admin use)
     */
    async getCollectionById(id: string): Promise<Collection | null> {
        const doc = await this.collectionRef.doc(id).get();

        if (!doc.exists) {
            return null;
        }

        return {
            id: doc.id,
            ...doc.data()
        } as Collection;
    }

    /**
     * Get all collections with filters (admin use)
     */
    async getAllCollections(params?: CollectionQueryParams): Promise<Collection[]> {
        let query: FirebaseFirestore.Query = this.collectionRef;

        if (params?.status) {
            query = query.where('status', '==', params.status);
        }

        if (params?.showOnHomepage !== undefined) {
            query = query.where('displaySettings.showOnHomepage', '==', params.showOnHomepage);
        }

        query = query.orderBy('createdAt', 'desc');

        if (params?.limit) {
            query = query.limit(params.limit);
        }

        const snapshot = await query.get();

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Collection[];
    }

    /**
     * Create new collection
     */
    async createCollection(data: Partial<Collection>, adminId: string): Promise<string> {
        // Validate slug uniqueness
        const existing = await this.collectionRef
            .where('slug', '==', data.slug)
            .limit(1)
            .get();

        if (!existing.empty) {
            throw new Error('A collection with this slug already exists');
        }

        // Validate productIds
        if (!data.productIds || data.productIds.length === 0) {
            throw new Error('At least one product must be selected for the collection');
        }

        const now = admin.firestore.Timestamp.now();

        const collection: Omit<Collection, 'id'> = {
            slug: data.slug!,
            name: data.name!,
            tagline: data.tagline,
            description: data.description || '',
            bannerImage: data.bannerImage,
            thumbnailImage: data.thumbnailImage,
            productIds: data.productIds,
            status: data.status || 'draft',
            startDate: data.startDate || now,
            endDate: data.endDate,
            timezone: data.timezone || 'Asia/Kolkata',
            displaySettings: {
                showOnHomepage: data.displaySettings?.showOnHomepage ?? false,
                homepageOrder: data.displaySettings?.homepageOrder,
                showCountdown: data.displaySettings?.showCountdown ?? false,
                customCTA: data.displaySettings?.customCTA,
                theme: data.displaySettings?.theme || 'default',
            },
            seo: {
                metaTitle: data.seo?.metaTitle,
                metaDescription: data.seo?.metaDescription,
                keywords: data.seo?.keywords || [],
                ogImage: data.seo?.ogImage,
            },
            viewCount: 0,
            associatedCoupon: data.associatedCoupon,
            associatedCombo: data.associatedCombo,
            createdAt: now,
            createdBy: adminId,
            updatedAt: now,
            updatedBy: adminId,
        } as any;

        const ref = await this.collectionRef.add(collection);
        return ref.id;
    }

    /**
     * Update collection
     */
    async updateCollection(id: string, updates: Partial<Collection>, adminId: string): Promise<void> {
        const doc = await this.collectionRef.doc(id).get();

        if (!doc.exists) {
            throw new Error('Collection not found');
        }

        // If slug is being updated, check for uniqueness
        if (updates.slug && updates.slug !== doc.data()?.slug) {
            const existing = await this.collectionRef
                .where('slug', '==', updates.slug)
                .limit(1)
                .get();

            if (!existing.empty && existing.docs[0].id !== id) {
                throw new Error('A collection with this slug already exists');
            }
        }

        await this.collectionRef.doc(id).update({
            ...updates,
            updatedAt: admin.firestore.Timestamp.now(),
            updatedBy: adminId,
        });
    }

    /**
     * Delete collection (soft delete - archive)
     */
    async deleteCollection(id: string, adminId: string): Promise<void> {
        await this.updateCollection(id, { status: 'archived' }, adminId);
    }

    /**
     * Increment view count (fire and forget)
     */
    async trackView(collectionId: string): Promise<void> {
        this.collectionRef.doc(collectionId).update({
            viewCount: admin.firestore.FieldValue.increment(1)
        }).catch(err => console.error('Failed to track collection view:', err));
    }

    /**
     * Resolve wholesale products based on collection's productIds
     */
    private async resolveProducts(collection: Collection): Promise<WholesaleProduct[]> {
        if (!collection.productIds || collection.productIds.length === 0) {
            return [];
        }

        // Fetch wholesale products by IDs
        return await getWholesaleProductsByIds(collection.productIds);
    }
}

export const collectionService = new CollectionService();

