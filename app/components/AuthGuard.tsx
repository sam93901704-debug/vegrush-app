'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  redirectTo?: string;
}

/**
 * AuthGuard component - Protects routes based on authentication and role
 * 
 * @param children - Content to render if authenticated
 * @param requiredRole - Required role (e.g., 'admin', 'delivery')
 * @param redirectTo - Redirect path if not authenticated (default: '/auth/login')
 */
export function AuthGuard({ children, requiredRole, redirectTo }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, hasRole, user } = useAuth();

  useEffect(() => {
    if (isLoading) return; // Wait for auth check

    if (!isAuthenticated) {
      // Not authenticated - redirect to login
      const loginPath = redirectTo || '/auth/login';
      router.push(loginPath);
      return;
    }

    if (requiredRole && !hasRole(requiredRole)) {
      // Wrong role - redirect based on role
      if (requiredRole === 'admin') {
        router.push('/admin/login');
      } else if (requiredRole === 'delivery') {
        router.push('/delivery');
      } else {
        router.push('/auth/login');
      }
      return;
    }
  }, [isAuthenticated, isLoading, hasRole, requiredRole, router, redirectTo, pathname]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Not authenticated or wrong role - don't render children
  if (!isAuthenticated || (requiredRole && !hasRole(requiredRole))) {
    return null;
  }

  // Authenticated and correct role - render children
  return <>{children}</>;
}

