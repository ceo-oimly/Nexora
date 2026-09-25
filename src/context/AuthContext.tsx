import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, UserRole } from '../types/exchange';
import {
  getUserProfile,
  createProfile,
  updateUserProfile,
  seedInitialAccounts,
} from '../services/ledgerService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  switchRole: (role: 'USER' | 'ADMIN') => void;
  updateUserAvatar: (avatarUrl: string) => void;
  updateUserData: (fullName: string, country: string) => void;
  verifyCurrentEmail: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'nexora_auth_user_id_v2';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    seedInitialAccounts();
    const savedUserId = localStorage.getItem(AUTH_STORAGE_KEY);
    if (savedUserId) {
      const existing = getUserProfile(savedUserId);
      if (existing) {
        setUser(existing);
      } else {
        const defaultTrader = getUserProfile('trader-nexora-01');
        if (defaultTrader) setUser(defaultTrader);
      }
    } else {
      const defaultTrader = getUserProfile('trader-nexora-01');
      if (defaultTrader) {
        setUser(defaultTrader);
        localStorage.setItem(AUTH_STORAGE_KEY, defaultTrader.userId);
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const knownProfiles = ['trader-nexora-01', 'admin-nexora-01'];
    for (const pid of knownProfiles) {
      const p = getUserProfile(pid);
      if (p && p.email.toLowerCase() === email.toLowerCase()) {
        if (p.status === 'SUSPENDED') {
          return { success: false, error: 'Your account has been suspended by the exchange administrator.' };
        }
        setUser(p);
        localStorage.setItem(AUTH_STORAGE_KEY, p.userId);
        return { success: true };
      }
    }

    const userId = `usr_${Math.abs(email.split('').reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))}`;
    let existing = getUserProfile(userId);
    if (!existing) {
      existing = createProfile({
        id: userId,
        userId,
        email,
        fullName: email.split('@')[0].toUpperCase(),
        role: email.includes('admin') || email === 'ifeanyiobiora83@gmail.com' ? 'ADMIN' : 'USER',
        status: 'ACTIVE',
        emailVerified: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }

    if (existing.status === 'SUSPENDED') {
      return { success: false, error: 'Account suspended.' };
    }

    setUser(existing);
    localStorage.setItem(AUTH_STORAGE_KEY, existing.userId);
    return { success: true };
  };

  const signup = async (fullName: string, email: string, pass: string) => {
    const userId = `usr_${Date.now()}`;
    const newProfile: UserProfile = {
      id: userId,
      userId,
      email,
      fullName,
      role: email === 'ifeanyiobiora83@gmail.com' ? 'ADMIN' : 'USER',
      status: 'ACTIVE',
      emailVerified: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    createProfile(newProfile);
    setUser(newProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, newProfile.userId);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const switchRole = (role: 'USER' | 'ADMIN') => {
    const targetId = role === 'ADMIN' ? 'admin-nexora-01' : 'trader-nexora-01';
    const profile = getUserProfile(targetId);
    if (profile) {
      setUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, profile.userId);
    }
  };

  const updateUserAvatar = (avatarUrl: string) => {
    if (!user) return;
    const updated = updateUserProfile(user.userId, { avatarUrl });
    setUser(updated);
  };

  const updateUserData = (fullName: string, country: string) => {
    if (!user) return;
    const updated = updateUserProfile(user.userId, { fullName, country });
    setUser(updated);
  };

  const verifyCurrentEmail = () => {
    if (!user) return;
    const updated = updateUserProfile(user.userId, { emailVerified: true });
    setUser(updated);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isAdmin: user?.role === 'ADMIN',
        login,
        signup,
        logout,
        switchRole,
        updateUserAvatar,
        updateUserData,
        verifyCurrentEmail,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
