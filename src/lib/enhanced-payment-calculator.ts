import { type OrderItem, type Payment, type CustomerPaymentAssignment } from '@/lib/types';

export interface EnhancedSplitConfig {
  method: 'customer_item_assignment';
  assignments: CustomerPaymentAssignment[];
  includeTaxTips?: boolean;
}

export interface EnhancedSplitResult {
  assignments: CustomerPaymentAssignment[];
  totalAmount: number;
  totalTax: number;
  totalTip: number;
  isValid: boolean;
  errorMessage?: string;
}

export class EnhancedPaymentCalculator {
  private orderItems: OrderItem[];
  private subtotal: number;
  private tax: number;
  private tip: number;
  private paymentMethods: Payment[];

  constructor(
    orderItems: OrderItem[], 
    subtotal: number, 
    tax: number, 
    tip: number = 0,
    paymentMethods: Payment[]
  ) {
    this.orderItems = orderItems;
    this.subtotal = subtotal;
    this.tax = tax;
    this.tip = tip;
    this.paymentMethods = paymentMethods;
  }

  calculate(config: EnhancedSplitConfig): EnhancedSplitResult {
    const validationError = this.validateConfig(config);
    if (validationError) {
      return this.createInvalidResult(validationError);
    }

    switch (config.method) {
      case 'customer_item_assignment':
        return this.calculateCustomerItemAssignment(config);
      default:
        return this.createInvalidResult('Unsupported split method');
    }
  }

  private validateConfig(config: EnhancedSplitConfig): string | null {
    if (!config.assignments || config.assignments.length === 0) {
      return 'At least one customer assignment is required';
    }

    if (config.assignments.length > 20) {
      return 'Cannot have more than 20 customer assignments';
    }

    // Validate each assignment
    for (const assignment of config.assignments) {
      // Customer name is optional - will be auto-generated as "Customer 1", "Customer 2", etc.
      if (assignment.customerName && assignment.customerName.trim().length > 50) {
        return 'Customer names cannot exceed 50 characters';
      }



      // Validate items in assignment
      if (assignment.items && assignment.items.length > 0) {
        let assignedQuantity = 0;
        const itemMap = new Map<string, number>();

        for (const itemAssignment of assignment.items) {
          const orderItem = this.orderItems.find(item => item.id === itemAssignment.orderItemId);
          if (!orderItem) {
            return `Assigned item ${itemAssignment.orderItemId} not found in order`;
          }

          if (itemAssignment.quantity <= 0 || itemAssignment.quantity > orderItem.quantity) {
            return `Invalid quantity for item ${orderItem.menuItem.name}`;
          }

          assignedQuantity += itemAssignment.quantity;
          const currentCount = itemMap.get(itemAssignment.orderItemId) || 0;
          itemMap.set(itemAssignment.orderItemId, currentCount + itemAssignment.quantity);
        }

        // Check if any item is assigned more times than available
        for (const [itemId, assignedCount] of itemMap.entries()) {
          const orderItem = this.orderItems.find(item => item.id === itemId);
          if (orderItem && assignedCount > orderItem.quantity) {
            return `Item ${orderItem.menuItem.name} assigned ${assignedCount} times but only ${orderItem.quantity} available`;
          }
        }
      }
    }



    return null;
  }



  private calculateCustomerItemAssignment(config: EnhancedSplitConfig): EnhancedSplitResult {
    // Calculate amounts based on assigned items
    const updatedAssignments = config.assignments.map(assignment => {
      let itemTotal = 0;
      
      if (assignment.items && assignment.items.length > 0) {
        for (const itemAssignment of assignment.items) {
          const orderItem = this.orderItems.find(item => item.id === itemAssignment.orderItemId);
          if (orderItem) {
            itemTotal += orderItem.menuItem.price * itemAssignment.quantity;
          }
        }
      }

      return {
        ...assignment,
        amount: itemTotal
      };
    });

    // Distribute tax and tips proportionally if requested
    if (config.includeTaxTips && (this.tax > 0 || this.tip > 0)) {
      const totalItemAmount = updatedAssignments.reduce((sum, assignment) => sum + assignment.amount, 0);
      
      updatedAssignments.forEach(assignment => {
        if (totalItemAmount > 0) {
          const proportion = assignment.amount / totalItemAmount;
          assignment.amount += (this.tax + this.tip) * proportion;
        }
      });
    }

    const totalAmount = updatedAssignments.reduce((sum, assignment) => sum + assignment.amount, 0);

    return {
      assignments: updatedAssignments,
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      totalTax: config.includeTaxTips ? this.tax : 0,
      totalTip: config.includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private createInvalidResult(errorMessage: string): EnhancedSplitResult {
    return {
      assignments: [],
      totalAmount: 0,
      totalTax: 0,
      totalTip: 0,
      isValid: false,
      errorMessage
    };
  }

  // Helper method to get unassigned items
  getUnassignedItems(assignments: CustomerPaymentAssignment[]): OrderItem[] {
    const assignedItemMap = new Map<string, number>();
    
    assignments.forEach(assignment => {
      if (assignment.items) {
        assignment.items.forEach(itemAssignment => {
          const currentCount = assignedItemMap.get(itemAssignment.orderItemId) || 0;
          assignedItemMap.set(itemAssignment.orderItemId, currentCount + itemAssignment.quantity);
        });
      }
    });

    const unassignedItems: OrderItem[] = [];
    
    this.orderItems.forEach(orderItem => {
      const assignedCount = assignedItemMap.get(orderItem.id) || 0;
      const remainingQuantity = orderItem.quantity - assignedCount;
      
      if (remainingQuantity > 0) {
        unassignedItems.push({
          ...orderItem,
          quantity: remainingQuantity
        });
      }
    });

    return unassignedItems;
  }

  // Helper method to validate if all items are assigned
  areAllItemsAssigned(assignments: CustomerPaymentAssignment[]): boolean {
    const unassignedItems = this.getUnassignedItems(assignments);
    return unassignedItems.length === 0;
  }
}