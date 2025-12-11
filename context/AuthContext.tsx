import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DataService } from '../services/dataService';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../services/firebase';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (userData: Omit<User, 'id' | 'role' | 'avatarUrl'>) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('uniqid_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('uniqid_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    try {
        const q = query(collection(db, 'users'), where('email', '==', email.toLowerCase()));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) {
            const foundUser = { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as User;
            // Simple password check (In real app, use Firebase Auth)
            if (foundUser.password === pass) {
                setUser(foundUser);
                localStorage.setItem('uniqid_user', JSON.stringify(foundUser));
                return true;
            }
        }
        return false;
    } catch (e) {
        console.error("Login error", e);
        return false;
    }
  };

  const signup = async (userData: Omit<User, 'id' | 'role' | 'avatarUrl'>): Promise<boolean> => {
    try {
        const q = query(collection(db, 'users'), where('email', '==', userData.email.toLowerCase()));
        const snapshot = await getDocs(q);
        
        if (!snapshot.empty) return false; // Email exists

        const newUser: User = {
            id: Date.now().toString(),
            role: Role.STAFF,
            ...userData
        };
        await DataService.saveUser(newUser);
        
        setUser(newUser);
        localStorage.setItem('uniqid_user', JSON.stringify(newUser));
        return true;
    } catch (e) {
        console.error("Signup error", e);
        return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('uniqid_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, signup, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
