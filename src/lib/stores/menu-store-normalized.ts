import { create } from 'zustand';
import { type MenuItem, type Category } from '@/lib/types';
import { toast } from 'sonner';

// Define normalized entities
interface NormalizedEntities {
  menuItems: Record<string, MenuItem>;
  categories: Record<number, Category>;
}

interface NormalizedState {
  entities: NormalizedEntities;
}

interface NormalizedMenuState extends NormalizedState {
  loading: boolean;
  error: string | null;
  
  // Menu item actions
  addMenuItem: (itemData: Omit<MenuItem, 'id'>) => Promise<MenuItem | null>;
  updateMenuItem: (id: string, itemData: Partial<MenuItem>) => Promise<boolean>;
  deleteMenuItem: (id: string) => Promise<boolean>;
  
  // Category actions
  addCategory: (categoryData: Omit<Category, 'id'>) => Promise<Category | null>;
  updateCategory: (id: number, categoryData: Partial<Category>) => Promise<boolean>;
  deleteCategory: (id: number) => Promise<boolean>;
  isCategoryInUse: (id: number) => Promise<boolean>;
  
  // Data fetching
  fetchMenuData: () => Promise<void>;
  
  // Selector helpers
  getMenuItems: () => MenuItem[];
  getCategories: () => Category[];
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    menuItems: {},
    categories: {}
  }
};

export const useNormalizedMenuStore = create<NormalizedMenuState>()((set, get) => ({
  ...initialState,
  loading: false,
  error: null,
  
  addMenuItem: async (itemData) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'addMenuItem', data: itemData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add menu item');
      }
      
      const newItem = await response.json();
      set((state) => ({
        entities: {
          ...state.entities,
          menuItems: {
            ...state.entities.menuItems,
            [newItem.id]: newItem
          }
        }
      }));
      
      toast.success('Menu item added successfully');
      return newItem;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add menu item';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return null;
    }
  },
  
  updateMenuItem: async (id, itemData) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'updateMenuItem', id, data: itemData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update menu item');
      }
      
      const updatedItem = await response.json();
      set((state) => ({
        entities: {
          ...state.entities,
          menuItems: {
            ...state.entities.menuItems,
            [id]: updatedItem
          }
        }
      }));
      
      toast.success('Menu item updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update menu item';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  deleteMenuItem: async (id) => {
    try {
      const response = await fetch('/api/menu', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'deleteMenuItem', id }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete menu item');
      }
      
      set((state) => {
        const newMenuItems = { ...state.entities.menuItems };
        delete newMenuItems[id];
        
        return {
          entities: {
            ...state.entities,
            menuItems: newMenuItems
          }
        };
      });
      
      toast.success('Menu item deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete menu item';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  addCategory: async (categoryData) => {
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'addCategory', data: categoryData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to add category');
      }
      
      const newCategory = await response.json();
      set((state) => ({
        entities: {
          ...state.entities,
          categories: {
            ...state.entities.categories,
            [newCategory.id]: newCategory
          }
        }
      }));
      
      toast.success('Category added successfully');
      return newCategory;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add category';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return null;
    }
  },
  
  updateCategory: async (id, categoryData) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ data: categoryData }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update category');
      }
      
      set((state) => ({
        entities: {
          ...state.entities,
          categories: {
            ...state.entities.categories,
            [id]: { 
              ...(state.entities.categories[id] || {}),
              ...categoryData 
            }
          }
        }
      }));
      
      toast.success('Category updated successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update category';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  deleteCategory: async (id) => {
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete category');
      }
      
      set((state) => {
        const newCategories = { ...state.entities.categories };
        delete newCategories[id];
        
        return {
          entities: {
            ...state.entities,
            categories: newCategories
          }
        };
      });
      
      toast.success('Category deleted successfully');
      return true;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete category';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage });
      return false;
    }
  },
  
  isCategoryInUse: async (id) => {
    try {
      // This would typically be implemented on the backend
      // For now, we'll check if any menu items are using this category
      const { entities } = get();
      return Object.values(entities.menuItems).some((item) => item.category === id.toString());
    } catch (error) {
      return false;
    }
  },
  
  fetchMenuData: async () => {
    set({ loading: true, error: null });
    
    try {
      // Fetch menu items
      const menuItemsResponse = await fetch('/api/menu');
      const menuItemsResult = await menuItemsResponse.json();
      
      // Fetch categories
      const categoriesResponse = await fetch('/api/categories');
      const categoriesResult = await categoriesResponse.json();
      
      if (menuItemsResult.success && categoriesResult.success) {
        // Normalize menu items
        const menuItems: Record<string, MenuItem> = {};
        menuItemsResult.data.forEach((item: MenuItem) => {
          menuItems[item.id] = item;
        });
        
        // Normalize categories
        const categories: Record<number, Category> = {};
        categoriesResult.data.forEach((category: Category) => {
          categories[category.id] = category;
        });
        
        set({
          entities: {
            ...get().entities,
            menuItems,
            categories
          },
          loading: false,
        });
      } else {
        throw new Error(
          menuItemsResult.error || categoriesResult.error || 'Failed to fetch menu data'
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch menu data';
      toast.error('Error', {
        description: errorMessage,
        duration: 3000,
      });
      set({ error: errorMessage, loading: false });
    }
  },
  
  // Selector helpers
  getMenuItems: () => {
    const { entities } = get();
    return Object.values(entities.menuItems);
  },
  
  getCategories: () => {
    const { entities } = get();
    return Object.values(entities.categories);
  }
}));