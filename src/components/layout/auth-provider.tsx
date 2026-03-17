"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useNormalizedUserStore } from "@/lib/stores/user-store-normalized";
import { useAuthStore } from "@/lib/stores/auth-store";
import { AppLayoutContent } from "@/components/layout/app-layout";

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser } = useNormalizedUserStore();
  const { isAuthenticated, isCheckingAuth, initializeAuth } = useAuthStore();

  // Initialize authentication on mount
  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  // Sync user data to user store when authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const storedUser = localStorage.getItem('chefcito-user');
      if (storedUser) {
        try {
          const user = JSON.parse(storedUser);
          setUser(user);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
  }, [isAuthenticated, setUser]);

  // Handle authentication redirects after initial check
  useEffect(() => {
    if (!isCheckingAuth) {
      if (!isAuthenticated && !pathname.startsWith('/login')) {
        router.push('/login');
      }
    }
  }, [isAuthenticated, pathname, router, isCheckingAuth]);

  // Show loading state during authentication check
  if (isCheckingAuth) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If not authenticated and not on login page, show nothing (redirecting)
  if (!isAuthenticated && !pathname.startsWith('/login')) {
    return null;
  }

  // If on login page, just render children without app layout
  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  // Authenticated - render children with app layout
  return <AppLayoutContent>{children}</AppLayoutContent>;
}

export function useAuth() {
  const { isAuthenticated, isCheckingAuth, logout } = useAuthStore();
  
  return {
    isAuthenticated,
    isCheckingAuth,
    logout
  };
}