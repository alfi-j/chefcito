import { NextResponse } from 'next/server';
import Invitation from '@/models/Invitation';
import User from '@/models/User';
import Restaurant from '@/models/Restaurant';
import Role from '@/models/Role';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '@/lib/database-service';
import { requireAuth } from '@/lib/auth';
import { PREDEFINED_ROLES } from '@/lib/access-control';

// POST /api/invitations — owner (or user_management role) creates an invitation link
export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const auth = await requireAuth(request);
    if (!auth?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { role } = body;

    if (!role || typeof role !== 'string') {
      return NextResponse.json({ error: 'role is required' }, { status: 400 });
    }

    // Never allow inviting someone as the Owner — that account is created via signup.
    if (role === 'Owner') {
      return NextResponse.json({ error: 'Cannot invite an Owner' }, { status: 400 });
    }

    const user = await User.findOne({ id: auth.userId });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Resolve the restaurant server-side from the authenticated user's membership,
    // never from client-supplied values.
    const restaurantId = user.restaurantId || user.restaurantIds?.[0] || null;
    if (!restaurantId) {
      return NextResponse.json({ error: 'User has no restaurant' }, { status: 400 });
    }

    const restaurant = await Restaurant.findOne({ id: restaurantId });
    if (!restaurant) {
      return NextResponse.json({ error: 'Restaurant not found' }, { status: 404 });
    }

    // Authorization: the caller must be the Owner or hold a role with user_management.
    let canManageUsers = user.role === 'Owner' || user.role === 'Admin';
    if (!canManageUsers && PREDEFINED_ROLES[user.role]) {
      canManageUsers = PREDEFINED_ROLES[user.role].includes('user_management');
    }
    if (!canManageUsers) {
      const customRole = user.role
        ? await Role.findOne({ restaurantId, name: user.role })
        : null;
      canManageUsers = !!customRole?.permissions?.includes('user_management');
    }
    if (!canManageUsers) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate the invited role exists for this restaurant (predefined or custom).
    const isPredefinedRole = !!PREDEFINED_ROLES[role] && role !== 'Owner';
    if (!isPredefinedRole) {
      const existingRole = await Role.findOne({ restaurantId, name: role });
      if (!existingRole) {
        return NextResponse.json({ error: 'Role does not exist for this restaurant' }, { status: 400 });
      }
    }

    const token = uuidv4();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await Invitation.create({
      token,
      ownerId: user.id,
      restaurantId: restaurant.id,
      restaurantName: restaurant.name,
      role,
      expiresAt,
    });

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const link = `${baseUrl}/register?token=${token}`;

    return NextResponse.json({ token, link, expiresAt });
  } catch (error) {
    console.error('Error creating invitation:', error);
    return NextResponse.json({ error: 'Failed to create invitation' }, { status: 500 });
  }
}