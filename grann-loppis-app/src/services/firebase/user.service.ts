import { doc, getDoc, updateDoc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '../../../firebase.config';
import { User, UserRole } from '../../types';

const USERS_COLLECTION = 'users';

/**
 * Get user profile from Firestore by user ID
 */
export async function getUserProfile(userId: string): Promise<User | null> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);
    const docSnap = await getDoc(docRef);

    if (!docSnap.exists()) {
      return null;
    }

    const data = docSnap.data();
    return {
      id: docSnap.id,
      email: data.email,
      displayName: data.displayName,
      role: data.role,
      createdAt: data.createdAt.toDate(),
    };
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to load user profile');
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: Partial<Omit<User, 'id' | 'createdAt'>>
): Promise<void> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);

    const updateData: any = {};

    if (updates.displayName !== undefined) {
      updateData.displayName = updates.displayName;
    }
    if (updates.role !== undefined) {
      updateData.role = updates.role;
    }
    if (updates.email !== undefined) {
      updateData.email = updates.email;
    }

    await updateDoc(docRef, updateData);
  } catch (error) {
    console.error('Error updating user profile:', error);
    throw new Error('Failed to update profile');
  }
}

/**
 * Create or update user profile (useful for social auth)
 */
export async function createOrUpdateUserProfile(
  userId: string,
  userData: Omit<User, 'id'>
): Promise<User> {
  try {
    const docRef = doc(db, USERS_COLLECTION, userId);

    const data = {
      email: userData.email,
      displayName: userData.displayName,
      role: userData.role,
      createdAt: Timestamp.now(),
    };

    await setDoc(docRef, data, { merge: true });

    return {
      id: userId,
      ...userData,
    };
  } catch (error) {
    console.error('Error creating/updating user profile:', error);
    throw new Error('Failed to save user profile');
  }
}

export const userService = {
  getUserProfile,
  updateUserProfile,
  createOrUpdateUserProfile,
};
