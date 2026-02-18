import { type OrderItem } from '@/lib/types';

// Split bill method types
export type SplitMethod = 
  | 'equal' 
  | 'by_item' 
  | 'by_person' 
  | 'percentage' 
  | 'custom_amount'
  | 'shared_items';

// Data structures for different split methods
export interface EqualSplitConfig {
  method: 'equal';
  numberOfPeople: number;
  includeTaxTips?: boolean;
  roundTo?: 'cent' | 'dollar';
}

export interface ByItemSplitConfig {
  method: 'by_item';
  assignments: {
    itemId: string;
    personId: string;
    quantity?: number; // For partial assignments
  }[];
  includeTaxTips?: boolean;
}

export interface ByPersonSplitConfig {
  method: 'by_person';
  bills: {
    id: string;
    personIds: string[];
    itemQuantities: Record<string, number>; // itemId -> quantity
    customAmount?: number; // Override calculated amount
  }[];
  includeTaxTips?: boolean;
}

export interface PercentageSplitConfig {
  method: 'percentage';
  allocations: {
    personId: string;
    percentage: number; // 0-100
  }[];
  includeTaxTips?: boolean;
  roundTo?: 'cent' | 'dollar';
}

export interface CustomAmountSplitConfig {
  method: 'custom_amount';
  allocations: {
    personId: string;
    amount: number;
  }[];
  includeTaxTips?: boolean;
}

export interface SharedItemsSplitConfig {
  method: 'shared_items';
  sharedItems: {
    itemId: string;
    personIds: string[]; // People sharing this item
    quantity?: number;
  }[];
  individualItems: {
    itemId: string;
    personId: string;
    quantity?: number;
  }[];
  includeTaxTips?: boolean;
}

export type SplitConfig = 
  | EqualSplitConfig
  | ByItemSplitConfig
  | ByPersonSplitConfig
  | PercentageSplitConfig
  | CustomAmountSplitConfig
  | SharedItemsSplitConfig;

// Result structures
export interface SplitResult {
  personId: string;
  amount: number;
  items: {
    itemId: string;
    itemName: string;
    quantity: number;
    pricePerUnit: number;
    total: number;
  }[];
  tax: number;
  tip: number;
  total: number;
}

export interface SplitCalculationResult {
  results: SplitResult[];
  totalAmount: number;
  totalTax: number;
  totalTip: number;
  isValid: boolean;
  errorMessage?: string;
}

export class SplitBillCalculator {
  private orderItems: OrderItem[];
  private subtotal: number;
  private tax: number;
  private tip: number;

  constructor(orderItems: OrderItem[], subtotal: number, tax: number, tip: number = 0) {
    this.orderItems = orderItems;
    this.subtotal = subtotal;
    this.tax = tax;
    this.tip = tip;
  }

  calculate(config: SplitConfig): SplitCalculationResult {
    switch (config.method) {
      case 'equal':
        return this.calculateEqualSplit(config);
      case 'by_item':
        return this.calculateByItemSplit(config);
      case 'by_person':
        return this.calculateByPersonSplit(config);
      case 'percentage':
        return this.calculatePercentageSplit(config);
      case 'custom_amount':
        return this.calculateCustomAmountSplit(config);
      case 'shared_items':
        return this.calculateSharedItemsSplit(config);
      default:
        return {
          results: [],
          totalAmount: 0,
          totalTax: 0,
          totalTip: 0,
          isValid: false,
          errorMessage: 'Unsupported split method'
        };
    }
  }

  private calculateEqualSplit(config: EqualSplitConfig): SplitCalculationResult {
    const { numberOfPeople, includeTaxTips = true, roundTo = 'cent' } = config;
    
    if (numberOfPeople <= 0) {
      return this.createInvalidResult('Number of people must be greater than 0');
    }

    const totalAmount = includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    let amountPerPerson = totalAmount / numberOfPeople;

    // Apply rounding
    if (roundTo === 'dollar') {
      amountPerPerson = Math.round(amountPerPerson);
    } else {
      amountPerPerson = Math.round(amountPerPerson * 100) / 100;
    }

    const results: SplitResult[] = [];
    let remainingAmount = totalAmount;

    // Create person IDs if not provided
    for (let i = 0; i < numberOfPeople; i++) {
      const personAmount = i === numberOfPeople - 1 ? remainingAmount : amountPerPerson;
      results.push({
        personId: `person_${i + 1}`,
        amount: parseFloat(personAmount.toFixed(2)),
        items: [],
        tax: includeTaxTips ? (this.tax / numberOfPeople) : 0,
        tip: includeTaxTips ? (this.tip / numberOfPeople) : 0,
        total: parseFloat(personAmount.toFixed(2))
      });
      remainingAmount -= amountPerPerson;
    }

    return {
      results,
      totalAmount,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculateByItemSplit(config: ByItemSplitConfig): SplitCalculationResult {
    const { assignments, includeTaxTips = true } = config;
    
    const personMap = new Map<string, SplitResult>();
    let calculatedSubtotal = 0;

    // Process each assignment
    for (const assignment of assignments) {
      const orderItem = this.orderItems.find(item => item.id === assignment.itemId);
      if (!orderItem) continue;

      const quantity = assignment.quantity || orderItem.quantity;
      const itemTotal = quantity * orderItem.menuItem.price;
      
      if (!personMap.has(assignment.personId)) {
        personMap.set(assignment.personId, {
          personId: assignment.personId,
          amount: 0,
          items: [],
          tax: 0,
          tip: 0,
          total: 0
        });
      }

      const personResult = personMap.get(assignment.personId)!;
      personResult.items.push({
        itemId: assignment.itemId,
        itemName: orderItem.menuItem.name,
        quantity,
        pricePerUnit: orderItem.menuItem.price,
        total: itemTotal
      });
      
      personResult.amount += itemTotal;
      calculatedSubtotal += itemTotal;
    }

    // Validate all items are assigned
    if (calculatedSubtotal !== this.subtotal) {
      return this.createInvalidResult('Not all items have been assigned');
    }

    // Distribute tax and tips proportionally
    const results = Array.from(personMap.values());
    if (includeTaxTips) {
      const totalWithTaxTip = this.subtotal + this.tax + this.tip;
      results.forEach(result => {
        const proportion = result.amount / this.subtotal;
        result.tax = this.tax * proportion;
        result.tip = this.tip * proportion;
        result.total = result.amount + result.tax + result.tip;
      });
    } else {
      results.forEach(result => {
        result.total = result.amount;
      });
    }

    return {
      results,
      totalAmount: includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculateByPersonSplit(config: ByPersonSplitConfig): SplitCalculationResult {
    const { bills, includeTaxTips = true } = config;
    
    const results: SplitResult[] = [];
    let totalCalculated = 0;

    for (const bill of bills) {
      let billAmount = 0;
      const items: SplitResult['items'] = [];

      // Calculate bill amount from item quantities
      for (const [itemId, quantity] of Object.entries(bill.itemQuantities)) {
        const orderItem = this.orderItems.find(item => item.id === itemId);
        if (orderItem) {
          const itemTotal = quantity * orderItem.menuItem.price;
          billAmount += itemTotal;
          
          items.push({
            itemId,
            itemName: orderItem.menuItem.name,
            quantity,
            pricePerUnit: orderItem.menuItem.price,
            total: itemTotal
          });
        }
      }

      // Use custom amount if provided
      const finalAmount = bill.customAmount ?? billAmount;
      
      results.push({
        personId: bill.id,
        amount: finalAmount,
        items,
        tax: 0,
        tip: 0,
        total: finalAmount
      });
      
      totalCalculated += finalAmount;
    }

    // Validate total matches
    const expectedTotal = includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    if (Math.abs(totalCalculated - expectedTotal) > 0.01) {
      return this.createInvalidResult(`Total amount (${totalCalculated.toFixed(2)}) doesn't match expected (${expectedTotal.toFixed(2)})`);
    }

    // Distribute tax and tips if included
    if (includeTaxTips && results.length > 0) {
      const totalWithoutTaxTip = results.reduce((sum, r) => sum + r.amount, 0);
      results.forEach(result => {
        const proportion = result.amount / totalWithoutTaxTip;
        result.tax = this.tax * proportion;
        result.tip = this.tip * proportion;
        result.total = result.amount + result.tax + result.tip;
      });
    }

    return {
      results,
      totalAmount: expectedTotal,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculatePercentageSplit(config: PercentageSplitConfig): SplitCalculationResult {
    const { allocations, includeTaxTips = true, roundTo = 'cent' } = config;
    
    const totalPercentage = allocations.reduce((sum, alloc) => sum + alloc.percentage, 0);
    if (Math.abs(totalPercentage - 100) > 0.01) {
      return this.createInvalidResult('Percentages must sum to 100%');
    }

    const totalAmount = includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    const results: SplitResult[] = [];

    for (const allocation of allocations) {
      let personAmount = (totalAmount * allocation.percentage) / 100;
      
      if (roundTo === 'dollar') {
        personAmount = Math.round(personAmount);
      } else {
        personAmount = Math.round(personAmount * 100) / 100;
      }

      results.push({
        personId: allocation.personId,
        amount: personAmount,
        items: [],
        tax: 0,
        tip: 0,
        total: personAmount
      });
    }

    return {
      results,
      totalAmount,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculateCustomAmountSplit(config: CustomAmountSplitConfig): SplitCalculationResult {
    const { allocations, includeTaxTips = true } = config;
    
    const totalCustomAmount = allocations.reduce((sum, alloc) => sum + alloc.amount, 0);
    const expectedTotal = includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;

    if (Math.abs(totalCustomAmount - expectedTotal) > 0.01) {
      return this.createInvalidResult(`Custom amounts (${totalCustomAmount.toFixed(2)}) don't match expected total (${expectedTotal.toFixed(2)})`);
    }

    const results: SplitResult[] = allocations.map(allocation => ({
      personId: allocation.personId,
      amount: allocation.amount,
      items: [],
      tax: 0,
      tip: 0,
      total: allocation.amount
    }));

    return {
      results,
      totalAmount: expectedTotal,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculateSharedItemsSplit(config: SharedItemsSplitConfig): SplitCalculationResult {
    const { sharedItems, individualItems, includeTaxTips = true } = config;
    
    const personMap = new Map<string, SplitResult>();
    let calculatedSubtotal = 0;

    // Process shared items
    for (const sharedItem of sharedItems) {
      const orderItem = this.orderItems.find(item => item.id === sharedItem.itemId);
      if (!orderItem) continue;

      const quantity = sharedItem.quantity || orderItem.quantity;
      const itemTotal = quantity * orderItem.menuItem.price;
      const sharePerPerson = itemTotal / sharedItem.personIds.length;

      sharedItem.personIds.forEach(personId => {
        if (!personMap.has(personId)) {
          personMap.set(personId, {
            personId,
            amount: 0,
            items: [],
            tax: 0,
            tip: 0,
            total: 0
          });
        }

        const personResult = personMap.get(personId)!;
        personResult.items.push({
          itemId: sharedItem.itemId,
          itemName: orderItem.menuItem.name,
          quantity: quantity / sharedItem.personIds.length,
          pricePerUnit: orderItem.menuItem.price,
          total: sharePerPerson
        });
        
        personResult.amount += sharePerPerson;
      });
      
      calculatedSubtotal += itemTotal;
    }

    // Process individual items
    for (const individualItem of individualItems) {
      const orderItem = this.orderItems.find(item => item.id === individualItem.itemId);
      if (!orderItem) continue;

      const quantity = individualItem.quantity || orderItem.quantity;
      const itemTotal = quantity * orderItem.menuItem.price;

      if (!personMap.has(individualItem.personId)) {
        personMap.set(individualItem.personId, {
          personId: individualItem.personId,
          amount: 0,
          items: [],
          tax: 0,
          tip: 0,
          total: 0
        });
      }

      const personResult = personMap.get(individualItem.personId)!;
      personResult.items.push({
        itemId: individualItem.itemId,
        itemName: orderItem.menuItem.name,
        quantity,
        pricePerUnit: orderItem.menuItem.price,
        total: itemTotal
      });
      
      personResult.amount += itemTotal;
      calculatedSubtotal += itemTotal;
    }

    // Validate all items are accounted for
    if (Math.abs(calculatedSubtotal - this.subtotal) > 0.01) {
      return this.createInvalidResult('Not all items have been properly assigned');
    }

    // Distribute tax and tips proportionally
    const results = Array.from(personMap.values());
    if (includeTaxTips) {
      results.forEach(result => {
        const proportion = result.amount / this.subtotal;
        result.tax = this.tax * proportion;
        result.tip = this.tip * proportion;
        result.total = result.amount + result.tax + result.tip;
      });
    } else {
      results.forEach(result => {
        result.total = result.amount;
      });
    }

    return {
      results,
      totalAmount: includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal,
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private createInvalidResult(errorMessage: string): SplitCalculationResult {
    return {
      results: [],
      totalAmount: 0,
      totalTax: 0,
      totalTip: 0,
      isValid: false,
      errorMessage
    };
  }

  // Utility methods
  static generatePersonId(index: number): string {
    return `person_${index + 1}`;
  }

  static validateSplitConfig(config: SplitConfig, orderItems: OrderItem[]): boolean {
    // Basic validation logic would go here
    return true;
  }
}