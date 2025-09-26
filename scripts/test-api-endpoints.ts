#!/usr/bin/env node

/**
 * Script to test the order positions API endpoints
 * Usage: npx tsx scripts/test-api-endpoints.ts
 */

import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function testAPI() {
  // Use port 3001 since 3000 might be in use
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3001';
  
  try {
    console.log(`Testing API endpoints on ${baseUrl}...`);
    
    // Test GET endpoint
    console.log('\n1. Testing GET endpoint...');
    const getResponse = await fetch(`${baseUrl}/api/order-positions?tabName=pending`);
    const getData = await getResponse.json();
    console.log('GET response:', getData);
    
    // Test PUT endpoint
    console.log('\n2. Testing PUT endpoint...');
    const putResponse = await fetch(`${baseUrl}/api/order-positions/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tabName: 'pending',
        positions: [
          { orderId: 1001, position: 0 },
          { orderId: 1002, position: 1 },
          { orderId: 1003, position: 2 }
        ]
      })
    });
    
    console.log('PUT response status:', putResponse.status);
    if (putResponse.ok) {
      const putData = await putResponse.json();
      console.log('PUT response data:', putData);
    } else {
      console.log('PUT response error:', await putResponse.text());
    }
    
    // Test GET again to see if data was saved
    console.log('\n3. Testing GET endpoint again...');
    const getResponse2 = await fetch(`${baseUrl}/api/order-positions?tabName=pending`);
    const getData2 = await getResponse2.json();
    console.log('GET response after PUT:', getData2);
    
    // Test with another tab
    console.log('\n4. Testing with completed tab...');
    const putResponse2 = await fetch(`${baseUrl}/api/order-positions/batch`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        tabName: 'completed',
        positions: [
          { orderId: 2001, position: 0 },
          { orderId: 2002, position: 1 }
        ]
      })
    });
    
    if (putResponse2.ok) {
      console.log('PUT to completed tab successful');
    } else {
      console.log('PUT to completed tab failed:', await putResponse2.text());
    }
    
    const getResponse3 = await fetch(`${baseUrl}/api/order-positions?tabName=completed`);
    const getData3 = await getResponse3.json();
    console.log('GET completed tab data:', getData3);
    
    console.log('\n🎉 All tests completed!');
  } catch (error) {
    console.error('❌ Error testing API:', error);
  }
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAPI().catch(console.error);
}

export default testAPI;