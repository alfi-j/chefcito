import { create } from 'zustand';
import { StaffPerformance } from '@/lib/types';

// Simplified User interface without Mongoose document methods
interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Owner' | 'Admin' | 'Staff' | string; // Extended to support custom roles
  status: 'On Shift' | 'Off Shift' | 'On Break';
  membership: 'free' | 'pro';
  createdAt?: Date;
  updatedAt?: Date;
  [key: string]: any; // Allow additional properties
}

// Define normalized entities
interface NormalizedEntities {
  users: Record<string, User>;
}

interface NormalizedState {
  entities: NormalizedEntities;
  currentUserId: string | null;
}

interface NormalizedUserState extends NormalizedState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  updateMembership: (userId: string, membership: 'free' | 'pro') => void;
  updateUserRole: (userId: string, role: 'Owner' | 'Admin' | 'Staff' | string) => void;
  refreshUser: (currentEmail: string) => Promise<void>;
  setUser: (user: User | null) => void;
  
  // Selector helpers
  getCurrentUser: () => User | null;
  getUserById: (id: string) => User | undefined;
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    users: {}
  },
  currentUserId: null
};

export const useNormalizedUserStore = create<NormalizedUserState>()((set, get) => ({
  ...initialState,
  
  setUser: (user) => {
    if (user) {
      set((state) => ({
        entities: {
          ...state.entities,
          users: {
            ...state.entities.users,
            [user.id]: user
          }
        },
        currentUserId: user.id
      }));
      localStorage.setItem('chefcito-user', JSON.stringify(user));
    } else {
      set({ currentUserId: null });
      localStorage.removeItem('chefcito-user');
    }
  },
  
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
      // Create a plain object from the user data to avoid Mongoose document issues
      const plainUser = JSON.parse(JSON.stringify(userData.user));
      set((state) => ({
        entities: {
          ...state.entities,
          users: {
            ...state.entities.users,
            [userData.user.id]: plainUser
          }
        },
        currentUserId: userData.user.id
      }));
      localStorage.setItem('chefcito-user', JSON.stringify(plainUser));
      return true;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  },
  
  logout: () => {
    set({ currentUserId: null });
    localStorage.removeItem('chefcito-user');
  },
  
  updateMembership: (userId, membership) => {
    set((state) => {
      const user = state.entities.users[userId];
      if (user) {
        const updatedUser = { ...user, membership };
        return {
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userId]: updatedUser
            }
          }
        };
      }
      return state;
    });
    
    // Also update on the backend
    fetch(`/api/users/${userId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ membership }),
    }).catch(error => {
      console.error('Failed to update membership on backend:', error);
    });
  },
  
  updateUserRole: (userId, role) => {
    set((state) => {
      const user = state.entities.users[userId];
      if (user) {
        const updatedUser = { ...user, role };
        return {
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userId]: updatedUser
            }
          }
        };
      }
      return state;
    });
    
    // Also update on the backend
    fetch(`/api/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ role }),
    }).catch(error => {
      console.error('Failed to update role on backend:', error);
    });
  },
  
  refreshUser: async (currentEmail) => {
    try {
      const response = await fetch(`/api/users/login?email=${encodeURIComponent(currentEmail)}`);
      if (response.ok) {
        const userData = await response.json();
        // Create a plain object from the user data to avoid Mongoose document issues
        const plainUser = JSON.parse(JSON.stringify(userData));
        set((state) => ({
          entities: {
            ...state.entities,
            users: {
              ...state.entities.users,
              [userData.id]: plainUser
            }
          },
          currentUserId: userData.id
        }));
        localStorage.setItem(`chefcito-user-${currentEmail}`, JSON.stringify(plainUser));
      }
    } catch (e) {
      console.error('Failed to refresh user data', e);
    }
  },
  
  // Selector helpers
  getCurrentUser: () => {
    const { entities, currentUserId } = get();
    return currentUserId ? entities.users[currentUserId] : null;
  },
  
  getUserById: (id) => {
    const { entities } = get();
    return entities.users[id];
  }
}));