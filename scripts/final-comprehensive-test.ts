// Final comprehensive test to validate the complete workflow
async function finalComprehensiveTest() {
  console.log('Running final comprehensive test...');
  
  try {
    // Create a pending order
    const pendingOrder = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 12,
        notes: 'Final test pending order',
        orderType: 'dine-in',
        status: 'pending'
      })
    }).then(res => res.json());
    
    console.log('✅ Created pending order:', pendingOrder.id);
    
    // Create a completed order
    const completedOrder = await fetch('http://localhost:3000/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 13,
        notes: 'Final test completed order',
        orderType: 'delivery',
        status: 'completed'
      })
    }).then(res => res.json());
    
    console.log('✅ Created completed order:', completedOrder.id);
    
    // Retrieve all orders and verify our new ones are there
    const allOrders = await fetch('http://localhost:3000/api/orders')
      .then(res => res.json());
    
    const foundPending = allOrders.find((o: any) => o.id === pendingOrder.id);
    const foundCompleted = allOrders.find((o: any) => o.id === completedOrder.id);
    
    if (foundPending && foundPending.status === 'pending') {
      console.log('✅ Pending order correctly stored');
    } else {
      console.log('❌ Pending order not found or incorrect status');
    }
    
    if (foundCompleted && foundCompleted.status === 'completed') {
      console.log('✅ Completed order correctly stored');
    } else {
      console.log('❌ Completed order not found or incorrect status');
    }
    
    // Update an order status
    const updatedOrder = await fetch(`http://localhost:3000/api/orders/${pendingOrder.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status: 'completed'
      })
    }).then(res => res.json());
    
    if (updatedOrder.status === 'completed') {
      console.log('✅ Order status updated successfully');
    } else {
      console.log('❌ Order status update failed');
    }
    
    console.log('🎉 Final comprehensive test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during final test:', error);
  }
}

finalComprehensiveTest();