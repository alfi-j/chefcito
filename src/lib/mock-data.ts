'use server'

import { type MenuItem, type Category, type Order, type OrderItem, type PaymentMethod, type Customer, type InventoryItem, type OrderType, type DeliveryInfo, type Staff, type StaffPerformance, type Task } from './types';
import { query } from './db';

// Helper function to get all menu items for order inflation
const getAllMenuItems = async () => {
    const result = await query('SELECT * FROM menu_items');
    return result.rows as MenuItem[];
}

// Menu Items
export const getMenuItems = async (): Promise<MenuItem[]> => {
    const result = await query('SELECT * FROM menu_items ORDER BY sort_index');
    return result.rows as MenuItem[];
};

export const addMenuItem = async (itemData: Omit<MenuItem, 'id'>) => {
    const result = await query(
        `INSERT INTO menu_items 
        (id, name, price, description, available, category, image_url, ai_hint, linked_modifiers, sort_index) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
            `item_${Date.now()}`, 
            itemData.name, 
            itemData.price, 
            itemData.description, 
            itemData.available !== undefined ? itemData.available : true, 
            itemData.category, 
            itemData.imageUrl, 
            itemData.aiHint, 
            itemData.linkedModifiers || [], 
            itemData.sortIndex || 0
        ]
    );
    return result.rows[0];
};

export const updateMenuItem = async (item: MenuItem) => {
    const result = await query(
        `UPDATE menu_items 
        SET name = $1, price = $2, description = $3, available = $4, category = $5, 
            image_url = $6, ai_hint = $7, linked_modifiers = $8, sort_index = $9
        WHERE id = $10 RETURNING *`,
        [
            item.name, 
            item.price, 
            item.description, 
            item.available, 
            item.category, 
            item.imageUrl, 
            item.aiHint, 
            item.linkedModifiers, 
            item.sortIndex, 
            item.id
        ]
    );
    return result.rows[0];
};

export const deleteMenuItem = async (id: string) => {
    const result = await query('DELETE FROM menu_items WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

export const reorderMenuItems = async (orderedIds: string[]) => {
    // Update sort_index for each item based on its position in the orderedIds array
    const updates = orderedIds.map((id, index) => 
        query('UPDATE menu_items SET sort_index = $1 WHERE id = $2', [index, id])
    );
    await Promise.all(updates);
    return true;
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
    const result = await query('SELECT * FROM categories');
    return result.rows as Category[];
};

export const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    const result = await query(
        `INSERT INTO categories 
        (id, name, is_modifier_group, linked_modifiers, parent_id) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
            categoryData.name.toLowerCase().replace(/\s+/g, '-'), 
            categoryData.name, 
            categoryData.isModifierGroup || false, 
            categoryData.linkedModifiers || [], 
            categoryData.parentId
        ]
    );
    return result.rows[0];
};

export const updateCategory = async (category: Category) => {
    const result = await query(
        `UPDATE categories 
        SET name = $1, is_modifier_group = $2, linked_modifiers = $3, parent_id = $4
        WHERE id = $5 RETURNING *`,
        [
            category.name, 
            category.isModifierGroup, 
            category.linkedModifiers, 
            category.parentId,
            category.id
        ]
    );
    return result.rows[0];
};

export const deleteCategory = async (id: number) => {
    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

// Orders
export const getInitialOrders = async (): Promise<Order[]> => {
    const result = await query('SELECT * FROM orders ORDER BY created_at DESC');
    const allMenuItems = await getAllMenuItems();
    
    // Inflate order items with actual menu item data
    const inflatedOrders = await Promise.all(result.rows.map(async (order: any) => {
        const orderItemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        const inflatedItems = await Promise.all(orderItemsResult.rows.map(async (item: any) => {
            const menuItem = allMenuItems.find(mi => mi.id === item.menu_item_id);
            if (!menuItem) {
                console.warn(`Menu item with ID ${item.menu_item_id} not found for order item ${item.id}`);
                return null;
            }
            
            const selectedExtras = await Promise.all((item.selected_extras || []).map(async (extraId: string) => {
                const extraItem = allMenuItems.find(mi => mi.id === extraId);
                if(!extraItem) {
                    console.warn(`Extra item with ID ${extraId} not found for order item ${item.id}`);
                    return null;
                }
                return extraItem;
            }));

            return {
                id: item.id,
                menuItem,
                quantity: item.quantity,
                newCount: item.new_count,
                cookingCount: item.cooking_count,
                readyCount: item.ready_count,
                servedCount: item.served_count,
                selectedExtras: selectedExtras.filter(e => e !== null) as MenuItem[],
                notes: item.notes,
            };
        }));

        return {
            id: order.id,
            table: order.table_number,
            status: order.status,
            createdAt: new Date(order.created_at),
            completedAt: order.completed_at ? new Date(order.completed_at) : undefined,
            isPinned: order.is_pinned,
            customerId: order.customer_id,
            staffName: order.staff_name,
            statusHistory: order.status_history,
            notes: order.notes,
            orderType: order.order_type as OrderType,
            deliveryInfo: order.delivery_info,
            items: inflatedItems.filter(item => item !== null) as OrderItem[],
        };
    }));

    return inflatedOrders as Order[];
};

export const addOrder = async (orderData: {
    table: number;
    items: Omit<OrderItem, 'id'>[];
    notes?: string;
    orderType: OrderType;
    deliveryInfo?: DeliveryInfo;
}) => {
    // Start a transaction
    const client = await query('BEGIN');
    
    try {
        // Get the next order ID
        const idResult = await query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM orders');
        const nextOrderId = parseInt(idResult.rows[0].next_id);
        const now = new Date().toISOString();

        // Create the order
        const orderResult = await query(
            `INSERT INTO orders 
            (id, table_number, status, created_at, is_pinned, notes, order_type, delivery_info, staff_name, status_history) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
            [
                nextOrderId,
                orderData.table,
                'pending',
                now,
                false,
                orderData.notes || '',
                orderData.orderType,
                orderData.deliveryInfo,
                "Staff Member", // Mock staff name
                JSON.stringify([{ status: "pending", timestamp: now }])
            ]
        );

        // Create order items
        for (const item of orderData.items) {
            const itemId = `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            await query(
                `INSERT INTO order_items 
                (id, order_id, menu_item_id, quantity, new_count, cooking_count, ready_count, served_count, selected_extras, notes) 
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                    itemId,
                    nextOrderId,
                    item.menuItem.id,
                    item.quantity,
                    item.quantity, // newCount
                    0, // cookingCount
                    0, // readyCount
                    0, // servedCount
                    item.selectedExtras?.map(e => e.id) || [],
                    item.notes || ''
                ]
            );
        }

        // Commit the transaction
        await query('COMMIT');

        // Return the created order with inflated items
        const allMenuItems = await getAllMenuItems();
        const orderItemsResult = await query('SELECT * FROM order_items WHERE order_id = $1', [nextOrderId]);
        const inflatedItems = await Promise.all(orderItemsResult.rows.map(async (item: any) => {
            const menuItem = allMenuItems.find(mi => mi.id === item.menu_item_id);
            if (!menuItem) return null;
            
            const selectedExtras = await Promise.all((item.selected_extras || []).map(async (extraId: string) => {
                const extraItem = allMenuItems.find(mi => mi.id === extraId);
                return extraItem || null;
            }));

            return {
                id: item.id,
                menuItem,
                quantity: item.quantity,
                newCount: item.new_count,
                cookingCount: item.cooking_count,
                readyCount: item.ready_count,
                servedCount: item.served_count,
                selectedExtras: selectedExtras.filter(e => e !== null) as MenuItem[],
                notes: item.notes,
            };
        }));

        return {
            id: nextOrderId,
            table: orderData.table,
            status: 'pending',
            createdAt: new Date(now),
            isPinned: false,
            notes: orderData.notes || '',
            orderType: orderData.orderType,
            deliveryInfo: orderData.deliveryInfo,
            staffName: "Staff Member",
            statusHistory: [{ status: "pending", timestamp: now }],
            items: inflatedItems.filter(item => item !== null) as OrderItem[],
        } as Order;
    } catch (error) {
        // Rollback the transaction on error
        await query('ROLLBACK');
        throw error;
    }
};

export const updateOrderItemStatus = async (orderId: number, itemId: string, newStatus: 'New' | 'Cooking' | 'Ready') => {
    // This function is now less relevant due to the more granular client-side state management.
    // In a real application, you would send the specific count changes to the backend.
    // For now, we'll just acknowledge that a change happened.
    console.log(`Server received status update for order ${orderId}, item ${itemId} to ${newStatus}`);
    
    // We can still handle the overall order completion logic here.
    // For now, we'll just return true to indicate success.
    return true;
}

export const updateOrderStatus = async (payload: { orderId: number; newStatus: 'pending' | 'completed' }) => {
    const result = await query(
        'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
        [payload.newStatus, payload.orderId]
    );
    return result.rows.length > 0;
}

export const toggleOrderPin = async (orderId: number, isPinned: boolean) => {
    const result = await query(
        'UPDATE orders SET is_pinned = $1 WHERE id = $2 RETURNING *',
        [isPinned, orderId]
    );
    return result.rows.length > 0;
}

// Payment Methods
export const getPaymentMethods = async (): Promise<PaymentMethod[]> => {
    const result = await query('SELECT * FROM payment_methods');
    return result.rows as PaymentMethod[];
};

export const addPaymentMethod = async (methodData: Omit<PaymentMethod, 'id'>) => {
    const result = await query(
        `INSERT INTO payment_methods 
        (id, name, type, enabled, banks) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
            `pm_${Date.now()}`, 
            methodData.name, 
            methodData.type, 
            methodData.enabled !== undefined ? methodData.enabled : true, 
            methodData.banks || []
        ]
    );
    return result.rows[0];
};

export const updatePaymentMethod = async (method: PaymentMethod) => {
    const result = await query(
        `UPDATE payment_methods 
        SET name = $1, type = $2, enabled = $3, banks = $4
        WHERE id = $5 RETURNING *`,
        [
            method.name, 
            method.type, 
            method.enabled, 
            method.banks,
            method.id
        ]
    );
    return result.rows[0];
};

export const deletePaymentMethod = async (id: string) => {
    const result = await query('DELETE FROM payment_methods WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

// Inventory
export const getInventoryItems = async (): Promise<InventoryItem[]> => {
    const result = await query('SELECT * FROM inventory');
    return result.rows as InventoryItem[];
};

export const addInventoryItem = async (itemData: Omit<InventoryItem, 'id' | 'lastRestocked'>) => {
    const result = await query(
        `INSERT INTO inventory 
        (id, name, quantity, unit, reorder_threshold, last_restocked, linked_item_ids, category) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
        [
            `inv_${Date.now()}`,
            itemData.name,
            itemData.quantity,
            itemData.unit,
            itemData.reorderThreshold,
            new Date().toISOString(),
            itemData.linkedItemIds || [],
            itemData.category
        ]
    );
    return result.rows[0];
};

export const updateInventoryItem = async (item: InventoryItem) => {
    const result = await query(
        `UPDATE inventory 
        SET name = $1, quantity = $2, unit = $3, reorder_threshold = $4, last_restocked = $5, linked_item_ids = $6, category = $7
        WHERE id = $8 RETURNING *`,
        [
            item.name,
            item.quantity,
            item.unit,
            item.reorderThreshold,
            item.lastRestocked,
            item.linkedItemIds,
            item.category,
            item.id
        ]
    );
    return result.rows[0];
};

export const deleteInventoryItem = async (id: string) => {
    const result = await query('DELETE FROM inventory WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
}

export const adjustInventoryStock = async (itemId: string, adjustment: number) => {
    const result = await query(
        'UPDATE inventory SET quantity = quantity + $1, last_restocked = CASE WHEN $1 > 0 THEN $2 ELSE last_restocked END WHERE id = $3 RETURNING *',
        [adjustment, new Date().toISOString(), itemId]
    );
    return result.rows[0];
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
    const result = await query('SELECT * FROM tasks');
    return result.rows as Task[];
};

export const addTask = async (taskData: Omit<Task, 'id'>) => {
    const result = await query(
        `INSERT INTO tasks 
        (id, title, description, assignee_id, reporter_id, status, priority, created_at, due_date, completed_at) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *`,
        [
            `task_${Date.now()}`,
            taskData.title,
            taskData.description,
            taskData.assignedTo,
            taskData.reporterId,
            taskData.status,
            taskData.priority,
            taskData.createdAt.toISOString(),
            taskData.dueDate?.toISOString(),
            taskData.completedAt?.toISOString()
        ]
    );
    return result.rows[0];
};

export const updateTask = async (task: Task) => {
    const result = await query(
        `UPDATE tasks 
        SET title = $1, description = $2, assignee_id = $3, reporter_id = $4, status = $5, priority = $6, due_date = $7, completed_at = $8
        WHERE id = $9 RETURNING *`,
        [
            task.title,
            task.description,
            task.assignedTo,
            task.reporterId,
            task.status,
            task.priority,
            task.dueDate?.toISOString(),
            task.completedAt?.toISOString(),
            task.id
        ]
    );
    return result.rows[0];
};

export const deleteTask = async (id: string) => {
    const result = await query('DELETE FROM tasks WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

// Customers
export const getCustomers = async (): Promise<Customer[]> => {
    const result = await query('SELECT * FROM customers');
    return result.rows as Customer[];
};

export const addCustomer = async (customerData: Omit<Customer, 'id'>) => {
    const result = await query(
        `INSERT INTO customers 
        (id, name, email) 
        VALUES ($1, $2, $3) RETURNING *`,
        [
            `cust_${Date.now()}`,
            customerData.name,
            customerData.email
        ]
    );
    return result.rows[0];
};

export const updateCustomer = async (customer: Customer) => {
    const result = await query(
        `UPDATE customers 
        SET name = $1, email = $2
        WHERE id = $3 RETURNING *`,
        [
            customer.name,
            customer.email,
            customer.id
        ]
    );
    return result.rows[0];
};

export const deleteCustomer = async (id: string) => {
    const result = await query('DELETE FROM customers WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};

// Staff
export const getStaff = async (): Promise<Staff[]> => {
    const result = await query('SELECT * FROM staff');
    return result.rows as Staff[];
}

export const addStaff = async (staffData: Omit<Staff, 'id'>) => {
    const result = await query(
        `INSERT INTO staff 
        (id, name, email, role, status) 
        VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [
            `staff_${Date.now()}`,
            staffData.name,
            staffData.email,
            staffData.role,
            staffData.status
        ]
    );
    return result.rows[0];
};

export const updateStaff = async (staff: Staff) => {
    const result = await query(
        `UPDATE staff 
        SET name = $1, email = $2, role = $3, status = $4
        WHERE id = $5 RETURNING *`,
        [
            staff.name,
            staff.email,
            staff.role,
            staff.status,
            staff.id
        ]
    );
    return result.rows[0];
};

export const deleteStaff = async (id: string) => {
    const result = await query('DELETE FROM staff WHERE id = $1 RETURNING *', [id]);
    return result.rows.length > 0;
};