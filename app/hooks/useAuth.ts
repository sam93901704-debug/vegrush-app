import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '@/config/api';
import { jwtDecode } from 'jwt-decode';

const TOKEN_KEY = 'vegrush_token';

interface User {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  role: string;
}

interface AuthResponse {
  success: boolean;
  token: string;
  user?: User;
  admin?: {
    id: string;
    username: string;
    email: string | null;
    role: string;
  };
  delivery?: {
    id: string;
    name: string;
    phone: string;
    vehicleNumber: string | null;
    isActive: boolean;
  };
}

interface JwtPayload {
  userId?: string;
  deliveryId?: string;
  role: string;
  exp?: number;
  iat?: number;
}

/**
 * Get stored token from localStorage
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

/**
 * Store token in localStorage
 */
export function setToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
}

/**
 * Remove token from localStorage
 */
export function removeToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
}

/**
 * Decode JWT token to get user info
 */
export function decodeToken(token: string): JwtPayload | null {
  try {
    return jwtDecode<JwtPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Check if token is expired
 */
export function isTokenExpired(token: string): boolean {
  const payload = decodeToken(token);
  if (!payload || !payload.exp) return true;
  return Date.now() >= payload.exp * 1000;
}

/**
 * Get current user from token
 */
export function getCurrentUserFromToken(): User | null {
  const token = getToken();
  if (!token || isTokenExpired(token)) {
    removeToken();
    return null;
  }

  const payload = decodeToken(token);
  if (!payload) return null;

  // For now, we'll fetch user from API
  // Token only contains id and role
  return null;
}

/**
 * Auth hook for managing authentication state
 */
export function useAuth() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch current user
  const { data: currentUserData, isLoading: isLoadingUser } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: async () => {
      const token = getToken();
      if (!token) {
        throw new Error('No token');
      }

      const response = await fetch(`${API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          removeToken();
          throw new Error('Unauthorized');
        }
        throw new Error('Failed to fetch user');
      }

      const data = await response.json();
      return data.user as User;
    },
    enabled: !!getToken(),
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Update user state when data changes
  useEffect(() => {
    if (currentUserData) {
      setUser(currentUserData);
      setIsLoading(false);
    } else if (!isLoadingUser) {
      setUser(null);
      setIsLoading(false);
    }
  }, [currentUserData, isLoadingUser]);

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ identifier, password }: { identifier: string; password: string }) => {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Login failed');
      }

      const data = await response.json() as AuthResponse;
      setToken(data.token);
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        queryClient.setQueryData(['auth', 'me'], data.user);
      }
    },
  });

  // Signup mutation
  const signupMutation = useMutation({
    mutationFn: async ({
      name,
      email,
      phone,
      password,
    }: {
      name?: string;
      email?: string;
      phone?: string;
      password: string;
    }) => {
      const response = await fetch(`${API_URL}/api/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, email, phone, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Signup failed');
      }

      const data = await response.json() as AuthResponse;
      setToken(data.token);
      return data;
    },
    onSuccess: (data) => {
      if (data.user) {
        setUser(data.user);
        queryClient.setQueryData(['auth', 'me'], data.user);
      }
    },
  });

  // Admin login mutation
  const adminLoginMutation = useMutation({
    mutationFn: async ({ username, password }: { username: string; password: string }) => {
      const response = await fetch(`${API_URL}/api/auth/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Admin login failed');
      }

      const data = await response.json() as AuthResponse;
      setToken(data.token);
      return data;
    },
    onSuccess: () => {
      // Refetch user data
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Delivery login mutation
  const deliveryLoginMutation = useMutation({
    mutationFn: async ({
      phone,
      password,
      fcmToken,
    }: {
      phone: string;
      password: string;
      fcmToken?: string;
    }) => {
      const response = await fetch(`${API_URL}/api/auth/delivery/login-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone, password, fcmToken }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Delivery login failed');
      }

      const data = await response.json() as AuthResponse;
      setToken(data.token);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Delivery signup mutation
  const deliverySignupMutation = useMutation({
    mutationFn: async ({
      name,
      phone,
      password,
      vehicleNumber,
    }: {
      name: string;
      phone: string;
      password: string;
      vehicleNumber?: string;
    }) => {
      const response = await fetch(`${API_URL}/api/auth/delivery/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, phone, password, vehicleNumber }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error.message || 'Delivery signup failed');
      }

      const data = await response.json() as AuthResponse;
      setToken(data.token);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth', 'me'] });
    },
  });

  // Logout function
  const logout = useCallback(() => {
    removeToken();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  // Check if authenticated
  const isAuthenticated = !!user && !!getToken();

  // Check user role
  const hasRole = useCallback(
    (role: string) => {
      return user?.role === role;
    },
    [user]
  );

  return {
    user,
    isLoading: isLoading || isLoadingUser,
    isAuthenticated,
    hasRole,
    login: loginMutation.mutateAsync,
    signup: signupMutation.mutateAsync,
    adminLogin: adminLoginMutation.mutateAsync,
    deliveryLogin: deliveryLoginMutation.mutateAsync,
    deliverySignup: deliverySignupMutation.mutateAsync,
    logout,
    isLoggingIn: loginMutation.isPending,
    isSigningUp: signupMutation.isPending,
    isAdminLoggingIn: adminLoginMutation.isPending,
    isDeliveryLoggingIn: deliveryLoginMutation.isPending,
    isDeliverySigningUp: deliverySignupMutation.isPending,
  };
}

