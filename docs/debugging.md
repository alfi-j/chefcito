# Debugging Guide

This document explains how to use the debugging features in the Chefcito application.

## Overview

The application uses the `debug` npm package for structured logging across different modules. Debug logs are only visible in development mode and can be filtered by namespace.

## Available Debug Namespaces

The following debug namespaces are available:

- `chefcito:inventory` - Inventory management operations
- `chefcito:orders` - Order processing operations
- `chefcito:api` - General API operations
- `chefcito:db` - Database operations
- `chefcito:auth` - Authentication operations
- `chefcito:menu` - Menu management operations
- `chefcito:payments` - Payment processing operations
- `chefcito:workstations` - Workstation management operations
- `chefcito:reports` - Reporting operations

## Enabling Debug Logs

### Development Mode

To see debug logs in development, use the dedicated debug script:

```bash
npm run dev:debug
```

This is equivalent to:
```bash
DEBUG=chefcito:* next dev --turbopack
```

### Custom Debug Filters

You can also enable specific debug namespaces:

```bash
DEBUG=chefcito:inventory,cheftico:orders npm run dev
```

Or enable all chefcito debug logs with:
```bash
DEBUG=chefcito:* npm run dev
```

## Using Debug in Code

To use debug in your code, import the appropriate debug logger:

```typescript
import { debugInventory } from '@/lib/debug-utils';

// In your function
debugInventory('Function called with params %O', params);
```

Available debug loggers:
- `debugInventory`
- `debugOrders`
- `debugAPI`
- `debugDB`
- `debugAuth`
- `debugMenu`
- `debugPayments`
- `debugWorkstations`
- `debugReports`

## Debug Log Format

Debug logs follow this format:
```
namespace filename:line_number timestamp message
```

Example:
```
chefcito:inventory route.ts:12 GET: request received with params {"id":"abc123"}
```

## Best Practices

1. Use descriptive messages with appropriate formatting
2. Include relevant parameters in your debug messages using format specifiers:
   - `%s` for strings
   - `%d` for numbers
   - `%j` for JSON
   - `%O` for objects
3. Use debug logs to trace function calls, parameters, and results
4. Include error information in catch blocks
5. Don't log sensitive information like passwords or tokens

## Example Usage

```typescript
import { debugInventory } from '@/lib/debug-utils';

async function updateInventoryItem(id: string, data: any) {
  debugInventory('updateInventoryItem: called with id %s and data %O', id, data);
  
  try {
    const result = await database.update(id, data);
    debugInventory('updateInventoryItem: successfully updated item %s', id);
    return result;
  } catch (error) {
    debugInventory('updateInventoryItem: error updating item %s: %O', id, error);
    throw error;
  }
}
```

## Production Considerations

Debug logs are automatically disabled in production environments. The `DEBUG` environment variable is only effective in development mode.

For production logging, consider implementing a centralized logging service that can handle error reporting and metrics collection.