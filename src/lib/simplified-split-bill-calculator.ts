import { type OrderItem } from '@/lib/types';

// Simplified split bill method types - only 2 methods
export type SplitMethod = 'equal' | 'custom_amount';

// Simplified data structures for the 2 methods only

export interface EqualSplitConfig {
  method: 'equal';
  numberOfPeople: number;
  includeTaxTips?: boolean;
  roundTo?: 'cent' | 'dollar';
}

export interface CustomAmountSplitConfig {
  method: 'custom_amount';
  allocations: {
    personName: string;
    amount: number;
  }[];
  includeTaxTips?: boolean;
}

export type SplitConfig = EqualSplitConfig | CustomAmountSplitConfig;

// Result structures
export interface SplitResult {
  personId: string;
  personName: string;
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
}

export interface SplitCalculationResult {
  results: SplitResult[];
  totalAmount: number;
  totalTax: number;
  totalTip: number;
  isValid: boolean;
  errorMessage?: string;
}

export class SimplifiedSplitBillCalculator {
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
    // First validate the configuration
    const validationError = this.validateConfig(config);
    if (validationError) {
      return this.createInvalidResult(validationError);
    }

    switch (config.method) {
      case 'equal':
        return this.calculateEqualSplit(config);
      case 'custom_amount':
        return this.calculateCustomAmountSplit(config);
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

  private validateConfig(config: SplitConfig): string | null {
    // Validate common fields
    if (config.includeTaxTips && (this.tax < 0 || this.tip < 0)) {
      return 'Tax and tip amounts must be non-negative';
    }

    switch (config.method) {
      case 'equal':
        return this.validateEqualSplit(config);
      case 'custom_amount':
        return this.validateCustomAmountSplit(config);
      default:
        return 'Invalid split method';
    }
  }

  private validateEqualSplit(config: EqualSplitConfig): string | null {
    if (config.numberOfPeople <= 0) {
      return 'Number of people must be greater than 0';
    }
    
    if (config.numberOfPeople > 50) {
      return 'Number of people cannot exceed 50';
    }
    
    if (!Number.isInteger(config.numberOfPeople)) {
      return 'Number of people must be a whole number';
    }
    
    return null;
  }

  private validateCustomAmountSplit(config: CustomAmountSplitConfig): string | null {
    if (config.allocations.length === 0) {
      return 'At least one person must be added';
    }
    
    if (config.allocations.length > 50) {
      return 'Cannot have more than 50 people';
    }

    let totalAmount = 0;
    
    for (const allocation of config.allocations) {
      // Person name is optional - will be auto-generated as "Person 1", "Person 2", etc.
      if (allocation.personName && allocation.personName.trim().length > 50) {
        return 'Person names cannot exceed 50 characters';
      }
      
      // Ensure amount is a number (defensive programming)
      const amount = typeof allocation.amount === 'string' 
        ? parseFloat(allocation.amount) 
        : allocation.amount;
      
      if (isNaN(amount) || amount < 0) {
        return 'Amounts must be non-negative numbers';
      }
      
      if (amount > 10000) {
        return 'Individual amounts cannot exceed $10,000';
      }
      
      totalAmount += amount;
    }

    const expectedTotal = config.includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    const difference = Math.abs(totalAmount - expectedTotal);
    
    if (difference > 0.01) {
      return `Total amounts ($${totalAmount.toFixed(2)}) must equal the bill total ($${expectedTotal.toFixed(2)})`;
    }

    return null;
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

  private calculateEqualSplit(config: EqualSplitConfig): SplitCalculationResult {
    const { numberOfPeople, includeTaxTips = true, roundTo = 'cent' } = config;
    
    const totalAmount = includeTaxTips ? this.subtotal + this.tax + this.tip : this.subtotal;
    const perPersonAmount = this.roundAmount(totalAmount / numberOfPeople, roundTo);
    
    // Distribute any rounding differences to first few people
    const results: SplitResult[] = [];
    let distributedAmount = 0;
    
    for (let i = 0; i < numberOfPeople; i++) {
      const isLastPerson = i === numberOfPeople - 1;
      const personAmount = isLastPerson ? totalAmount - distributedAmount : perPersonAmount;
      
      results.push({
        personId: `person_${i + 1}`,
        personName: `Person ${i + 1}`,
        amount: parseFloat(personAmount.toFixed(2)),
        items: [], // Equal split doesn't assign specific items
        tax: includeTaxTips ? this.roundAmount((this.tax / numberOfPeople), roundTo) : 0,
        tip: includeTaxTips ? this.roundAmount((this.tip / numberOfPeople), roundTo) : 0
      });
      
      distributedAmount += personAmount;
    }

    return {
      results,
      totalAmount: parseFloat(distributedAmount.toFixed(2)),
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private calculateCustomAmountSplit(config: CustomAmountSplitConfig): SplitCalculationResult {
    const { allocations, includeTaxTips = true } = config;
    
    const results: SplitResult[] = allocations.map((allocation, index) => {
      // Ensure amount is a number
      const amount = typeof allocation.amount === 'string' 
        ? parseFloat(allocation.amount) 
        : allocation.amount;
      
      return {
        personId: `person_${index + 1}`,
        personName: allocation.personName,
        amount: parseFloat(amount.toFixed(2)),
        items: [], // Custom amount doesn't assign specific items
        tax: 0, // Tax/tip distribution handled separately
        tip: 0
      };
    });

    // Distribute tax and tips proportionally if requested
    if (includeTaxTips && (this.tax > 0 || this.tip > 0)) {
      const totalCustomAmount = allocations.reduce((sum, alloc) => {
        const amount = typeof alloc.amount === 'string' ? parseFloat(alloc.amount) : alloc.amount;
        return sum + amount;
      }, 0);
      
      results.forEach(result => {
        const proportion = result.amount / totalCustomAmount;
        result.tax = this.roundAmount(this.tax * proportion, 'cent');
        result.tip = this.roundAmount(this.tip * proportion, 'cent');
      });
    }

    return {
      results,
      totalAmount: parseFloat(allocations.reduce((sum, alloc) => {
        const amount = typeof alloc.amount === 'string' ? parseFloat(alloc.amount) : alloc.amount;
        return sum + amount;
      }, 0).toFixed(2)),
      totalTax: includeTaxTips ? this.tax : 0,
      totalTip: includeTaxTips ? this.tip : 0,
      isValid: true
    };
  }

  private roundAmount(amount: number, roundTo: 'cent' | 'dollar'): number {
    switch (roundTo) {
      case 'dollar':
        return Math.round(amount);
      case 'cent':
      default:
        return Math.round(amount * 100) / 100;
    }
  }
}