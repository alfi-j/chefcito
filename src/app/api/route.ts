// This is a placeholder file to ensure the api directory is created
// Actual API routes will be created in separate directories

// For the standalone API deployment, this file can serve as a health check endpoint
export async function GET() {
  return new Response(JSON.stringify({ 
    message: 'Chefcito API is running',
    timestamp: new Date().toISOString()
  }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}