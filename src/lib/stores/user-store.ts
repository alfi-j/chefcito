import { create } from 'zustand';
import { StaffPerformance } from '@/lib/types';

export type User = StaffPerformance & {
  email: string;
  password: string;
  status: 'On Shift' | 'Off Shift' | 'On Break';
  createdAt?: Date;
  updatedAt?: Date;
}

interface UserState {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateMembership: (membership: 'free' | 'pro') => void;
  updateUserRole: (role: User['role']) => void;
  refreshUser: (currentEmail: string) => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useUserStore = create<UserState>()((set, get) => ({
  user: null,
  
  setUser: (user) => set({ user }),
  
  login: async (email, password) => {
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
        throw new Error(errorData.error || 'Login failed');
      }
      
      const userData = await response.json();
      set({ user: userData.user });
      localStorage.setItem('chefcito-user', JSON.stringify(userData.user));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },
  
  logout: () => {
    set({ user: null });
    localStorage.removeItem('chefcito-user');
  },
  
  updateMembership: (membership) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, membership };
      set({ user: updatedUser });
      localStorage.setItem('chefcito-user', JSON.stringify(updatedUser));
      
      // Also update on the backend
      if (user.id) {
        fetch(`/api/users/${user.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ membership }),
        }).catch(error => {
          console.error('Failed to update membership on backend:', error);
        });
      }
    }
  },
  
  updateUserRole: (role) => {
    const { user } = get();
    if (user) {
      const updatedUser: User = { ...user, role };
      set({ user: updatedUser });
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
  },
  
  refreshUser: async (currentEmail) => {
    try {
      const response = await fetch(`/api/users/login?email=${encodeURIComponent(currentEmail)}`);
      if (response.ok) {
        const userData = await response.json();
        set({ user: userData });
        localStorage.setItem(`chefcito-user-${currentEmail}`, JSON.stringify(userData));
      }
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  },
}));