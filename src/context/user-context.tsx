"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Staff } from '@/lib/types';

interface UserContextType {
  user: Staff | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateMembership: (membership: 'free' | 'pro') => void;
  updateUserRole: (role: Staff['role']) => void;
  refreshUser: () => void;
};
    
const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Staff | null>(null);

  // Initialize user from localStorage or cookie if available
  useEffect(() => {
    const storedUser = localStorage.getItem('chefcito-user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        console.error('Failed to parse user data', e);
      }
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    // In a real app, this would validate credentials against a backend
    // For now, we'll simulate different user types based on email
    
    try {
      const response = await fetch('/api/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Login failed:', errorData.error);
        return false;
      }

      const data = await response.json();
      setUser(data.user);
      localStorage.setItem('chefcito-user', JSON.stringify(data.user));
      localStorage.setItem('chefcito-token', data.token);
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('chefcito-user');
    localStorage.removeItem('chefcito-token');
  };

  const refreshUser = () => {
    const currentEmail = localStorage.getItem('chefcito-current-user');
    if (currentEmail) {
      const storedUser = localStorage.getItem(`chefcito-user-${currentEmail}`);
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          // Update timestamp and save back to storage
          // Note: lastLogin is not part of the Staff type, so we can't assign it directly
          localStorage.setItem(`chefcito-user-${currentEmail}`, JSON.stringify(parsedUser));
          setUser(parsedUser);
        } catch (e) {
          console.error('Failed to refresh user data', e);
        }
      }
    }
  };

  const updateMembership = (membership: 'free' | 'pro') => {
    if (user) {
      const updatedUser = { ...user, membership };
      setUser(updatedUser);
      localStorage.setItem('chefcito-user', JSON.stringify(updatedUser));
    }
  };

  const updateUserRole = (role: Staff['role']) => {
    if (user) {
      // In a real app, this would update the role on the backend
      const updatedUser = { ...user, role };
      setUser(updatedUser);
      localStorage.setItem('chefcito-user', JSON.stringify(updatedUser));
      
      // Also update on the backend
      if (user.id) {
        fetch(`/api/users/${user.id}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ role }),
        }).catch(error => {
          console.error('Failed to update role on backend:', error);
        });
      }
    }
  };

  const value = {
    user,
    login,
    logout,
    updateMembership,
    updateUserRole,
    refreshUser,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}