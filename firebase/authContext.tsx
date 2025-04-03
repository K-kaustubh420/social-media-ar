// firebase/authContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { auth } from '@/firebase/firebase'; // Import your firebase auth instance
import { onAuthStateChanged, User } from 'firebase/auth';

interface AuthContextType {
  authUser: User | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setAuthUser(user);
      setLoading(false);
    });
    return () => unsubscribe(); // Unsubscribe on unmount
  }, []);

  const value: AuthContextType = { authUser, loading };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children} {/* Only render children when not loading */}
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