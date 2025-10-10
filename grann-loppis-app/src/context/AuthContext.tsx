import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { auth } from '../../firebase.config';
import { onAuthStateChanged } from 'firebase/auth';
import { userService } from '../services/firebase/user.service';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('🔐 Auth state changed:', firebaseUser ? `User: ${firebaseUser.uid}` : 'No user');

      if (firebaseUser) {
        try {
          console.log('📥 Fetching user profile from Firestore...');
          // Fetch full user profile from Firestore
          let userProfile = await userService.getUserProfile(firebaseUser.uid);

          // Retry if profile not found (race condition during registration)
          if (!userProfile) {
            console.log('⏳ Profile not found, retrying in 1 second...');
            await new Promise(resolve => setTimeout(resolve, 1000));
            userProfile = await userService.getUserProfile(firebaseUser.uid);
          }

          // Retry one more time if still not found
          if (!userProfile) {
            console.log('⏳ Profile not found, retrying again in 2 seconds...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            userProfile = await userService.getUserProfile(firebaseUser.uid);
          }

          if (userProfile) {
            console.log('✅ User profile loaded:', userProfile);
            setUser(userProfile);
          } else {
            // User exists in Firebase Auth but not in Firestore
            console.error('❌ User authenticated but profile not found in Firestore after retries');
            console.error('Please check Firebase Console → Firestore → users collection');
            setUser(null);
          }
        } catch (error) {
          console.error('❌ Error fetching user profile:', error);
          setUser(null);
        }
      } else {
        console.log('👤 No authenticated user');
        setUser(null);
      }

      console.log('✅ Auth loading complete');
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
