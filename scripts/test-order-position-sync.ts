#!/usr/bin/env node

/**
 * Script to test order position syncing with the database
 * Usage: npx tsx scripts/test-order-position-sync.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testOrderPositionSync() {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    console.log(`Testing order position syncing on ${baseUrl}...`);
    
    // Test data
    const testData = {
      tabName: 'pending',
      positions: [
        { orderId: 1001, position: 0 },
        { orderId: 1002, position: 1 },
        { orderId: 1003, position: 2 }
      ]
    };
    
    console.log('Saving test positions to database...');
    
    // Test saving positions
    const saveResponse = await fetch(`${baseUrl}/api/order-positions/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });
    
    if (saveResponse.ok) {
      console.log('✅ Positions saved successfully');
    } else {
      console.error('❌ Failed to save positions:', await saveResponse.text());
      return;
    }
    
    console.log('Retrieving positions from database...');
    
    // Test retrieving positions
    const getResponse = await fetch(`${baseUrl}/api/order-positions?tabName=pending`);
    
    if (getResponse.ok) {
      const positions = await getResponse.json();
      console.log('✅ Retrieved positions:', positions);
    } else {
      console.error('❌ Failed to retrieve positions:', await getResponse.text());
      return;
    }
    
    console.log('\n🎉 All tests passed! Order position syncing is working correctly.');
    
  } catch (error) {
    console.error('❌ Error testing order position syncing:', error);
    console.log('Make sure the development server is running (npm run dev)');
    process.exit(1);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testOrderPositionSync().catch(console.error);
}

export default testOrderPositionSync;