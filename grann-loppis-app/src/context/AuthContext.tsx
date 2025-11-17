import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { User } from "../types";
import { auth } from "../../firebase.config";
import { onAuthStateChanged } from "firebase/auth";
import { userService } from "../services/firebase/user.service";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  setUser: (user: User | null) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          // Fetch full user profile from Firestore
          let userProfile = await userService.getUserProfile(firebaseUser.uid);

          // Retry if profile not found (race condition during registration)
          if (!userProfile) {
            await new Promise((resolve) => setTimeout(resolve, 1000));
            userProfile = await userService.getUserProfile(firebaseUser.uid);
          }

          // Retry one more time if still not found
          if (!userProfile) {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            userProfile = await userService.getUserProfile(firebaseUser.uid);
          }

          if (userProfile) {
            setUser(userProfile);
          } else {
            // User exists in Firebase Auth but not in Firestore
            console.error(
              "User authenticated but profile not found in Firestore after retries"
            );
            console.error(
              "Please check Firebase Console → Firestore → users collection"
            );
            setUser(null);
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setUser(null);
        }
      } else {
        setUser(null);
      }
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
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
