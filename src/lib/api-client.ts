import { 
  type MenuItem, 
  type Category, 
  type PaymentMethod, 
  type Customer, 
  type InventoryItem,
  type Order,
  type Staff,
  type Task
} from '@/lib/types';

// Generic fetch helper with error handling
const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = `/api${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
    },
    ...options,
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ 
      error: `HTTP error! status: ${response.status}`,
      status: response.status
    }));
    
    // Enhanced error messages for common issues
    switch (response.status) {
      case 400:
        throw new Error(`Bad Request: ${errorData.error || 'Invalid data provided'}`);
      case 404:
        throw new Error(`Not Found: ${errorData.error || 'Resource not found'}`);
      case 500:
        throw new Error(`Server Error: ${errorData.error || 'Internal server error'}`);
      default:
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
  }
  
  return response.json();
};

// Categories API
export const categoriesApi = {
  getAll: (): Promise<Category[]> => apiFetch('/categories'),
  create: (category: Omit<Category, 'id'>): Promise<Category> => 
    apiFetch('/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    }),
  update: (category: Category): Promise<Category> => 
    apiFetch(`/categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    }),
  delete: (id: number): Promise<void> => 
    apiFetch(`/categories/${id}`, {
      method: 'DELETE',
    }),
};

// Menu Items API
export const menuItemsApi = {
  getAll: (): Promise<MenuItem[]> => apiFetch('/menu-items'),
  create: (item: Omit<MenuItem, 'id'>): Promise<MenuItem> => 
    apiFetch('/menu-items', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  update: (item: MenuItem): Promise<MenuItem> => 
    apiFetch(`/menu-items/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/menu-items/${id}`, {
      method: 'DELETE',
    }),
};

// Tasks API
export const tasksApi = {
  getAll: (): Promise<Task[]> => apiFetch('/tasks'),
  create: (task: Omit<Task, 'id'>): Promise<Task> => 
    apiFetch('/tasks', {
      method: 'POST',
      body: JSON.stringify(task),
    }),
  update: (task: Task): Promise<Task> => 
    apiFetch(`/tasks/${task.id}`, {
      method: 'PUT',
      body: JSON.stringify(task),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/tasks/${id}`, {
      method: 'DELETE',
    }),
};

// Payment Methods API
export const paymentMethodsApi = {
  getAll: (): Promise<PaymentMethod[]> => apiFetch('/payment-methods'),
  create: (paymentMethod: Omit<PaymentMethod, 'id'>): Promise<PaymentMethod> => 
    apiFetch('/payment-methods', {
      method: 'POST',
      body: JSON.stringify(paymentMethod),
    }),
  update: (paymentMethod: PaymentMethod): Promise<PaymentMethod> => 
    apiFetch(`/payment-methods/${paymentMethod.id}`, {
      method: 'PUT',
      body: JSON.stringify(paymentMethod),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/payment-methods/${id}`, {
      method: 'DELETE',
    }),
};

// Customers API
export const customersApi = {
  getAll: (): Promise<Customer[]> => apiFetch('/customers'),
  create: (customer: Omit<Customer, 'id'>): Promise<Customer> => 
    apiFetch('/customers', {
      method: 'POST',
      body: JSON.stringify(customer),
    }),
  update: (customer: Customer): Promise<Customer> => 
    apiFetch(`/customers/${customer.id}`, {
      method: 'PUT',
      body: JSON.stringify(customer),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/customers/${id}`, {
      method: 'DELETE',
    }),
};

// Inventory API
export const inventoryApi = {
  getAll: (): Promise<InventoryItem[]> => apiFetch('/inventory'),
  create: (item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> => 
    apiFetch('/inventory', {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  update: (item: InventoryItem): Promise<InventoryItem> => 
    apiFetch(`/inventory/${item.id}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/inventory/${id}`, {
      method: 'DELETE',
    }),
};

// Orders API
export const ordersApi = {
  getAll: (status?: string): Promise<Order[]> => {
    const query = status ? `?status=${status}` : '';
    return apiFetch(`/orders${query}`);
  },
  create: (order: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<Order> => 
    apiFetch('/orders', {
      method: 'POST',
      body: JSON.stringify(order),
    }),
  update: (order: Partial<Order> & { id: string }): Promise<Order> => 
    apiFetch(`/orders/${order.id}`, {
      method: 'PUT',
      body: JSON.stringify(order),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/orders/${id}`, {
      method: 'DELETE',
    }),
};

// Staff API
export const staffApi = {
  getAll: (): Promise<Staff[]> => apiFetch('/staff'),
  create: (staff: Omit<Staff, 'id'>): Promise<Staff> => 
    apiFetch('/staff', {
      method: 'POST',
      body: JSON.stringify(staff),
    }),
  update: (staff: Staff): Promise<Staff> => 
    apiFetch(`/staff/${staff.id}`, {
      method: 'PUT',
      body: JSON.stringify(staff),
    }),
  delete: (id: string): Promise<void> => 
    apiFetch(`/staff/${id}`, {
      method: 'DELETE',
    }),
};
