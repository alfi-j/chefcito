// Debug utilities for error reporting and debugging

export interface ErrorContext {
  operation?: string;
  timestamp?: string;
  userId?: string;
  endpoint?: string;
  [key: string]: any;
}

export interface ErrorResponse {
  message: string;
  stack?: string;
  context?: ErrorContext;
  timestamp: string;
}

class ErrorReporter {
  createErrorResponse(error: any, context?: ErrorContext): ErrorResponse {
    return {
      message: error.message || 'An unknown error occurred',
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString()
    };
  }
  
  logError(error: any, context?: ErrorContext) {
    const errorResponse = this.createErrorResponse(error, context);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorResponse);
    }
    
    // In production, you might want to send this to a logging service
    // For example: sendToLoggingService(errorResponse);
  }
  
  // Utility function to wrap async operations with error handling
  async withErrorHandling<T>(
    operation: () => Promise<T>, 
    context?: ErrorContext
  ): Promise<T> {
    try {
      return await operation();
    } catch (error: any) {
      this.logError(error, context);
      throw error;
    }
  }
}

export const errorReporter = new ErrorReporter();

// Utility functions for debugging
export function logDebug(message: string, data?: any) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DEBUG] ${new Date().toISOString()}: ${message}`, data || '');
  }
}

export function logError(error: any, context?: ErrorContext) {
  errorReporter.logError(error, context);
}

export function formatError(error: any): string {
  if (error === null) {
    return 'null';
  }

  if (error === undefined) {
    return 'undefined';
  }

  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return `${error.message}\n${error.stack || ''}`;
  }
  
  return JSON.stringify(error);
}

import debug from 'debug';

// Create debug instances for different parts of the application
export const debugInventory = debug('chefcito:inventory');
export const debugOrders = debug('chefcito:orders');
export const debugAPI = debug('chefcito:api');
export const debugDB = debug('chefcito:db');
export const debugAuth = debug('chefcito:auth');
export const debugMenu = debug('chefcito:menu');
export const debugPayments = debug('chefcito:payments');
export const debugWorkstations = debug('chefcito:workstations');
export const debugReports = debug('chefcito:reports');

// Enable colors for better readability
debug.enable('chefcito:*');
