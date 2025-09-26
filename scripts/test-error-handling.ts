// Test error handling improvements
async function testErrorHandling() {
  console.log('Testing error handling improvements...');
  
  try {
    // Test 1: Missing table number
    console.log('\n1. Testing missing table number...');
    const response1 = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        notes: 'Test order with missing table',
        orderType: 'dine-in',
        status: 'pending'
      }),
    });
    
    if (!response1.ok) {
      const error = await response1.json();
      console.log('✅ Correctly caught error:', error.error);
    } else {
      console.log('❌ Should have returned an error');
    }
    
    // Test 2: Invalid order type
    console.log('\n2. Testing invalid order type...');
    const response2 = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: 9,
        notes: 'Test order with invalid order type',
        orderType: 'invalid-type',
        status: 'pending'
      }),
    });
    
    if (!response2.ok) {
      const error = await response2.json();
      console.log('✅ Correctly caught error:', error.error);
    } else {
      console.log('❌ Should have returned an error');
    }
    
    // Test 3: Invalid status
    console.log('\n3. Testing invalid status...');
    const response3 = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: 10,
        notes: 'Test order with invalid status',
        orderType: 'dine-in',
        status: 'invalid-status'
      }),
    });
    
    if (!response3.ok) {
      const error = await response3.json();
      console.log('✅ Correctly caught error:', error.error);
    } else {
      console.log('❌ Should have returned an error');
    }
    
    // Test 4: Valid order (should succeed)
    console.log('\n4. Testing valid order creation...');
    const response4 = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        table: 11,
        notes: 'Test valid order',
        orderType: 'dine-in',
        status: 'pending'
      }),
    });
    
    if (response4.ok) {
      const result = await response4.json();
      console.log('✅ Valid order created successfully:', {
        id: result.id,
        status: result.status
      });
    } else {
      const error = await response4.json();
      console.log('❌ Valid order should have succeeded:', error.error);
    }
    
    console.log('\n🎉 Error handling tests completed!');
    
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

testErrorHandling();