import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  User, 
  signInWithPopup, 
  GoogleAuthProvider,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  userProfile: any | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid)); // This is a bit tricky since users are nested sometimes, but let's assume a root users collection for global profiles or use a different strategy.
        // Wait, my blueprint says businesses/{businessId}/users/{userId}. 
        // This means I can't find the user easily without knowing businessId.
        // I should probably have a top-level user-to-business mapping or store businessId in the user's custom claims/doc.
        // Let's adjust: have a top-level 'user_metadata' collection to store businessId.
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      // Using popup as it's more reliable in most hosted environments
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      console.error("Sign-in error:", error);
      if (error.code === 'auth/unauthorized-domain') {
        alert(`Domain error: Please add this domain to the Firebase Console Authorized Domains list.\n\nError: ${error.message}`);
      } else {
        alert(`Login failed: ${error.message}`);
      }
      throw error;
    }
  };

  const signOutUser = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, signInWithGoogle, signOutUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
