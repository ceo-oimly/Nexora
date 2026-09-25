import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile } from '../types/exchange';
import {
  getUserProfile,
  createProfile,
  updateUserProfile,
  seedInitialAccounts,
  initializeUserWallets,
} from '../services/ledgerService';

interface AuthContextType {
  user: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  updateUserAvatar: (avatarUrl: string) => void;
  updateUserData: (fullName: string, country: string) => void;
  verifyCurrentEmail: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = 'nexora_auth_user_v3';
const USER_CREDENTIALS_KEY = 'nexora_user_creds_v3';

// Default Admin configuration specified by user
const ADMIN_EMAIL = 'solfeggioroots@gmail.com';
const ADMIN_PASS = 'moneynatheformula';

interface StoredCredential {
  email: string;
  pass: string;
  userId: string;
}

const getStoredCredentials = (): Record<string, StoredCredential> => {
  try {
    const raw = localStorage.getItem(USER_CREDENTIALS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    // Ignore
  }
  return {};
};

const saveCredential = (email: string, pass: string, userId: string) => {
  try {
    const creds = getStoredCredentials();
    creds[email.toLowerCase()] = { email: email.toLowerCase(), pass, userId };
    localStorage.setItem(USER_CREDENTIALS_KEY, JSON.stringify(creds));
  } catch (e) {
    // Ignore
  }
};

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
        localStorage.removeItem(AUTH_STORAGE_KEY);
        setUser(null);
      }
    } else {
      // No mock auto-login! User and Admin must log in with fresh account.
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    // 1. Admin Login Verification
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      if (cleanPass !== ADMIN_PASS) {
        return { success: false, error: 'Incorrect administrator password.' };
      }

      const adminId = 'admin_solfeggioroots';
      let adminProfile = getUserProfile(adminId);
      if (!adminProfile) {
        adminProfile = createProfile({
          id: adminId,
          userId: adminId,
          email: ADMIN_EMAIL,
          fullName: 'Exchange Administrator',
          role: 'ADMIN',
          status: 'ACTIVE',
          emailVerified: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        initializeUserWallets(adminId, 0, 0);
      }

      setUser(adminProfile);
      localStorage.setItem(AUTH_STORAGE_KEY, adminProfile.userId);
      return { success: true };
    }

    // 2. Fresh User Login Verification
    const creds = getStoredCredentials();
    const userCred = creds[cleanEmail];

    if (userCred) {
      if (userCred.pass !== cleanPass) {
        return { success: false, error: 'Invalid password. Please check your credentials.' };
      }
      const profile = getUserProfile(userCred.userId);
      if (!profile) {
        return { success: false, error: 'User profile not found.' };
      }
      if (profile.status === 'SUSPENDED') {
        return { success: false, error: 'Your account has been suspended by compliance.' };
      }
      setUser(profile);
      localStorage.setItem(AUTH_STORAGE_KEY, profile.userId);
      return { success: true };
    }

    return {
      success: false,
      error: 'Account not found. Please click Register to create a fresh account.',
    };
  };

  const signup = async (fullName: string, email: string, pass: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const cleanPass = pass.trim();

    if (!cleanEmail || !cleanPass) {
      return { success: false, error: 'Email and password are required.' };
    }

    // If signing up as admin email
    if (cleanEmail === ADMIN_EMAIL.toLowerCase()) {
      if (cleanPass !== ADMIN_PASS) {
        return { success: false, error: 'Admin registration requires the authorized administrator password.' };
      }
      return login(cleanEmail, cleanPass);
    }

    // Check if user already exists
    const creds = getStoredCredentials();
    if (creds[cleanEmail]) {
      return { success: false, error: 'An account with this email already exists. Please sign in.' };
    }

    const userId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newProfile: UserProfile = {
      id: userId,
      userId,
      email: cleanEmail,
      fullName: fullName.trim(),
      role: 'USER',
      status: 'ACTIVE',
      emailVerified: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    createProfile(newProfile);
    // Initialize fresh empty wallets: 0 USD, 0 BTC (No Mock Data!)
    initializeUserWallets(userId, 0, 0);

    // Save credentials locally for login persistence
    saveCredential(cleanEmail, cleanPass, userId);

    setUser(newProfile);
    localStorage.setItem(AUTH_STORAGE_KEY, newProfile.userId);
    return { success: true };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
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
