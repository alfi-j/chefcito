import { NextResponse } from 'next/server';

// Test the frontend workflow by simulating order creation
async function testFrontendWorkflow() {
  console.log('Testing frontend workflow...');
  
  try {
    // Simulate sending an order to the kitchen (should have status: 'pending')
    const pendingOrder = {
      table: 7,
      items: [],
      notes: 'Test order sent to kitchen',
      orderType: 'dine-in',
      status: 'pending'
    };
    
    const pendingResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(pendingOrder),
    });
    
    if (!pendingResponse.ok) {
      throw new Error(`Failed to create pending order: ${pendingResponse.status}`);
    }
    
    const pendingResult = await pendingResponse.json();
    console.log('✅ Pending order created:', {
      id: pendingResult.id,
      status: pendingResult.status,
      statusHistory: pendingResult.statusHistory
    });
    
    // Simulate completing a payment (should have status: 'completed')
    const completedOrder = {
      table: 8,
      items: [],
      notes: 'Test order with completed payment',
      orderType: 'dine-in',
      status: 'completed'
    };
    
    const completedResponse = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(completedOrder),
    });
    
    if (!completedResponse.ok) {
      throw new Error(`Failed to create completed order: ${completedResponse.status}`);
    }
    
    const completedResult = await completedResponse.json();
    console.log('✅ Completed order created:', {
      id: completedResult.id,
      status: completedResult.status,
      statusHistory: completedResult.statusHistory
    });
    
    // Verify that we can retrieve the orders
    const getOrdersResponse = await fetch('http://localhost:3000/api/orders');
    if (!getOrdersResponse.ok) {
      throw new Error(`Failed to retrieve orders: ${getOrdersResponse.status}`);
    }
    
    const orders = await getOrdersResponse.json();
    console.log('✅ Retrieved orders list, total orders:', orders.length);
    
    // Check that our new orders are in the list with correct status
    const ourPendingOrder = orders.find((o: any) => o.id === pendingResult.id);
    const ourCompletedOrder = orders.find((o: any) => o.id === completedResult.id);
    
    if (ourPendingOrder && ourPendingOrder.status === 'pending') {
      console.log('✅ Pending order correctly stored with status "pending"');
    } else {
      console.error('❌ Pending order not found or has wrong status');
    }
    
    if (ourCompletedOrder && ourCompletedOrder.status === 'completed') {
      console.log('✅ Completed order correctly stored with status "completed"');
    } else {
      console.error('❌ Completed order not found or has wrong status');
    }
    
    console.log('🎉 Frontend workflow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during frontend workflow test:', error);
  }
}

testFrontendWorkflow();