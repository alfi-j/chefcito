import { Pool } from '@neondatabase/serverless';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Load environment variables
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});

async function migrateData() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    // Read data files
    const categoriesData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/categories.json'), 'utf-8')
    );
    
    const menuItemsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/menu-items.json'), 'utf-8')
    );
    
    const customersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/customers.json'), 'utf-8')
    );
    
    const staffData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/staff.json'), 'utf-8')
    );
    
    const paymentMethodsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/payment-methods.json'), 'utf-8')
    );
    
    const inventoryItemsData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/inventory.json'), 'utf-8')
    );
    
    const tasksData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/tasks.json'), 'utf-8')
    );
    
    const ordersData = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../src/data/orders.json'), 'utf-8')
    );
    
    // Insert categories
    for (const category of categoriesData) {
      await client.query(
        `INSERT INTO categories (id, name, is_modifier_group, linked_modifiers, parent_id, depth) 
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name, 
         is_modifier_group = EXCLUDED.is_modifier_group,
         linked_modifiers = EXCLUDED.linked_modifiers,
         parent_id = EXCLUDED.parent_id,
         depth = EXCLUDED.depth`,
        [
          category.id,
          category.name,
          category.isModifierGroup || false,
          category.linkedModifiers || [],
          category.parentId || null,
          category.depth || 0
        ]
      );
    }
    
    // Insert menu items
    for (const item of menuItemsData) {
      // Get category id by name
      let categoryId = null;
      if (item.category) {
        const categoryResult = await client.query(
          'SELECT id FROM categories WHERE name = $1',
          [item.category]
        );
        if (categoryResult.rows.length > 0) {
          categoryId = categoryResult.rows[0].id;
        }
      }
      
      await client.query(
        `INSERT INTO menu_items 
         (id, name, price, description, available, category, image_url, ai_hint, linked_modifiers, sort_index) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         price = EXCLUDED.price,
         description = EXCLUDED.description,
         available = EXCLUDED.available,
         category = EXCLUDED.category,
         image_url = EXCLUDED.image_url,
         ai_hint = EXCLUDED.ai_hint,
         linked_modifiers = EXCLUDED.linked_modifiers,
         sort_index = EXCLUDED.sort_index`,
        [
          item.id,
          item.name,
          item.price,
          item.description || '',
          item.available !== undefined ? item.available : true,
          item.category,
          item.imageUrl || '',
          item.aiHint || '',
          item.linkedModifiers || [],
          item.sortIndex !== undefined ? item.sortIndex : 0
        ]
      );
    }
    
    // Insert customers
    for (const customer of customersData) {
      await client.query(
        `INSERT INTO customers (id, name, email) 
         VALUES ($1, $2, $3)
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         email = EXCLUDED.email`,
        [
          customer.id,
          customer.name,
          customer.email || ''
        ]
      );
    }
    
    // Insert staff
    for (const staff of staffData) {
      await client.query(
        `INSERT INTO staff (id, name, email, role, status) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         email = EXCLUDED.email,
         role = EXCLUDED.role,
         status = EXCLUDED.status`,
        [
          staff.id,
          staff.name,
          staff.email || '',
          staff.role,
          staff.status
        ]
      );
    }
    
    // Insert payment methods
    for (const method of paymentMethodsData) {
      await client.query(
        `INSERT INTO payment_methods (id, name, type, enabled, banks) 
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         type = EXCLUDED.type,
         enabled = EXCLUDED.enabled,
         banks = EXCLUDED.banks`,
        [
          method.id,
          method.name,
          method.type,
          method.enabled !== undefined ? method.enabled : true,
          method.banks || []
        ]
      );
    }
    
    // Insert inventory items
    for (const item of inventoryItemsData) {
      await client.query(
        `INSERT INTO inventory_items 
         (id, name, quantity, unit, reorder_threshold, last_restocked, linked_item_ids, category) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name,
         quantity = EXCLUDED.quantity,
         unit = EXCLUDED.unit,
         reorder_threshold = EXCLUDED.reorder_threshold,
         last_restocked = EXCLUDED.last_restocked,
         linked_item_ids = EXCLUDED.linked_item_ids,
         category = EXCLUDED.category`,
        [
          item.id,
          item.name,
          item.quantity,
          item.unit || '',
          item.reorderThreshold || 0,
          item.lastRestocked ? new Date(item.lastRestocked).toISOString() : new Date().toISOString(),
          item.linkedItemIds || [],
          item.category || ''
        ]
      );
    }
    
    // Insert tasks
    for (const task of tasksData) {
      await client.query(
        `INSERT INTO tasks (id, title, description, status, priority, assigned_to, due_date) 
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (id) DO UPDATE SET 
         title = EXCLUDED.title,
         description = EXCLUDED.description,
         status = EXCLUDED.status,
         priority = EXCLUDED.priority,
         assigned_to = EXCLUDED.assigned_to,
         due_date = EXCLUDED.due_date`,
        [
          task.id,
          task.title,
          task.description || '',
          task.status || 'To Do',
          task.priority || 'Medium',
          task.assignedTo || null,
          task.dueDate || null
        ]
      );
    }
    
    // Insert orders
    for (const order of ordersData) {
      await client.query(
        `INSERT INTO orders 
         (id, table_number, status, created_at, completed_at, is_pinned, customer_id, staff_name, notes, order_type, delivery_info) 
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         ON CONFLICT (id) DO UPDATE SET
         table_number = EXCLUDED.table_number,
         status = EXCLUDED.status,
         created_at = EXCLUDED.created_at,
         completed_at = EXCLUDED.completed_at,
         is_pinned = EXCLUDED.is_pinned,
         customer_id = EXCLUDED.customer_id,
         staff_name = EXCLUDED.staff_name,
         notes = EXCLUDED.notes,
         order_type = EXCLUDED.order_type,
         delivery_info = EXCLUDED.delivery_info`,
        [
          order.id,
          order.table,
          order.status || 'pending',
          order.createdAt || new Date().toISOString(),
          order.completedAt || null,
          order.isPinned || false,
          order.customerId || null,
          order.staffName || null,
          order.notes || '',
          order.orderType || 'dine-in',
          order.deliveryInfo ? JSON.stringify(order.deliveryInfo) : null
        ]
      );
      
      // Insert order items
      if (order.items && Array.isArray(order.items)) {
        for (const item of order.items) {
          await client.query(
            `INSERT INTO order_items 
             (id, order_id, menu_item_id, quantity, new_count, cooking_count, ready_count, served_count, notes) 
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
             ON CONFLICT (id) DO UPDATE SET
             order_id = EXCLUDED.order_id,
             menu_item_id = EXCLUDED.menu_item_id,
             quantity = EXCLUDED.quantity,
             new_count = EXCLUDED.new_count,
             cooking_count = EXCLUDED.cooking_count,
             ready_count = EXCLUDED.ready_count,
             served_count = EXCLUDED.served_count,
             notes = EXCLUDED.notes`,
            [
              item.id,
              order.id,
              item.menuItemId,
              item.quantity || 1,
              item.newCount || 0,
              item.cookingCount || 0,
              item.readyCount || 0,
              item.servedCount || 0,
              item.notes || ''
            ]
          );
          
          // Insert extras if any
          if (item.selectedExtraIds && Array.isArray(item.selectedExtraIds)) {
            for (const extraId of item.selectedExtraIds) {
              // Get the next id for order_item_extras
              const idResult = await client.query('SELECT COALESCE(MAX(id), 0) + 1 as next_id FROM order_item_extras');
              const nextId = idResult.rows[0].next_id;
              
              await client.query(
                `INSERT INTO order_item_extras (id, order_item_id, extra_menu_item_id) 
                 VALUES ($1, $2, $3)`,
                [nextId, item.id, extraId]
              );
            }
          }
        }
      }
      
      // Insert status history if any
      if (order.statusHistory && Array.isArray(order.statusHistory)) {
        for (const history of order.statusHistory) {
          // Check if history entry already exists
          const existing = await client.query(
            'SELECT id FROM order_status_history WHERE order_id = $1 AND status = $2 AND timestamp = $3',
            [order.id, history.status, history.timestamp]
          );
          
          if (existing.rows.length === 0) {
            await client.query(
              `INSERT INTO order_status_history (order_id, status, timestamp) 
               VALUES ($1, $2, $3)`,
              [order.id, history.status, history.timestamp]
            );
          }
        }
      }
    }
    
    await client.query('COMMIT');
    console.log('Data migration completed successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Data migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the migration if this file is executed directly
if (require.main === module) {
  migrateData().catch(console.error);
}