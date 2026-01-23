import { collections, auth } from '../config/firebase';
import { User, UserRole } from '@tntrends/shared';
import { AppError } from '../middleware/errorHandler';

/**
 * Create or update user in Firestore
 */
export const createUser = async (
    uid: string,
    userData: Omit<User, 'uid' | 'createdAt'>
): Promise<User> => {
    try {
        const newUser: User = {
            uid,
            ...userData,
            createdAt: new Date(),
        };

        await collections.users.doc(uid).set(newUser);
        return newUser;
    } catch (error) {
        console.error('Error creating user:', error);
        throw new AppError('Failed to create user', 500);
    }
};

/**
 * Get user by UID
 */
export const getUserById = async (uid: string): Promise<User | null> => {
    try {
        const doc = await collections.users.doc(uid).get();

        if (!doc.exists) {
            return null;
        }

        return {
            ...doc.data(),
            createdAt: doc.data()?.createdAt?.toDate(),
        } as User;
    } catch (error) {
        console.error('Error fetching user:', error);
        throw new AppError('Failed to fetch user', 500);
    }
};

/**
 * Update user role (superadmin only)
 */
export const updateUserRole = async (
    uid: string,
    role: UserRole
): Promise<void> => {
    try {
        // Update Firestore document
        await collections.users.doc(uid).update({ role });

        // Set custom claim in Firebase Auth
        await auth.setCustomUserClaims(uid, { role });

        console.log(`✅ Updated role for user ${uid} to ${role}`);
    } catch (error) {
        console.error('Error updating user role:', error);
        throw new AppError('Failed to update user role', 500);
    }
};

/**
 * Get all users (admin feature)
 */
export const getAllUsers = async (): Promise<User[]> => {
    try {
        const snapshot = await collections.users.get();

        return snapshot.docs.map((doc: any) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        }));
    } catch (error) {
        console.error('Error fetching users:', error);
        throw new AppError('Failed to fetch users', 500);
    }
};

/**
 * Get users by role
 */
export const getUsersByRole = async (role: UserRole): Promise<User[]> => {
    try {
        const snapshot = await collections.users.where('role', '==', role).get();

        return snapshot.docs.map((doc: any) => ({
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
        }));
    } catch (error) {
        console.error('Error fetching users by role:', error);
        throw new AppError('Failed to fetch users', 500);
    }
};
