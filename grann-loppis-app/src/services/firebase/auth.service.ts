import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  User as FirebaseUser,
} from 'firebase/auth';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '../../../firebase.config';
import { UserRole, User, SellerProfile } from '../../types';

const USERS_COLLECTION = 'users';

export interface RegisterInput {
  email: string;
  password: string;
  displayName: string;
  role: UserRole;
  sellerProfile?: SellerProfile; // Required when role is SELLER
}

export interface LoginInput {
  email: string;
  password: string;
}

/**
 * Register a new user with email and password
 */
export async function register(input: RegisterInput): Promise<User> {
  try {
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      input.email,
      input.password
    );

    // Update display name in Firebase Auth
    await updateProfile(userCredential.user, {
      displayName: input.displayName,
    });

    // Create user profile in Firestore
    const userData: Omit<User, 'id'> = {
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      createdAt: new Date(),
      ...(input.sellerProfile && { sellerProfile: input.sellerProfile }),
    };

    const firestoreData = {
      email: input.email,
      displayName: input.displayName,
      role: input.role,
      createdAt: Timestamp.now(),
      ...(input.sellerProfile && { sellerProfile: input.sellerProfile }),
    };

    // Wait for Firestore write to complete
    await setDoc(doc(db, USERS_COLLECTION, userCredential.user.uid), firestoreData);

    return {
      id: userCredential.user.uid,
      ...userData,
    };
  } catch (error: any) {
    console.error('Error registering user:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/email-already-in-use') {
      throw new Error('This email is already registered');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('Password should be at least 6 characters');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    }

    throw new Error('Failed to register. Please try again.');
  }
}

/**
 * Login with email and password
 */
export async function login(input: LoginInput): Promise<FirebaseUser> {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      input.email,
      input.password
    );

    return userCredential.user;
  } catch (error: any) {
    console.error('Error logging in:', error);

    // Handle specific Firebase Auth errors
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password') {
      throw new Error('Invalid email or password');
    } else if (error.code === 'auth/invalid-email') {
      throw new Error('Invalid email address');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please try again later.');
    }

    throw new Error('Failed to login. Please try again.');
  }
}

/**
 * Logout current user
 */
export async function logout(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Error logging out:', error);
    throw new Error('Failed to logout');
  }
}

/**
 * Get current authenticated user
 */
export function getCurrentUser(): FirebaseUser | null {
  return auth.currentUser;
}

export const authService = {
  register,
  login,
  logout,
  getCurrentUser,
};
