"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useUserStore } from "@/lib/stores/user-store";
import { clearSWRCache } from "@/lib/swr-fetcher";
import { AppLayoutContent } from "@/components/layout/app-layout";

// Wrapper function that clears SWR cache on logout
const logoutWithCacheClear = () => {
  clearSWRCache();
  useUserStore.getState().logout();
  console.log('[Auth] Logout completed with cache cleared');
};

export function AuthWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { setUser, getCurrentUser, logout: userLogout } = useUserStore();

  // Load user from localStorage on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('chefcito-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setUser(user);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('chefcito-user');
      }
    }
  }, [setUser]);

  const user = getCurrentUser();
  const isAuthenticated = !!user;

  // Handle authentication redirects
  useEffect(() => {
    if (!isAuthenticated && !pathname.startsWith('/login')) {
      router.push('/login');
    }
  }, [isAuthenticated, pathname, router]);

  // If on login page, just render children without app layout
  if (pathname.startsWith('/login')) {
    return <>{children}</>;
  }

  // If not authenticated, show nothing (redirecting)
  if (!isAuthenticated) {
    return null;
  }

  // Authenticated - render children with app layout
  return <AppLayoutContent>{children}</AppLayoutContent>;
}

export function useAuth() {
  const { getCurrentUser, logout } = useUserStore();
  const user = getCurrentUser();

  return {
    isAuthenticated: !!user,
    user,
    logout: logoutWithCacheClear
  };
}