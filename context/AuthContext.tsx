import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { MOCK_USERS } from '../services/mockData';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
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
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    // Simple mock auth
    const foundUser = MOCK_USERS.find(u => u.email === email);
    if (foundUser) {
        // In real app, check password hash here
        if ((foundUser.role === Role.ADMIN && pass === 'admin123') || 
            (foundUser.role === Role.STAFF && pass === 'staff123')) {
            setUser(foundUser);
            localStorage.setItem('uniqid_user', JSON.stringify(foundUser));
            return true;
        }
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('uniqid_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
