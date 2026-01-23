import { create } from 'zustand';
import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User as FirebaseUser,
} from 'firebase/auth';
import { auth, db } from '../lib/firebase';
import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { SavedAddress, Address, AddressError } from '@tntrends/shared';
import {
    validateAddress,
    sanitizeAddress,
    isDuplicateAddress,
} from '../lib/addressUtils';
import {
    logAddressAdded,
    logAddressUpdated,
    logAddressDeleted,
    logDefaultAddressSet,
    logDataExported,
    logAddressOperationFailed,
} from '../lib/addressLogger';

interface AppUser {
    uid: string;
    email: string | null;
    role: 'superadmin' | 'admin' | 'customer';
    name: string | null;
    addresses: SavedAddress[]; // Saved addresses
}

interface AuthStore {
    user: AppUser | null;
    loading: boolean;
    initialized: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
    initialize: () => () => void;

    // Address management methods
    addAddress: (address: Address, label: string) => Promise<void>;
    updateAddress: (addressId: string, updates: Partial<Address>, label?: string) => Promise<void>;
    deleteAddress: (addressId: string) => Promise<void>;
    setDefaultAddress: (addressId: string) => Promise<void>;
    updateAddressUsage: (addressId: string) => Promise<void>;
    exportUserData: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
    user: null,
    loading: true,
    initialized: false,

    signIn: async (email, password) => {
        await signInWithEmailAndPassword(auth, email, password);
    },

    signUp: async (email, password) => {
        await createUserWithEmailAndPassword(auth, email, password);
    },

    logout: async () => {
        await signOut(auth);
        set({ user: null });
    },

    initialize: () => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (!firebaseUser) {
                set({ user: null, loading: false, initialized: true });
                return;
            }

            // Fetch Firestore user document
            const ref = doc(db, "users", firebaseUser.uid);
            const snap = await getDoc(ref);

            let role = "customer";
            let name = firebaseUser.email;

            if (snap.exists()) {
                const data = snap.data();
                role = data.role ?? "customer";
                name = data.name ?? firebaseUser.email;
            }

            const user: AppUser = {
                uid: firebaseUser.uid,
                email: firebaseUser.email,
                role: role as any,
                name: name,
                addresses: snap.exists() ? (snap.data().addresses || []) : [],
            };

            set({ user, loading: false, initialized: true });
        });

        return unsubscribe;
    },

    // ============================================================================
    // ADDRESS MANAGEMENT METHODS
    // ============================================================================

    /**
     * Add a new address with Firestore transaction
     * Implements optimistic UI updates with rollback on error
     */
    addAddress: async (address: Address, label: string = 'Home') => {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('Not authenticated');

        // Client-side validation
        const validationError = validateAddress(address);
        if (validationError) {
            throw validationError;
        }

        // Sanitize input
        const sanitized = sanitizeAddress(address);

        // Check for duplicates
        const duplicate = isDuplicateAddress(sanitized, user.addresses);
        if (duplicate) {
            const error: AddressError = {
                type: 'DUPLICATE_ADDRESS',
                message: `This address is similar to "${duplicate.label}". Please use a different address.`,
            };
            throw error;
        }

        // Check limit
        if (user.addresses.length >= 10) {
            const error: AddressError = {
                type: 'MAX_ADDRESSES_REACHED',
                message: 'Maximum 10 addresses allowed. Please delete an address to add a new one.',
            };
            throw error;
        }

        // Create new address
        const newAddress: SavedAddress = {
            ...sanitized,
            id: crypto.randomUUID(),
            label: label.trim() || 'Home',
            isDefault: user.addresses.length === 0, // First address is default
            createdAt: new Date(),
        };

        // Optimistic update
        const prevAddresses = user.addresses;
        set((state) => ({
            user: state.user ? {
                ...state.user,
                addresses: [...prevAddresses, newAddress],
            } : null,
        }));

        try {
            // Firestore transaction (CRITICAL for race condition safety)
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);

                if (!userDoc.exists()) {
                    throw new Error('User document not found');
                }

                const currentAddresses = userDoc.data()?.addresses || [];

                // Re-check limit (might have changed in parallel operation)
                if (currentAddresses.length >= 10) {
                    throw new Error('MAX_ADDRESSES_REACHED');
                }

                transaction.update(userRef, {
                    addresses: [...currentAddresses, newAddress],
                    lastActiveAt: new Date(),
                });
            });

            // Audit log
            logAddressAdded(user.uid, newAddress.id, newAddress.label);
        } catch (error: any) {
            // Rollback optimistic update
            set((state) => ({
                user: state.user ? {
                    ...state.user,
                    addresses: prevAddresses,
                } : null,
            }));

            // Log failure
            logAddressOperationFailed(user.uid, 'ADD', error.message);

            // Re-throw for UI error handling
            if (error.message === 'MAX_ADDRESSES_REACHED') {
                const addressError: AddressError = {
                    type: 'MAX_ADDRESSES_REACHED',
                    message: 'Address limit reached. Please refresh and try again.',
                };
                throw addressError;
            }
            throw error;
        }
    },

    /**
     * Update an existing address with transaction safety
     */
    updateAddress: async (addressId: string, updates: Partial<Address>, label?: string) => {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('Not authenticated');

        const addressIndex = user.addresses.findIndex((a) => a.id === addressId);
        if (addressIndex === -1) {
            throw new Error('Address not found');
        }

        const currentAddress = user.addresses[addressIndex];
        const updatedAddress: SavedAddress = {
            ...currentAddress,
            ...sanitizeAddress({ ...currentAddress, ...updates }),
            label: label || currentAddress.label,
        };

        // Validate
        const validationError = validateAddress(updatedAddress);
        if (validationError) {
            throw validationError;
        }

        // Optimistic update
        const prevAddresses = user.addresses;
        const newAddresses = [...user.addresses];
        newAddresses[addressIndex] = updatedAddress;

        set((state) => ({
            user: state.user ? {
                ...state.user,
                addresses: newAddresses,
            } : null,
        }));

        try {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                transaction.update(userRef, {
                    addresses: newAddresses,
                    lastActiveAt: new Date(),
                });
            });

            logAddressUpdated(user.uid, addressId, updatedAddress.label);
        } catch (error: any) {
            // Rollback
            set((state) => ({
                user: state.user ? {
                    ...state.user,
                    addresses: prevAddresses,
                } : null,
            }));

            logAddressOperationFailed(user.uid, 'UPDATE', error.message, addressId);
            throw error;
        }
    },

    /**
     * Delete an address with auto-default logic
     */
    deleteAddress: async (addressId: string) => {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('Not authenticated');

        const addressToDelete = user.addresses.find((a) => a.id === addressId);
        if (!addressToDelete) {
            throw new Error('Address not found');
        }

        // Optimistic update
        const prevAddresses = user.addresses;
        let newAddresses = user.addresses.filter((a) => a.id !== addressId);

        // Auto-set new default if deleted address was default
        if (addressToDelete.isDefault && newAddresses.length > 0) {
            newAddresses[0] = { ...newAddresses[0], isDefault: true };
        }

        set((state) => ({
            user: state.user ? {
                ...state.user,
                addresses: newAddresses,
            } : null,
        }));

        try {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                transaction.update(userRef, {
                    addresses: newAddresses,
                    lastActiveAt: new Date(),
                });
            });

            logAddressDeleted(user.uid, addressId, addressToDelete.label);
        } catch (error: any) {
            // Rollback
            set((state) => ({
                user: state.user ? {
                    ...state.user,
                    addresses: prevAddresses,
                } : null,
            }));

            logAddressOperationFailed(user.uid, 'DELETE', error.message, addressId);
            throw error;
        }
    },

    /**
     * Set an address as default
     */
    setDefaultAddress: async (addressId: string) => {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('Not authenticated');

        const address = user.addresses.find((a) => a.id === addressId);
        if (!address) {
            throw new Error('Address not found');
        }

        // Optimistic update
        const prevAddresses = user.addresses;
        const newAddresses = user.addresses.map((a) => ({
            ...a,
            isDefault: a.id === addressId,
        }));

        set((state) => ({
            user: state.user ? {
                ...state.user,
                addresses: newAddresses,
            } : null,
        }));

        try {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                transaction.update(userRef, {
                    addresses: newAddresses,
                    lastActiveAt: new Date(),
                });
            });

            logDefaultAddressSet(user.uid, addressId, address.label);
        } catch (error: any) {
            // Rollback
            set((state) => ({
                user: state.user ? {
                    ...state.user,
                    addresses: prevAddresses,
                } : null,
            }));

            logAddressOperationFailed(user.uid, 'SET_DEFAULT', error.message, addressId);
            throw error;
        }
    },

    /**
     * Update lastUsedAt timestamp when address is used in order
     */
    updateAddressUsage: async (addressId: string) => {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('Not authenticated');

        const addressIndex = user.addresses.findIndex((a) => a.id === addressId);
        if (addressIndex === -1) return; // Silently fail if address not found

        const newAddresses = [...user.addresses];
        newAddresses[addressIndex] = {
            ...newAddresses[addressIndex],
            lastUsedAt: new Date(),
        };

        // Update without optimistic UI (background operation)
        try {
            const userRef = doc(db, 'users', user.uid);
            await runTransaction(db, async (transaction) => {
                transaction.update(userRef, {
                    addresses: newAddresses,
                });
            });

            // Update local state after success
            set((state) => ({
                user: state.user ? {
                    ...state.user,
                    addresses: newAddresses,
                } : null,
            }));
        } catch (error) {
            // Silently fail - this is not critical
            console.error('Failed to update address usage:', error);
        }
    },

    /**
     * Export user data for GDPR compliance
     */
    exportUserData: () => {
        const { user } = useAuthStore.getState();
        if (!user) throw new Error('Not authenticated');

        const exportData = {
            uid: user.uid,
            email: user.email,
            name: user.name,
            role: user.role,
            addresses: user.addresses,
            exportedAt: new Date().toISOString(),
        };

        // Create downloadable JSON file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `tntrends-data-${user.uid}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        logDataExported(user.uid);
    },
}));
