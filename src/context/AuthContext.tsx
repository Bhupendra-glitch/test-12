import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  login: (userId: string, password?: string) => Promise<void>;
  logout: () => void;
  updateUserLoans: (updatedLoans: any[]) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('gigcred_token'));
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function initAuth() {
      const savedUser = localStorage.getItem('gigcred_user');
      const savedToken = localStorage.getItem('gigcred_token');

      if (savedToken && savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          // Refresh user data from server
          const refreshed = await api.getUser(parsed.userId);
          setUser(refreshed);
          localStorage.setItem('gigcred_user', JSON.stringify(refreshed));
        } catch {
          // fallback to stored user
          try {
            setUser(JSON.parse(savedUser));
          } catch {
            localStorage.removeItem('gigcred_user');
            localStorage.removeItem('gigcred_token');
          }
        }
      }
      setLoading(false);
    }
    initAuth();
  }, []);

  const login = async (userId: string, password: string = 'password123') => {
    const res = await api.login(userId, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem('gigcred_token', res.token);
    localStorage.setItem('gigcred_user', JSON.stringify(res.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('gigcred_token');
    localStorage.removeItem('gigcred_user');
  };

  const updateUserLoans = (updatedLoans: any[]) => {
    if (!user) return;
    const totalEMI = updatedLoans.reduce((sum, l) => sum + (Number(l.emi) || 0), 0);
    const totalOutstanding = updatedLoans.reduce((sum, l) => sum + (Number(l.outstanding) || 0), 0);
    const foir = Math.round((totalEMI / Math.max(1, user.monthlyIncome)) * 100);

    const updated: UserProfile = {
      ...user,
      loans: updatedLoans,
      monthlyEMI: totalEMI,
      totalOutstanding,
      foir,
      monthlySurplus: user.monthlyIncome - user.monthlyExpense - totalEMI,
    };
    setUser(updated);
    localStorage.setItem('gigcred_user', JSON.stringify(updated));
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout, updateUserLoans }}>
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
