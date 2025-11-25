'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '../hooks/useAuth';

interface AuthContextType {
  user: ReturnType<typeof useAuth>['user'];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: ReturnType<typeof useAuth>['login'];
  signup: ReturnType<typeof useAuth>['signup'];
  logout: ReturnType<typeof useAuth>['logout'];
  adminLogin: ReturnType<typeof useAuth>['adminLogin'];
  hasRole: ReturnType<typeof useAuth>['hasRole'];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}

