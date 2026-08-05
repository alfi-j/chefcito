import { NextResponse } from 'next/server';
import { Restaurant, User } from '@/models';
import { errorReporter } from '@/lib/helpers';
import { connectToDatabase, isDatabaseConnected } from '@/lib/mongo-init';
import { v4 as uuidv4 } from 'uuid';
import { seedRestaurantData } from '@/lib/seed-data';

// Define response structure
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: string;
}

// Helper function to create standardized API responses
function createApiResponse<T>(data?: T, error?: string): ApiResponse<T> {
  return {
    success: !error,
    data,
    error,
    timestamp: new Date().toISOString()
  };
}

export async function GET(request: Request) {
  try {
    // Ensure mongoose is connected using centralized function
    if (!isDatabaseConnected()) {
      await connectToDatabase();
    }

    const { searchParams } = new URL(request.url);
    const ids = searchParams.get('ids');
    const singleId = searchParams.get('id');

    const whitelist = ids ? ids.split(',').map((s: string) => s.trim()).filter(Boolean) : (singleId ? [singleId] : []);
    const query = whitelist.length > 0 ? { id: { $in: whitelist } } : { id: { $in: [] } };

    const restaurants = await Restaurant.find(query);
    
    // Validate response data
    if (!Array.isArray(restaurants)) {
      throw new Error('Invalid data format received from database');
    }
    
    return NextResponse.json(
      createApiResponse(restaurants.map(r => r.toObject())),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error fetching restaurants:', error);
    
    // Use the enhanced error reporting utility
    const errorResponse = errorReporter.createErrorResponse(
      error, 
      { 
        operation: 'GET /api/restaurants',
        timestamp: new Date().toISOString()
      }
    );
    
    return NextResponse.json(
      createApiResponse(undefined, errorResponse.message),
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    // Ensure mongoose is connected using centralized function
    if (!isDatabaseConnected()) {
      await connectToDatabase();
    }
    
    const restaurantData = await request.json();
    
    // Generate a unique ID if not provided
    if (!restaurantData.id) {
      restaurantData.id = uuidv4();
    }
    
    // Create new restaurant
    const newRestaurant = new Restaurant(restaurantData);
    const savedRestaurant = await newRestaurant.save();

    // Link the restaurant to its owner so a single person can manage multiple restaurants.
    if (restaurantData.ownerId) {
      await User.updateOne(
        { id: restaurantData.ownerId },
        {
          $set: { restaurantId: savedRestaurant.id },
          $addToSet: { restaurantIds: savedRestaurant.id }
        }
      );
    }

    // Seed default data so new users can test the app immediately
    await seedRestaurantData(savedRestaurant.id);
    
    return NextResponse.json(
      createApiResponse(savedRestaurant.toObject()),
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error('Error saving restaurants:', error);
    
    // Use the enhanced error reporting utility
    const errorResponse = errorReporter.createErrorResponse(
      error,
      {
        operation: 'POST /api/restaurants',
        timestamp: new Date().toISOString()
      }
    );
    
    return NextResponse.json(
      createApiResponse(undefined, errorResponse.message),
      { status: 500 }
    );
  }
}