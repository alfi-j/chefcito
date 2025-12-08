import { create } from 'zustand';

// Simplified Restaurant interface
export interface Restaurant {
  _id?: string;
  id: string;
  name: string;
  ownerId: string;
  createdAt: string | Date;
  updatedAt: string | Date;
}

// Define normalized entities
interface NormalizedEntities {
  restaurants: Record<string, Restaurant>;
}

interface NormalizedState {
  entities: NormalizedEntities;
  currentRestaurantId: string | null;
}

interface NormalizedRestaurantState extends NormalizedState {
  setCurrentRestaurant: (restaurant: Restaurant | null) => void;
  loadRestaurants: () => Promise<void>;
  createRestaurant: (restaurantData: { name: string; ownerId: string }) => Promise<Restaurant>;
  
  // Selector helpers
  getCurrentRestaurant: () => Restaurant | null;
  getRestaurants: () => Restaurant[];
  getRestaurantById: (id: string) => Restaurant | undefined;
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    restaurants: {}
  },
  currentRestaurantId: null
};

export const useNormalizedRestaurantStore = create<NormalizedRestaurantState>()((set, get) => ({
  ...initialState,
  
  setCurrentRestaurant: (restaurant) => {
    if (restaurant) {
      set((state) => ({
        entities: {
          ...state.entities,
          restaurants: {
            ...state.entities.restaurants,
            [restaurant.id]: restaurant
          }
        },
        currentRestaurantId: restaurant.id
      }));
    } else {
      set({ currentRestaurantId: null });
    }
  },
  
  loadRestaurants: async () => {
    try {
      const response = await fetch('/api/restaurants');
      
      // Check if the response is successful
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        // Normalize restaurants
        const restaurants: Record<string, Restaurant> = {};
        result.data.forEach((restaurant: any) => {
          // Ensure dates are properly formatted
          const formattedRestaurant = {
            ...restaurant,
            createdAt: new Date(restaurant.createdAt),
            updatedAt: new Date(restaurant.updatedAt)
          };
          
          restaurants[restaurant.id] = formattedRestaurant;
        });
        
        set((state) => ({
          entities: {
            ...state.entities,
            restaurants
          }
        }));
        
        // Set first restaurant as default if none is selected
        const { currentRestaurantId } = get();
        if (!currentRestaurantId && Object.keys(restaurants).length > 0) {
          const firstRestaurantId = Object.keys(restaurants)[0];
          set({ currentRestaurantId: firstRestaurantId });
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
        const newRestaurant = result.data;
        set((state) => ({
          entities: {
            ...state.entities,
            restaurants: {
              ...state.entities.restaurants,
              [newRestaurant.id]: newRestaurant
            }
          }
        }));
        return newRestaurant;
      } else {
        console.error('Error creating restaurant:', result.error);
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Error creating restaurant:', error);
      throw error;
    }
  },
  
  // Selector helpers
  getCurrentRestaurant: () => {
    const { entities, currentRestaurantId } = get();
    return currentRestaurantId ? entities.restaurants[currentRestaurantId] : null;
  },
  
  getRestaurants: () => {
    const { entities } = get();
    return Object.values(entities.restaurants);
  },
  
  getRestaurantById: (id) => {
    const { entities } = get();
    return entities.restaurants[id];
  }
}));