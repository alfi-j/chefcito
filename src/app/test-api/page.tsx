"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { 
  categoriesApi,
  menuItemsApi,
  paymentMethodsApi,
  customersApi,
  inventoryApi,
  ordersApi,
  staffApi,
  tasksApi
} from '@/lib/api-client';

export default function TestApiPage() {
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(false);

  const runAllTests = async () => {
    setLoading(true);
    const results: Record<string, any> = {};

    try {
      // Test categories
      results.categories = await categoriesApi.getAll();
    } catch (error) {
      results.categories = { error: (error as Error).message };
    }

    try {
      // Test menu items
      results.menuItems = await menuItemsApi.getAll();
    } catch (error) {
      results.menuItems = { error: (error as Error).message };
    }

    try {
      // Test payment methods
      results.paymentMethods = await paymentMethodsApi.getAll();
    } catch (error) {
      results.paymentMethods = { error: (error as Error).message };
    }

    try {
      // Test customers
      results.customers = await customersApi.getAll();
    } catch (error) {
      results.customers = { error: (error as Error).message };
    }

    try {
      // Test inventory
      results.inventory = await inventoryApi.getAll();
    } catch (error) {
      results.inventory = { error: (error as Error).message };
    }

    try {
      // Test orders
      results.orders = await ordersApi.getAll();
    } catch (error) {
      results.orders = { error: (error as Error).message };
    }

    try {
      // Test staff
      results.staff = await staffApi.getAll();
    } catch (error) {
      results.staff = { error: (error as Error).message };
    }

    try {
      // Test tasks
      results.tasks = await tasksApi.getAll();
    } catch (error) {
      results.tasks = { error: (error as Error).message };
    }

    setTestResults(results);
    setLoading(false);
  };

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">API Integration Test</h1>
      
      <Button onClick={runAllTests} disabled={loading} className="mb-6">
        {loading ? 'Testing...' : 'Run All Tests'}
      </Button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Object.entries(testResults).map(([key, value]) => (
          <div key={key} className="border rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-2 capitalize">{key}</h2>
            {value?.error ? (
              <div className="text-red-500">Error: {value.error}</div>
            ) : (
              <div>
                <div>Success: {Array.isArray(value) ? `${value.length} items` : 'Data received'}</div>
                <pre className="text-xs mt-2 max-h-32 overflow-auto">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {Object.keys(testResults).length === 0 && !loading && (
        <div className="text-center text-gray-500 mt-8">
          Click "Run All Tests" to test the API integration
        </div>
      )}
    </div>
  );
}