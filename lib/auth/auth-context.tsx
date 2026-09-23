'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

import { PlanTier } from '@/types/database';

export interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  role: string;
  target_degree?: string;
  tier?: PlanTier;
  usage?: any;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authModalReason: string;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signup: (fullName: string, email: string, password: string, targetDegree?: string) => Promise<{ success: boolean; error?: string; otpRequired?: boolean; expiresAt?: number }>;
  loginWithGoogle: (googlePayload?: any) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  setAuthenticatedUser: (user: AuthUser) => void;
  openAuthModal: (reason?: string, onAuthenticated?: () => void) => void;
  closeAuthModal: () => void;
  requireAuth: (actionName: string, callback: () => void) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState('Account required to access this feature');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Re-hydrate session on mount from server
  useEffect(() => {
    async function loadUserSession() {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          if (data.authenticated && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        } else {
          setUser(null);
        }
      } catch {
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    loadUserSession();
  }, []);

  const openAuthModal = useCallback((reason?: string, onAuthenticated?: () => void) => {
    if (reason) setAuthModalReason(reason);
    if (onAuthenticated) setPendingAction(() => onAuthenticated);
    setIsAuthModalOpen(true);
  }, []);

  const closeAuthModal = useCallback(() => {
    setIsAuthModalOpen(false);
    setPendingAction(null);
  }, []);

  // Execute pending action after successful authentication
  const handleAuthSuccess = useCallback((authedUser: AuthUser) => {
    setUser(authedUser);
    setIsAuthModalOpen(false);

    if (pendingAction) {
      // Execute the deferred action automatically without user repetition
      setTimeout(() => {
        try {
          pendingAction();
        } catch (err) {
          console.error('[PENDING ACTION ERROR]', err);
        }
        setPendingAction(null);
      }, 100);
    }
  }, [pendingAction]);

  const login = async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Authentication failed' };
      }

      handleAuthSuccess(data.user);
      return { success: true };
    } catch {
      return { success: false, error: 'Connection failed during sign in.' };
    }
  };

  const signup = async (fullName: string, email: string, password: string, targetDegree?: string) => {
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName, email, password, targetDegree }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        return { success: false, error: data.error || 'Registration failed' };
      }

      // If OTP verification is required, do NOT auto-login — return otpRequired flag
      if (data.otpRequired) {
        return { success: true, otpRequired: true, expiresAt: data.expiresAt };
      }

      // Only auto-login if user data is returned (should not happen with OTP flow)
      if (data.user) {
        handleAuthSuccess(data.user);
      }
      return { success: true };
    } catch {
      return { success: false, error: 'Connection failed during registration.' };
    }
  };

  const loginWithGoogle = async (googlePayload?: any) => {
    try {
      if (googlePayload && googlePayload.email) {
        const res = await fetch('/api/auth/google', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(googlePayload),
        });
        const data = await res.json();
        if (!res.ok || !data.success) {
          return { success: false, error: data.error || 'Google Login failed.' };
        }
        handleAuthSuccess(data.user);
        return { success: true };
      } else {
        window.location.href = '/api/auth/google';
        return { success: true };
      }
    } catch {
      return { success: false, error: 'Failed to initiate Google authentication.' };
    }
  };

  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Continue client cleanup
    }

    setUser(null);
    setPendingAction(null);
  };

  /**
   * Action Interceptor: If authenticated, runs immediately.
   * If unauthenticated, prompts the auth modal and queues the action.
   */
  const requireAuth = useCallback((actionName: string, callback: () => void) => {
    if (user) {
      callback();
    } else {
      openAuthModal(actionName, callback);
    }
  }, [user, openAuthModal]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        authModalReason,
        login,
        signup,
        loginWithGoogle,
        logout,
        setAuthenticatedUser: handleAuthSuccess,
        openAuthModal,
        closeAuthModal,
        requireAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
