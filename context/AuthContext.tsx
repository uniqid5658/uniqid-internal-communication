import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Role } from '../types';
import { DataService } from '../services/dataService';

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
        console.error("Failed to parse stored user", e);
        localStorage.removeItem('uniqid_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string): Promise<boolean> => {
    const users = DataService.getUsers();
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser && foundUser.password === pass) {
      setUser(foundUser);
      localStorage.setItem('uniqid_user', JSON.stringify(foundUser));
      return true;
    }
    return false;
  };

  const signup = async (userData: Omit<User, 'id' | 'role' | 'avatarUrl'>): Promise<boolean> => {
    const users = DataService.getUsers();
    if (users.some(u => u.email.toLowerCase() === userData.email.toLowerCase())) {
        return false; // Email exists
    }

    const newUser: User = {
        id: Date.now().toString(),
        role: Role.STAFF, // Default role
        avatarUrl: `https://ui-avatars.com/api/?name=${userData.name}`,
        ...userData
    };

    DataService.saveUser(newUser);
    // Auto login
    setUser(newUser);
    localStorage.setItem('uniqid_user', JSON.stringify(newUser));
    return true;
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