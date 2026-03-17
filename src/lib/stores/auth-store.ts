import { create } from 'zustand';
import { IUser } from '@/models/User';

// Type alias for cleaner interface
type User = IUser;

interface AuthState {
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  user: User | null;
}

interface AuthActions {
  initializeAuth: () => void;
  setUser: (user: User | null) => void;
  setAuthenticated: (authenticated: boolean) => void;
  setCheckingAuth: (checking: boolean) => void;
  logout: () => void;
}

type AuthStore = AuthState & AuthActions;

// Simple cookie utility
const eraseCookie = (name: string) => {
  document.cookie = name + '=; Max-Age=-99999999; path=/;';
};

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state
  isAuthenticated: false,
  isCheckingAuth: true,
  user: null,

  // Actions
  initializeAuth: () => {
    const storedUser = localStorage.getItem('chefcito-user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        set({
          user,
          isAuthenticated: true,
          isCheckingAuth: false
        });
        console.log('User data initialized from localStorage:', user.email);
      } catch (e) {
        console.error('Error parsing stored user:', e);
        localStorage.removeItem('chefcito-user');
        set({
          isAuthenticated: false,
          isCheckingAuth: false,
          user: null
        });
      }
    } else {
      set({
        isAuthenticated: false,
        isCheckingAuth: false,
        user: null
      });
    }
  },

  setUser: (user) => set({ user }),
  
  setAuthenticated: (authenticated) => set({ isAuthenticated: authenticated }),
  
  setCheckingAuth: (checking) => set({ isCheckingAuth: checking }),

  logout: () => {
    eraseCookie("chefcito-auth");
    localStorage.removeItem('chefcito-user');
    set({
      isAuthenticated: false,
      user: null
    });
  }
}));

// Selector hooks for convenience
export const useIsAuthenticated = () => useAuthStore(state => state.isAuthenticated);
export const useIsCheckingAuth = () => useAuthStore(state => state.isCheckingAuth);
export const useAuthUser = () => useAuthStore(state => state.user);