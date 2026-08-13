import { NextResponse } from 'next/server';
import Restaurant from '@/models/Restaurant';
import Category from '@/models/Category';
import MenuItem from '@/models/MenuItem';
import Order from '@/models/Order';
import OrderCounter from '@/models/OrderCounter';
import Inventory from '@/models/Inventory';
import Customer from '@/models/Customer';
import Payment from '@/models/Payment';
import User from '@/models/User';
import Workstation from '@/models/Workstation';
import Subscription from '@/models/Subscription';
import Invitation from '@/models/Invitation';
import Role from '@/models/Role';
import { initializeDatabase } from '@/lib/database-service';
import { hasProAccess } from '@/lib/subscription-access';

/**
 * Collections tied to a restaurant that must be purged when it is deleted.
 * Keyed by model so everything referencing restaurantId is cleaned up.
 */
const RESTAURANT_DATA_MODELS: {
  model: {
    deleteMany: (filter: Record<string, unknown>) => Promise<unknown>;
  };
  filter: (id: string) => Record<string, unknown>;
}[] = [
  { model: Category, filter: (id: string) => ({ restaurantId: id }) },
  { model: MenuItem, filter: (id: string) => ({ restaurantId: id }) },
  { model: Order, filter: (id: string) => ({ restaurantId: id }) },
  { model: OrderCounter, filter: (id: string) => ({ restaurantId: id }) },
  { model: Inventory, filter: (id: string) => ({ restaurantId: id }) },
  { model: Customer, filter: (id: string) => ({ restaurantId: id }) },
  { model: Payment, filter: (id: string) => ({ restaurantId: id }) },
  { model: Workstation, filter: (id: string) => ({ restaurantId: id }) },
  { model: Subscription, filter: (id: string) => ({ restaurantId: id }) },
  { model: Invitation, filter: (id: string) => ({ restaurantId: id }) },
  { model: Role, filter: (id: string) => ({ restaurantId: id }) },
  {
    model: User,
    filter: (id: string) => ({
      $or: [{ restaurantId: id }, { restaurantIds: id }]
    })
  }
];

/**
 * GET /api/restaurants/[id]
 * Returns a single restaurant by ID with membership info
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;

    const restaurant = await Restaurant.findOne({ id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Re-evaluate membership on read so an expired subscription downgrades
    // the restaurant (and everything gated behind Pro) automatically.
    if (restaurant.membership === 'pro') {
      await hasProAccess(id);
      const refreshed = await Restaurant.findOne({ id });
      if (refreshed) return NextResponse.json(refreshed.toObject());
    }

    return NextResponse.json(restaurant.toObject());
  } catch (error) {
    console.error('[Restaurant GET] Error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch restaurant' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/restaurants/[id]
 * Update restaurant details (name, phone, address, city)
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;
    const body = await request.json();

    const restaurant = await Restaurant.findOne({ id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Only the owner can edit the restaurant (fall back to allow for legacy records without an ownerId)
    if (body.ownerId && restaurant.ownerId && restaurant.ownerId !== body.ownerId) {
      return NextResponse.json(
        { error: 'Forbidden: you are not the owner of this restaurant' },
        { status: 403 }
      );
    }

    // Update allowed fields
    if (body.name !== undefined) restaurant.name = body.name;
    if (body.phone !== undefined) restaurant.phone = body.phone;
    if (body.address !== undefined) restaurant.address = body.address;
    if (body.city !== undefined) restaurant.city = body.city;
    if (body.country !== undefined) restaurant.country = body.country;

    await restaurant.save();

    return NextResponse.json(restaurant.toObject());
  } catch (error) {
    console.error('[Restaurant PUT] Error:', error);
    return NextResponse.json(
      { error: 'Failed to update restaurant' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/restaurants/[id]
 * Permanently deletes a restaurant and all of its associated data.
 * Owner-only: the request must include the restaurant's ownerId, which is
 * checked against the stored record (legacy records without ownerId are allowed).
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await initializeDatabase();
    const { id } = await params;

    const restaurant = await Restaurant.findOne({ id });

    if (!restaurant) {
      return NextResponse.json(
        { error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Ownership check — only the owner can delete their restaurant
    const body = await request.json().catch(() => ({}));
    if (restaurant.ownerId && body.ownerId && restaurant.ownerId !== body.ownerId) {
      return NextResponse.json(
        { error: 'Forbidden: you are not the owner of this restaurant' },
        { status: 403 }
      );
    }

    // Purge all restaurant-scoped data first
    for (const { model, filter } of RESTAURANT_DATA_MODELS) {
      await model.deleteMany(filter(id));
    }

    // Finally remove the restaurant itself
    await Restaurant.deleteOne({ id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Restaurant DELETE] Error:', error);
    return NextResponse.json(
      { error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}
