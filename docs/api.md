# Chefcito API Documentation

This document provides comprehensive documentation for the Chefcito API endpoints. The API follows REST conventions and provides access to all restaurant management data including categories, menu items, orders, customers, staff, and more.

## Base URL

All API endpoints are relative to the base URL:
```
/api
```

For example, to access categories: `/api/categories`

## Authentication

Currently, the API does not require authentication as it's designed for internal use within the application. All endpoints are accessible without authentication tokens.

## Error Handling

All endpoints return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `404`: Not Found
- `500`: Internal Server Error

Error responses follow this format:
```json
{
  "error": "Error message"
}
```

## Rate Limiting

There is currently no rate limiting implemented on the API endpoints.

## API Endpoints

### Categories

#### Get all categories
```
GET /api/categories
```

Returns an array of category objects.

**Response:**
```json
[
  {
    "id": 1,
    "name": "Appetizers",
    "isModifierGroup": false,
    "linkedModifiers": [],
    "parentId": null,
    "depth": 0,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create a category
```
POST /api/categories
```

Creates a new category.

**Request Body:**
```json
{
  "name": "Category Name",
  "isModifierGroup": false,
  "linkedModifiers": [],
  "parentId": null
}
```

**Response:**
```json
{
  "id": 1,
  "name": "Category Name",
  "isModifierGroup": false,
  "linkedModifiers": [],
  "parentId": null,
  "depth": 0,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Menu Items

#### Get all menu items
```
GET /api/menu-items
```

Returns an array of menu item objects.

**Response:**
```json
[
  {
    "id": "1",
    "name": "Margherita Pizza",
    "price": 12.99,
    "description": "Classic pizza with fresh basil and mozzarella.",
    "available": true,
    "category": "Pizzas",
    "imageUrl": "",
    "aiHint": "Margherita Pizza food",
    "linkedModifiers": ["Extras"],
    "sortIndex": 2,
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create a menu item
```
POST /api/menu-items
```

Creates a new menu item.

**Request Body:**
```json
{
  "name": "Margherita Pizza",
  "price": 12.99,
  "description": "Classic pizza with fresh basil and mozzarella.",
  "available": true,
  "category": "Pizzas",
  "imageUrl": "",
  "aiHint": "Margherita Pizza food",
  "linkedModifiers": ["Extras"],
  "sortIndex": 2
}
```

**Response:**
```json
{
  "id": "1",
  "name": "Margherita Pizza",
  "price": 12.99,
  "description": "Classic pizza with fresh basil and mozzarella.",
  "available": true,
  "category": "Pizzas",
  "imageUrl": "",
  "aiHint": "Margherita Pizza food",
  "linkedModifiers": ["Extras"],
  "sortIndex": 2,
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Orders

#### Get orders
```
GET /api/orders[?status=pending|completed|cancelled]
```

Returns an array of order objects. Optionally filter by status.

**Response:**
```json
[
  {
    "id": 1,
    "table": 5,
    "status": "pending",
    "createdAt": "2024-08-07T14:00:00Z",
    "completedAt": null,
    "isPinned": true,
    "customerId": null,
    "staffName": "Alex",
    "notes": "Customer has a gluten allergy.",
    "orderType": "dine-in",
    "deliveryInfo": null,
    "items": [
      {
        "id": "1-1",
        "menuItemId": "1",
        "quantity": 1,
        "newCount": 1,
        "cookingCount": 0,
        "readyCount": 0,
        "servedCount": 0,
        "selectedExtraIds": ["extra-1"],
        "notes": "Gluten-free crust."
      }
    ],
    "statusHistory": [
      {
        "status": "pending",
        "timestamp": "2024-08-07T14:00:00Z"
      }
    ],
    "updatedAt": "2024-08-07T14:00:00Z"
  }
]
```

#### Create an order
```
POST /api/orders
```

Creates a new order with items.

**Request Body:**
```json
{
  "table": 5,
  "items": [
    {
      "menuItemId": "1",
      "quantity": 1,
      "newCount": 1,
      "cookingCount": 0,
      "readyCount": 0,
      "servedCount": 0,
      "selectedExtraIds": ["extra-1"],
      "notes": "Gluten-free crust."
    }
  ],
  "notes": "Customer has a gluten allergy.",
  "orderType": "dine-in",
  "customerId": null,
  "staffName": "Alex"
}
```

**Response:**
```json
{
  "id": 1,
  "table": 5,
  "status": "pending",
  "createdAt": "2024-08-07T14:00:00Z",
  "completedAt": null,
  "isPinned": true,
  "customerId": null,
  "staffName": "Alex",
  "notes": "Customer has a gluten allergy.",
  "orderType": "dine-in",
  "deliveryInfo": null,
  "items": [
    {
      "id": "1-1",
      "menuItemId": "1",
      "quantity": 1,
      "newCount": 1,
      "cookingCount": 0,
      "readyCount": 0,
      "servedCount": 0,
      "selectedExtraIds": ["extra-1"],
      "notes": "Gluten-free crust."
    }
  ],
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2024-08-07T14:00:00Z"
    }
  ],
  "updatedAt": "2024-08-07T14:00:00Z"
}
```

#### Update an order
```
PUT /api/orders/{id}
```

Updates an existing order status.

**Request Body:**
```json
{
  "status": "completed"
}
```

**Response:**
```json
{
  "id": 1,
  "table": 5,
  "status": "completed",
  "createdAt": "2024-08-07T14:00:00Z",
  "completedAt": "2024-08-07T15:30:00Z",
  "isPinned": true,
  "customerId": null,
  "staffName": "Alex",
  "notes": "Customer has a gluten allergy.",
  "orderType": "dine-in",
  "deliveryInfo": null,
  "items": [
    {
      "id": "1-1",
      "menuItemId": "1",
      "quantity": 1,
      "newCount": 1,
      "cookingCount": 0,
      "readyCount": 0,
      "servedCount": 0,
      "selectedExtraIds": ["extra-1"],
      "notes": "Gluten-free crust."
    }
  ],
  "statusHistory": [
    {
      "status": "pending",
      "timestamp": "2024-08-07T14:00:00Z"
    }
  ],
  "updatedAt": "2024-08-07T15:30:00Z"
}
```

### Customers

#### Get all customers
```
GET /api/customers
```

Returns an array of customer objects.

**Response:**
```json
[
  {
    "id": "customer-1",
    "name": "John Doe",
    "email": "john@example.com",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create a customer
```
POST /api/customers
```

Creates a new customer.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com"
}
```

**Response:**
```json
{
  "id": "customer-1",
  "name": "John Doe",
  "email": "john@example.com",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Staff

#### Get all staff members
```
GET /api/staff
```

Returns an array of staff objects.

**Response:**
```json
[
  {
    "id": "staff-1",
    "name": "Alex Johnson",
    "email": "alex@chefcito.com",
    "role": "Chef",
    "status": "On Shift",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create a staff member
```
POST /api/staff
```

Creates a new staff member.

**Request Body:**
```json
{
  "name": "Alex Johnson",
  "email": "alex@chefcito.com",
  "role": "Chef",
  "status": "On Shift"
}
```

**Response:**
```json
{
  "id": "staff-1",
  "name": "Alex Johnson",
  "email": "alex@chefcito.com",
  "role": "Chef",
  "status": "On Shift",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Payment Methods

#### Get all payment methods
```
GET /api/payment-methods
```

Returns an array of payment method objects.

**Response:**
```json
[
  {
    "id": "payment-1",
    "name": "Credit Card",
    "type": "card",
    "enabled": true,
    "banks": [],
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create a payment method
```
POST /api/payment-methods
```

Creates a new payment method.

**Request Body:**
```json
{
  "name": "Credit Card",
  "type": "card",
  "enabled": true,
  "banks": []
}
```

**Response:**
```json
{
  "id": "payment-1",
  "name": "Credit Card",
  "type": "card",
  "enabled": true,
  "banks": [],
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Inventory Items

#### Get all inventory items
```
GET /api/inventory
```

Returns an array of inventory item objects.

**Response:**
```json
[
  {
    "id": "inventory-1",
    "name": "Tomato Sauce",
    "quantity": 50,
    "unit": "kg",
    "reorderThreshold": 10,
    "lastRestocked": "2023-01-01T00:00:00.000Z",
    "linkedItemIds": [],
    "category": "Sauces",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create an inventory item
```
POST /api/inventory
```

Creates a new inventory item.

**Request Body:**
```json
{
  "name": "Tomato Sauce",
  "quantity": 50,
  "unit": "kg",
  "reorderThreshold": 10,
  "lastRestocked": "2023-01-01T00:00:00.000Z",
  "linkedItemIds": [],
  "category": "Sauces"
}
```

**Response:**
```json
{
  "id": "inventory-1",
  "name": "Tomato Sauce",
  "quantity": 50,
  "unit": "kg",
  "reorderThreshold": 10,
  "lastRestocked": "2023-01-01T00:00:00.000Z",
  "linkedItemIds": [],
  "category": "Sauces",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

### Tasks

#### Get all tasks
```
GET /api/tasks
```

Returns an array of task objects.

**Response:**
```json
[
  {
    "id": "task-1",
    "title": "Clean kitchen",
    "description": "Thoroughly clean all kitchen surfaces",
    "status": "To Do",
    "priority": "High",
    "assignedTo": "staff-1",
    "dueDate": "2023-01-01T00:00:00.000Z",
    "createdAt": "2023-01-01T00:00:00.000Z",
    "updatedAt": "2023-01-01T00:00:00.000Z"
  }
]
```

#### Create a task
```
POST /api/tasks
```

Creates a new task.

**Request Body:**
```json
{
  "title": "Clean kitchen",
  "description": "Thoroughly clean all kitchen surfaces",
  "status": "To Do",
  "priority": "High",
  "assignedTo": "staff-1",
  "dueDate": "2023-01-01T00:00:00.000Z"
}
```

**Response:**
```json
{
  "id": "task-1",
  "title": "Clean kitchen",
  "description": "Thoroughly clean all kitchen surfaces",
  "status": "To Do",
  "priority": "High",
  "assignedTo": "staff-1",
  "dueDate": "2023-01-01T00:00:00.000Z",
  "createdAt": "2023-01-01T00:00:00.000Z",
  "updatedAt": "2023-01-01T00:00:00.000Z"
}
```

## Data Models

### Category
- `id` (integer): Unique identifier
- `name` (string): Category name
- `isModifierGroup` (boolean): Whether the category is a modifier group
- `linkedModifiers` (array): Array of linked modifier names
- `parentId` (integer): Parent category ID (for hierarchical categories)
- `depth` (integer): Category depth in hierarchy
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

### MenuItem
- `id` (string): Unique identifier
- `name` (string): Menu item name
- `price` (number): Price in decimal format
- `description` (string): Item description
- `available` (boolean): Availability status
- `category` (string): Category name
- `imageUrl` (string): URL to item image
- `aiHint` (string): AI hint for image generation
- `linkedModifiers` (array): Array of linked modifier category names
- `sortIndex` (integer): Sort order index
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

### Order
- `id` (integer): Unique identifier
- `table` (integer): Table number
- `status` (string): Order status (pending, completed, cancelled)
- `createdAt` (datetime): Creation timestamp
- `completedAt` (datetime): Completion timestamp
- `isPinned` (boolean): Pinned status
- `customerId` (string): Customer ID
- `staffName` (string): Staff member name
- `notes` (string): Order notes
- `orderType` (string): Type of order (dine-in, delivery, takeaway)
- `deliveryInfo` (object): Delivery information (if applicable)
- `items` (array): Array of order items
- `statusHistory` (array): Array of status history entries
- `updatedAt` (datetime): Last update timestamp

### OrderItem
- `id` (string): Unique identifier
- `menuItemId` (string): Menu item ID
- `quantity` (integer): Quantity ordered
- `newCount` (integer): Number of items in "new" status
- `cookingCount` (integer): Number of items in "cooking" status
- `readyCount` (integer): Number of items in "ready" status
- `servedCount` (integer): Number of items in "served" status
- `selectedExtraIds` (array): Array of selected extra IDs
- `notes` (string): Item notes

### Customer
- `id` (string): Unique identifier
- `name` (string): Customer name
- `email` (string): Customer email
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

### Staff
- `id` (string): Unique identifier
- `name` (string): Staff member name
- `email` (string): Staff member email
- `role` (string): Role (Waiter, Manager, Chef)
- `status` (string): Status (On Shift, Off Shift, On Break)
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

### PaymentMethod
- `id` (string): Unique identifier
- `name` (string): Payment method name
- `type` (string): Type (cash, card, bank_transfer)
- `enabled` (boolean): Enabled status
- `banks` (array): Array of bank names
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

### InventoryItem
- `id` (string): Unique identifier
- `name` (string): Item name
- `quantity` (number): Current quantity
- `unit` (string): Unit of measurement
- `reorderThreshold` (number): Reorder threshold
- `lastRestocked` (datetime): Last restock timestamp
- `linkedItemIds` (array): Array of linked item IDs
- `category` (string): Category name
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

### Task
- `id` (string): Unique identifier
- `title` (string): Task title
- `description` (string): Task description
- `status` (string): Status (To Do, In Progress, Done)
- `priority` (string): Priority (Low, Medium, High)
- `assignedTo` (string): Assigned staff member ID
- `dueDate` (datetime): Due date
- `createdAt` (datetime): Creation timestamp
- `updatedAt` (datetime): Last update timestamp

## Usage Examples

### Fetching menu items for POS
```javascript
fetch('/api/menu-items')
  .then(response => response.json())
  .then(menuItems => {
    // Display menu items in POS interface
  });
```

### Creating a new order
```javascript
fetch('/api/orders', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    table: 5,
    items: [
      {
        menuItemId: '1',
        quantity: 2,
        notes: 'Extra cheese'
      }
    ],
    notes: 'Customer wants it fast',
    orderType: 'dine-in'
  })
})
.then(response => response.json())
.then(order => {
  // Order created successfully
});
```

### Updating order status
```javascript
fetch('/api/orders/1', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    status: 'completed'
  })
})
.then(response => response.json())
.then(updatedOrder => {
  // Order status updated
});
```