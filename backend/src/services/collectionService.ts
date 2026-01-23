import { db } from '../config/firebase';
import admin from 'firebase-admin';
import { Collection, CollectionWithProducts, Product, CollectionQueryParams, AutoSelectionRules } from '@tntrends/shared';
import { productService } from './productService';

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
        };
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

        const now = admin.firestore.Timestamp.now();

        const collection: Omit<Collection, 'id'> = {
            slug: data.slug!,
            name: data.name!,
            tagline: data.tagline,
            description: data.description || '',
            bannerImage: data.bannerImage,
            thumbnailImage: data.thumbnailImage,
            selectionType: data.selectionType || 'manual',
            productIds: data.productIds || [],
            autoRules: data.autoRules,
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
     * Resolve products based on collection's selection strategy
     */
    private async resolveProducts(collection: Collection): Promise<Product[]> {
        let productIds: string[] = [];

        switch (collection.selectionType) {
            case 'manual':
                productIds = collection.productIds || [];
                break;

            case 'automatic':
                if (collection.autoRules) {
                    productIds = await this.evaluateAutoRules(collection.autoRules);
                }
                break;

            case 'hybrid':
                const auto = collection.autoRules
                    ? await this.evaluateAutoRules(collection.autoRules)
                    : [];
                const manual = collection.productIds || [];
                // Union, maintaining manual order first
                productIds = [...new Set([...manual, ...auto])];
                break;
        }

        if (productIds.length === 0) {
            return [];
        }

        // Fetch products (handle Firestore's 10-item 'in' limit by batching)
        return await this.fetchProductsByIds(productIds);
    }

    /**
     * Evaluate automatic selection rules
     */
    private async evaluateAutoRules(rules: AutoSelectionRules): Promise<string[]> {
        let query: FirebaseFirestore.Query = db.collection('products');
        let needsClientFiltering = false;

        // Apply Firestore-compatible filters
        if (rules.categories && rules.categories.length > 0) {
            if (rules.categories.length === 1) {
                query = query.where('category', '==', rules.categories[0]);
            } else {
                query = query.where('category', 'in', rules.categories.slice(0, 10));
            }
        }

        if (rules.tags && rules.tags.length > 0) {
            // array-contains-any is limited to 10 items
            query = query.where('tags', 'array-contains-any', rules.tags.slice(0, 10));
        }

        if (rules.inStock !== undefined) {
            query = query.where('inStock', '==', rules.inStock);
        }

        if (rules.styleCode) {
            query = query.where('styleCode', '==', rules.styleCode);
        }

        // Client-side filtering needed for price, discount, date range
        if (rules.priceRange || rules.discountMin || rules.dateRange) {
            needsClientFiltering = true;
        }

        const snapshot = await query.get();
        let products = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        })) as Product[];

        // Apply client-side filters
        if (needsClientFiltering) {
            products = products.filter(product => {
                // Price range filter
                if (rules.priceRange) {
                    const price = product.basePrice || product.price;
                    if (rules.priceRange.min && price < rules.priceRange.min) return false;
                    if (rules.priceRange.max && price > rules.priceRange.max) return false;
                }

                // Discount filter
                if (rules.discountMin) {
                    if (product.discountType === 'none') return false;
                    if (product.discountValue < rules.discountMin) return false;
                }

                // Date range filter
                if (rules.dateRange) {
                    const createdAt = product.createdAt.toDate();
                    if (rules.dateRange.from && createdAt < rules.dateRange.from.toDate()) return false;
                    if (rules.dateRange.to && createdAt > rules.dateRange.to.toDate()) return false;
                }

                return true;
            });
        }

        return products.map(p => p.id);
    }

    /**
     * Fetch products by IDs in batches (Firestore 'in' limit is 10)
     */
    private async fetchProductsByIds(productIds: string[]): Promise<Product[]> {
        if (productIds.length === 0) return [];

        const products: Product[] = [];
        const batchSize = 10;

        for (let i = 0; i < productIds.length; i += batchSize) {
            const batch = productIds.slice(i, i + batchSize);
            const snapshot = await db.collection('products')
                .where(admin.firestore.FieldPath.documentId(), 'in', batch)
                .get();

            const batchProducts = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })) as Product[];

            products.push(...batchProducts);
        }

        // Maintain original order
        const productMap = new Map(products.map(p => [p.id, p]));
        return productIds
            .map(id => productMap.get(id))
            .filter(p => p !== undefined) as Product[];
    }
}

export const collectionService = new CollectionService();
