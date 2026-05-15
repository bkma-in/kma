import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import type { Role } from '../utils/validation';

interface AuthContextType {
  currentUser: (User & { role: Role; name: string }) | null;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<(User & { role: Role; name: string }) | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCurrentUser({
              ...user,
              role: userData.role as Role,
              name: userData.name || user.displayName || user.email?.split('@')[0] || 'User'
            });
          } else {
            // Fallback for users with no firestore doc yet
            setCurrentUser({
              ...user,
              role: 'reader',
              name: user.displayName || user.email?.split('@')[0] || 'User'
            });
          }
        } catch (error) {
          console.error("Error fetching user role:", error);
          setCurrentUser({
            ...user,
            role: 'reader',
            name: user.displayName || user.email?.split('@')[0] || 'User'
          });
        }
      } else {
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
