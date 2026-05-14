import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/config';

interface AuthContextType {
  user: User | null;
  userData: any | null;
  loading: boolean;
  loginAsAdmin: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userData: null,
  loading: true,
  loginAsAdmin: () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for admin bypass
    const bypassAdmin = localStorage.getItem('adminBypass');
    if (bypassAdmin === 'true') {
      setUser({ uid: 'admin-bypass', email: 'admin@system.local', emailVerified: true } as User);
      setUserData({ role: 'admin', name: 'System Administrator' });
      setLoading(false);
      return;
    }

    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      
      if (unsubscribeSnapshot) {
        unsubscribeSnapshot();
        unsubscribeSnapshot = null;
      }

      if (firebaseUser) {
        try {
          // Try admin first
          const adminRef = doc(db, 'admins', firebaseUser.uid);
          const adminDoc = await getDoc(adminRef);
          
          if (adminDoc.exists()) {
            // It's an admin
            setUserData({ ...adminDoc.data(), role: 'admin' });
            setLoading(false);
            return;
          }
        } catch (error) {
          console.log("Admin check failed or denied, proceeding as student.", error);
        }

        // It's a student (or admin check failed)
        const studentRef = doc(db, 'students', firebaseUser.uid);
        unsubscribeSnapshot = onSnapshot(studentRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserData({ ...data, role: data.role || 'student' });
          } else {
            setUserData(null);
          }
          setLoading(false);
        }, (error) => {
          console.error("Error fetching student data:", error);
          setUserData(null);
          setLoading(false);
        });
      } else {
        setUserData(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) unsubscribeSnapshot();
    };
  }, []);

  const loginAsAdmin = () => {
    localStorage.setItem('adminBypass', 'true');
    setUser({ uid: 'admin-bypass', email: 'admin@system.local', emailVerified: true } as User);
    setUserData({ role: 'admin', name: 'System Administrator' });
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, userData, loading, loginAsAdmin }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
