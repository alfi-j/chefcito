import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { Order, OrderItem } from '@/lib/types';
import { type IWorkstation } from '@/models/Workstation';
import { DragEvent } from 'react';
import { KDS_STATES } from '@/lib/constants';
import { debugKDS } from '@/lib/helpers';

// Define normalized entities
interface NormalizedEntities {
  orders: Record<number, Order>;
  workstations: Record<string, IWorkstation>;
}

interface NormalizedState {
  entities: NormalizedEntities;
  activeTab: string;
  draggedOrderId: number | null;
  dragOverOrderId: number | null;
}

interface NormalizedKDSState extends NormalizedState {
  // Actions
  setWorkstations: (workstations: IWorkstation[]) => void;
  setOrders: (orders: Order[]) => void;
  setActiveTab: (tab: string) => void;
  setDraggedOrderId: (id: number | null) => void;
  setDragOverOrderId: (id: number | null) => void;
  
  // Transition system
  transitionItem: (orderId: number, itemId: string, targetWorkstation: string) => Promise<boolean>;
  updateItemStatus: (orderId: number, itemId: string, fromStatus: string) => Promise<void>;
  revertItemStatus: (orderId: number, itemId: string, toStatus: string) => Promise<void>;
  togglePinOrder: (orderId: number) => Promise<void>;
  
  // Workstation management
  getWorkstationById: (id: string) => IWorkstation | undefined;
  getWorkstationIndex: (id: string) => number;
  getNextWorkstation: (currentWorkstationId: string) => IWorkstation | undefined;
  getPreviousWorkstation: (currentWorkstationId: string) => IWorkstation | undefined;
  
  // Order management
  getOrderByID: (id: number) => Order | undefined;
  getItemsByWorkstation: (orderId: number, workstationId: string) => OrderItem[];
  reorderOrderItems: (orderId: number, itemPositions: { itemId: string; position: number }[]) => Promise<boolean>;
  
  // Drag and drop
  handleDragStart: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  handleDragEnd: () => void;
  handleDrop: (e: DragEvent<HTMLDivElement>, dropOrderId: number) => Promise<void>;
  handleDragEnter: (e: DragEvent<HTMLDivElement>, orderId: number) => void;
  
  // Selector helpers
  getWorkstations: () => IWorkstation[];
  getSortedWorkstations: () => IWorkstation[];
  getOrders: () => Order[];
}

// Initial state
const initialState: NormalizedState = {
  entities: {
    orders: {},
    workstations: {}
  },
  activeTab: "",
  draggedOrderId: null,
  dragOverOrderId: null
};

const useNormalizedKDSStore = create<NormalizedKDSState>()(
  devtools((set, get) => ({
    ...initialState,
    
    // Actions
    setWorkstations: (workstations) => {
      // Normalize workstations
      const normalizedWorkstations: Record<string, IWorkstation> = {};
      workstations.forEach(ws => {
        normalizedWorkstations[ws.id] = ws;
      });
      
      set((state) => ({
        entities: {
          ...state.entities,
          workstations: normalizedWorkstations
        }
      }));
    },
    
    setOrders: (orders) => {
      // Normalize orders
      const normalizedOrders: Record<number, Order> = {};
      orders.forEach(order => {
        normalizedOrders[order.id] = order;
      });
      
      set((state) => ({
        entities: {
          ...state.entities,
          orders: normalizedOrders
        }
      }));
    },
    
    setActiveTab: (tab) => set({ activeTab: tab }),
    setDraggedOrderId: (id) => set({ draggedOrderId: id }),
    setDragOverOrderId: (id) => set({ dragOverOrderId: id }),
    
    // Getters
    getWorkstationById: (id) => {
      return get().entities.workstations[id];
    },
    
    getWorkstationIndex: (id) => {
      const workstations = Object.values(get().entities.workstations);
      // Sort workstations by position before finding index
      const sortedWorkstations = [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      // Find workstation by id or fallback to matching by _id if id is undefined
      return sortedWorkstations.findIndex(ws => 
        ws.id === id || (ws._id && ws._id.toString() === id)
      );
    },
    
    getNextWorkstation: (currentWorkstationId) => {
      const workstations = Object.values(get().entities.workstations);
      // Sort workstations by position
      const sortedWorkstations = [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      // Find current workstation by id or fallback to matching by _id if id is undefined
      const currentIndex = sortedWorkstations.findIndex(ws => 
        ws.id === currentWorkstationId || (ws._id && ws._id.toString() === currentWorkstationId)
      );
      if (currentIndex < 0 || currentIndex >= sortedWorkstations.length - 1) {
        return undefined;
      }
      return sortedWorkstations[currentIndex + 1];
    },
    
    getPreviousWorkstation: (currentWorkstationId) => {
      const workstations = Object.values(get().entities.workstations);
      // Sort workstations by position
      const sortedWorkstations = [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      // Find current workstation by id or fallback to matching by _id if id is undefined
      const currentIndex = sortedWorkstations.findIndex(ws => 
        ws.id === currentWorkstationId || (ws._id && ws._id.toString() === currentWorkstationId)
      );
      if (currentIndex <= 0) {
        return undefined;
      }
      return sortedWorkstations[currentIndex - 1];
    },
    
    getOrderByID: (id) => {
      return get().entities.orders[id];
    },
    
    getItemsByWorkstation: (orderId, workstationId) => {
      const order = get().entities.orders[orderId];
      if (!order) return [];
      
      return order.items.filter(item => item.workstationId === workstationId);
    },
    
    // Item reordering
    reorderOrderItems: async (orderId, itemPositions) => {
      const { entities, setOrders } = get();
      
      try {
        // Find the order
        const order = entities.orders[orderId];
        if (!order) return false;
        
        // Optimistically update the UI
        const updatedOrder = {
          ...order,
          items: order.items.map(item => {
            const positionUpdate = itemPositions.find(p => p.itemId === item.id);
            if (positionUpdate) {
              return { ...item, position: positionUpdate.position };
            }
            return item;
          })
        };
        
        set((state) => ({
          entities: {
            ...state.entities,
            orders: {
              ...state.entities.orders,
              [orderId]: updatedOrder
            }
          }
        }));
        
        // Send the update to the backend
        const response = await fetch(`/api/orders`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'updateItemPositions',
            orderId,
            positions: itemPositions
          }),
        });
        
        if (!response.ok) {
          // Rollback optimistic update on failure
          set((state) => ({
            entities: {
              ...state.entities,
              orders: {
                ...state.entities.orders,
                [orderId]: order
              }
            }
          }));
          throw new Error('Failed to update item positions');
        }
        
        return true;
      } catch (error) {
        console.error('Error updating item positions:', error);
        return false;
      }
    },
    
    // Transition system - NEW STATE MACHINE APPROACH
    transitionItem: async (orderId, itemId, targetWorkstation) => {
      const { entities, setOrders } = get();
      const workstations = Object.values(entities.workstations);
      // Sort workstations by position
      const sortedWorkstations = [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      const orders = Object.values(entities.orders);
      
      try {
        // Validate target workstation exists
        const targetWs = sortedWorkstations.find(ws => ws.id === targetWorkstation);
        if (!targetWs) {
          console.error(`Target workstation ${targetWorkstation} not found`);
          return false;
        }
        
        // Find the order and item
        const order = entities.orders[orderId];
        if (!order) {
          console.error(`Order ${orderId} not found`);
          return false;
        }
        
        const itemIndex = order.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) {
          console.error(`Item ${itemId} not found in order ${orderId}`);
          return false;
        }
        
        const item = order.items[itemIndex];
        
        // Validate transition respects configured workstation order
        // Find current workstation by id or fallback to matching by _id if id is undefined
        const currentItemWsIndex = sortedWorkstations.findIndex(ws => 
          ws.id === item.workstationId || (ws._id && ws._id.toString() === item.workstationId)
        );
        const targetWsIndex = sortedWorkstations.findIndex(ws => ws.id === targetWorkstation);
        
        // Items can only move forward in the workstation chain or stay in the same workstation
        if (targetWsIndex < currentItemWsIndex) {
          console.error(`Invalid transition: cannot move item backwards from ${item.workstationId} to ${targetWorkstation}`);
          return false;
        }
        
        // Optimistically update the UI
        const updatedOrder = {
          ...order,
          items: order.items.map((item, idx) => 
            idx === itemIndex ? { ...item, workstationId: targetWorkstation, status: 'New' } : item  // Set status to 'New' when moving to new workstation
          )
        };
        
        set((state) => ({
          entities: {
            ...state.entities,
            orders: {
              ...state.entities.orders,
              [orderId]: updatedOrder
            }
          }
        }));
        
        const response = await fetch(`/api/orders`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            itemId,
            status: 'New', // When transitioning to a new workstation, status should be 'New'
            moveToNextWorkstation: item.workstationId !== targetWorkstation,
            nextWorkstationId: targetWorkstation
          }),
        });
        
        if (!response.ok) {
          // Rollback optimistic update on failure
          set((state) => ({
            entities: {
              ...state.entities,
              orders: {
                ...state.entities.orders,
                [orderId]: order
              }
            }
          }));
          throw new Error('Failed to transition item');
        }
        
        return true;
      } catch (error) {
        console.error('Error transitioning item:', error);
        return false;
      }
    },
    
    updateItemStatus: async (orderId, itemId, fromStatus) => {
      const { entities, setOrders, getWorkstationById, getNextWorkstation } = get();
      const workstations = Object.values(entities.workstations);
      // Sort workstations by position
      const sortedWorkstations = [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
      
      try {
        // Find the order and item to get current workstation
        const order = entities.orders[orderId];
        if (!order) return;
        
        const itemIndex = order.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;
        
        const item = order.items[itemIndex];
        
        // Get current workstation from item's workstationId
        const currentWorkstation = item.workstationId 
          ? getWorkstationById(item.workstationId) 
          : sortedWorkstations[0]; // Default to first workstation
          
        // Check if current workstation is the Ready workstation (last in workflow)
        // Find current workstation by id or fallback to matching by _id if id is undefined
        const currentWsIndex = sortedWorkstations.findIndex(ws => 
          ws.id === item.workstationId || (ws._id && ws._id.toString() === item.workstationId)
        );
        const isLastWorkstation = currentWsIndex === sortedWorkstations.length - 1;
        const isInReadyWorkstation = isLastWorkstation; // Last workstation is always the Ready workstation
        
        // Normalize the fromStatus for comparison
        const normalizedFromStatus = fromStatus?.toString().toLowerCase();
        const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
        const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
        const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
        
        // Determine next status and if we should move to next workstation
        let status = fromStatus;
        let moveToNextWorkstation = false;
        let nextWorkstationId: string | undefined = undefined;
        
        // Handle status transitions
        if (normalizedFromStatus === kdsNew || normalizedFromStatus === 'new') {
          // New → In Progress (same workstation)
          status = 'In Progress';
        } else if (normalizedFromStatus === kdsInProgress || normalizedFromStatus === 'in-progress') {
          // In Progress → Advance to next workstation
          moveToNextWorkstation = true;
          // Set next workstation if available
          const nextWorkstation = item.workstationId ? getNextWorkstation(item.workstationId) : sortedWorkstations[1];
          if (nextWorkstation) {
            nextWorkstationId = nextWorkstation.id;
          }
          status = 'New'; // Reset status to New in the next workstation
        } else if (normalizedFromStatus === kdsReady || normalizedFromStatus === 'ready') {
          // Ready items should move to next workstation unless in the last workstation
          if (!isLastWorkstation) {
            // Move to next workstation and reset to New
            moveToNextWorkstation = true;
            const nextWorkstation = item.workstationId ? getNextWorkstation(item.workstationId) : sortedWorkstations[1];
            if (nextWorkstation) {
              nextWorkstationId = nextWorkstation.id;
            }
            status = 'New'; // Reset status to New in the next workstation
          } else {
            // Actually last workstation: keep as Ready
            status = 'Ready';
            moveToNextWorkstation = false;
            nextWorkstationId = undefined;
          }
        }
        
        // Special case: If trying to set a non-Ready status on an item in the Ready workstation, reject it
        if (isInReadyWorkstation && status !== 'Ready') {
          console.warn('Cannot set non-Ready status on item in Ready workstation');
          return;
        }
        
        // Optimistically update the UI
        const updatedOrder = {
          ...order,
          items: order.items.map((item, idx) => {
            if (idx === itemIndex) {
              const updatedItem = { ...item, status };
              // If moving to next workstation, update workstationId as well
              if (moveToNextWorkstation && nextWorkstationId) {
                updatedItem.workstationId = nextWorkstationId;
                updatedItem.status = 'New'; // Make sure status is 'New' in new workstation
              }
              return updatedItem;
            }
            return item;
          })
        };
        
        set((state) => ({
          entities: {
            ...state.entities,
            orders: {
              ...state.entities.orders,
              [orderId]: updatedOrder
            }
          }
        }));
        
        // Send the update to the backend
        const response = await fetch(`/api/orders`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            itemId,
            status: moveToNextWorkstation ? 'New' : status, // If moving, send 'New' as the final status
            moveToNextWorkstation,
            nextWorkstationId
          }),
        });
        
        if (!response.ok) {
          // Rollback optimistic update on failure
          set((state) => ({
            entities: {
              ...state.entities,
              orders: {
                ...state.entities.orders,
                [orderId]: order
              }
            }
          }));
          
          // Try to parse error message
          let errorMessage = 'Failed to update item status';
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // Use default error message
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error updating item status:', error);
      }
    },

    revertItemStatus: async (orderId, itemId, toStatus) => {
      const { entities, setOrders, getWorkstationById, getPreviousWorkstation } = get();
      const orders = Object.values(entities.orders);
      
      try {
        // Find the order and item
        const order = entities.orders[orderId];
        if (!order) return;
        
        const itemIndex = order.items.findIndex(i => i.id === itemId);
        if (itemIndex === -1) return;
        
        const item = order.items[itemIndex];
        let status = toStatus; // Make status mutable
        
        // Get workstation details
        const workstation = item.workstationId ? getWorkstationById(item.workstationId) : null;
        const workstations = Object.values(get().entities.workstations);
        // Sort workstations by position
        const sortedWorkstations = [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        // Find current workstation by id or fallback to matching by _id if id is undefined
        const currentWsIndex = sortedWorkstations.findIndex(ws => 
          ws.id === item.workstationId || (ws._id && ws._id.toString() === item.workstationId)
        );
        const isLastWorkstation = currentWsIndex === sortedWorkstations.length - 1;
        const isInReadyWorkstation = isLastWorkstation; // Last workstation is always the Ready workstation
        
        // Special handling for rollback from Ready workstation or when explicitly moving to previous workstation
        let moveToPreviousWorkstation = false;
        let previousWorkstationId: string | undefined = undefined;
        
        // Check if we're moving to previous workstation (when we have a previous workstation)
        const previousWorkstation = item.workstationId ? getPreviousWorkstation(item.workstationId) : undefined;
        
        // Only move to previous workstation if explicitly requested (we're rolling back from Ready status)
        // Otherwise, just change the status within the current workstation
        const normalizedItemStatus = item.status?.toString().toLowerCase();
        const normalizedTargetStatus = status?.toString().toLowerCase();
        const kdsNew = KDS_STATES.NEW?.toString().toLowerCase();
        const kdsReady = KDS_STATES.READY?.toString().toLowerCase();
        const kdsInProgress = KDS_STATES.IN_PROGRESS?.toString().toLowerCase();
        
        // Check if we're rolling back from Ready status to In Progress
        if (previousWorkstation && 
            (normalizedItemStatus === kdsReady || normalizedItemStatus === 'ready') &&
            (normalizedTargetStatus === kdsInProgress || normalizedTargetStatus === 'in-progress')) {
          // When rolling back from Ready status, move to previous workstation with In Progress status
          moveToPreviousWorkstation = true;
          previousWorkstationId = previousWorkstation.id;
          // Override status to In Progress when moving to previous workstation
          status = 'In Progress';
        } 
        // Check if we're rolling back from New status to previous workstation
        else if (previousWorkstation && 
                 (normalizedItemStatus === kdsNew || normalizedItemStatus === 'new') &&
                 (normalizedTargetStatus === kdsInProgress || normalizedTargetStatus === 'in-progress')) {
          // When rolling back from New status, move to previous workstation with In Progress status
          moveToPreviousWorkstation = true;
          previousWorkstationId = previousWorkstation.id;
          // Override status to In Progress when moving to previous workstation
          status = 'In Progress';
        } else if (isInReadyWorkstation) {
          // Special case: When in Ready workstation and not moving to previous workstation
          // Special case: If trying to set a non-Ready status on an item in the Ready workstation (and not moving), reject it
          if (status !== 'Ready' && !moveToPreviousWorkstation) {
            console.warn('Cannot set non-Ready status on item in Ready workstation');
            return;
          }
        }
        
        // Removed duplicate check - already handled above
        
        // Optimistically update the UI
        const updatedOrder = {
          ...order,
          items: order.items.map((item, idx) => {
            if (idx === itemIndex) {
              const updatedItem = { ...item, status };
              // If moving to previous workstation, update workstationId as well
              if (moveToPreviousWorkstation && previousWorkstationId) {
                updatedItem.workstationId = previousWorkstationId;
                updatedItem.status = 'In Progress'; // When moving back, set to 'In Progress'
              }
              return updatedItem;
            }
            return item;
          })
        };
        
        set((state) => ({
          entities: {
            ...state.entities,
            orders: {
              ...state.entities.orders,
              [orderId]: updatedOrder
            }
          }
        }));
        
        const response = await fetch(`/api/orders`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            orderId,
            itemId,
            status,
            moveToNextWorkstation: false, // Explicitly set to false when reverting
            moveToPreviousWorkstation, // New flag for moving to previous workstation
            nextWorkstationId: undefined,
            previousWorkstationId // Pass previous workstation ID
          }),
        });
        
        if (!response.ok) {
          // Rollback optimistic update on failure
          set((state) => ({
            entities: {
              ...state.entities,
              orders: {
                ...state.entities.orders,
                [orderId]: order
              }
            }
          }));
          
          // Try to parse error message
          let errorMessage = 'Failed to revert item status';
          try {
            const errorData = await response.json();
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (e) {
            // Use default error message
          }
          
          throw new Error(errorMessage);
        }
      } catch (error) {
        console.error('Error reverting item status:', error);
      }
    },

    togglePinOrder: async (orderId) => {
      const { entities, setOrders } = get();
      const orders = Object.values(entities.orders);
      
      try {
        // Find the order
        const order = entities.orders[orderId];
        if (!order) return;
        
        // Optimistically update the UI
        const updatedOrder = {
          ...order,
          isPinned: !order.isPinned
        };
        
        set((state) => ({
          entities: {
            ...state.entities,
            orders: {
              ...state.entities.orders,
              [orderId]: updatedOrder
            }
          }
        }));
        
        const response = await fetch(`/api/orders/${orderId}/pin`, {
          method: 'PATCH',
        });
        
        if (!response.ok) {
          // Rollback optimistic update on failure
          set((state) => ({
            entities: {
              ...state.entities,
              orders: {
                ...state.entities.orders,
                [orderId]: order
              }
            }
          }));
          throw new Error('Failed to toggle order pin');
        }
      } catch (error) {
        console.error('Error toggling order pin:', error);
      }
    },
    
    // Drag and drop
    handleDragStart: (e, orderId) => {
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', orderId.toString());
      set({ draggedOrderId: orderId });
    },
    
    handleDragEnd: () => {
      set({ draggedOrderId: null, dragOverOrderId: null });
    },
    
    handleDrop: async (e, dropOrderId) => {
      e.preventDefault();
      const { draggedOrderId, entities } = get();
      const orders = Object.values(entities.orders);
      
      try {
        if (draggedOrderId === null || draggedOrderId === dropOrderId) {
          set({ draggedOrderId: null, dragOverOrderId: null });
          return;
        }
        
        // Find the orders
        const draggedOrder = entities.orders[draggedOrderId];
        const dropOrder = entities.orders[dropOrderId];
        
        if (!draggedOrder || !dropOrder) {
          set({ draggedOrderId: null, dragOverOrderId: null });
          return;
        }
        
        // Optimistically update the UI
        const updatedDraggedOrder = { ...draggedOrder, position: dropOrder.position };
        const updatedDropOrder = { ...dropOrder, position: draggedOrder.position };
        
        set((state) => ({
          entities: {
            ...state.entities,
            orders: {
              ...state.entities.orders,
              [draggedOrderId]: updatedDraggedOrder,
              [dropOrderId]: updatedDropOrder
            }
          }
        }));
        
        const response = await fetch(`/api/orders`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'reorder',
            orderId: draggedOrderId,
            targetOrderId: dropOrderId
          }),
        });
        
        if (!response.ok) {
          // Rollback optimistic update on failure
          set((state) => ({
            entities: {
              ...state.entities,
              orders: {
                ...state.entities.orders,
                [draggedOrderId]: draggedOrder,
                [dropOrderId]: dropOrder
              }
            }
          }));
          throw new Error('Failed to reorder orders');
        }
      } catch (error) {
        console.error('Error reordering orders:', error);
        // Refresh data anyway to maintain consistency
        try {
          const updatedOrdersResponse = await fetch('/api/orders');
          if (updatedOrdersResponse.ok) {
            const updatedOrders = await updatedOrdersResponse.json();
            // Normalize orders
            const normalizedOrders: Record<number, Order> = {};
            updatedOrders.forEach((order: Order) => {
              normalizedOrders[order.id] = order;
            });
            
            set((state) => ({
              entities: {
                ...state.entities,
                orders: normalizedOrders
              }
            }));
          }
        } catch (refreshError) {
          console.error('Error refreshing orders after reorder failure:', refreshError);
        }
      }
      
      set({ draggedOrderId: null, dragOverOrderId: null });
    },
    
    handleDragEnter: (e, orderId) => {
      e.preventDefault();
      const { draggedOrderId, entities } = get();
      const orders = Object.values(entities.orders);
      
      if (draggedOrderId !== orderId) {
        const draggedOrder = entities.orders[draggedOrderId!];
        if (draggedOrder && !draggedOrder.isPinned) {
          set({ dragOverOrderId: orderId });
        }
      }
    },
    
    // Selector helpers
    getWorkstations: () => {
      return Object.values(get().entities.workstations);
    },
    
    getSortedWorkstations: () => {
      const workstations = Object.values(get().entities.workstations);
      // Sort workstations by position
      return [...workstations].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
    },
    
    getOrders: () => {
      return Object.values(get().entities.orders);
    }
  }))
);

export default useNormalizedKDSStore;