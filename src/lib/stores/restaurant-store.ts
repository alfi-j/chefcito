import { create } from 'zustand';

export interface Restaurant {
  _id?: string;
  id: string;
  name: string;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

interface RestaurantState {
  currentRestaurant: Restaurant | null;
  restaurants: Restaurant[];
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  loadRestaurants: () => Promise<void>;
  createRestaurant: (restaurantData: { name: string; ownerId: string }) => Promise<Restaurant>;
}

export const useRestaurantStore = create<RestaurantState>()((set, get) => ({
  currentRestaurant: null,
  restaurants: [],
  
  setCurrentRestaurant: (restaurant) => set({ currentRestaurant: restaurant }),
  
  loadRestaurants: async () => {
    try {
      const response = await fetch('/api/restaurants');
      
      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Ensure dates are properly formatted
        const formattedRestaurants = result.data.map((restaurant: any) => ({
          ...restaurant,
          createdAt: new Date(restaurant.createdAt),
          updatedAt: new Date(restaurant.updatedAt)
        }));
        
        set({ restaurants: formattedRestaurants });
        
        // Set first restaurant as default if none is selected
        const { currentRestaurant } = get();
        if (!currentRestaurant && formattedRestaurants.length > 0) {
          set({ currentRestaurant: formattedRestaurants[0] });
        }
      } else {
        console.error('Error loading restaurants:', result.error);
      }
    } catch (error) {
      console.error('Error loading restaurants:', error);
    }
  },
  
  createRestaurant: async (restaurantData) => {
    try {
      const response = await fetch('/api/restaurants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restaurantData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        set((state) => ({ 
          restaurants: [...state.restaurants, result.data] 
        }));
        return result.data;
      } else {
        console.error('Error creating restaurant:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  },
}));