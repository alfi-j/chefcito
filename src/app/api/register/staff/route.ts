import { NextResponse } from 'next/server';
import User from '@/models/User';
import Invitation from '@/models/Invitation';
import { v4 as uuidv4 } from 'uuid';
import { initializeDatabase } from '@/lib/database-service';
import { claimInvitation, escapeRegex, normalizeEmail } from '@/lib/invitations';

// POST /api/register/staff — register a staff account via invitation token
export async function POST(request: Request) {
  try {
    await initializeDatabase();

    const body = await request.json();
    const { token, username, password, email } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'token is required' }, { status: 400 });
    }
    if (!username || typeof username !== 'string' || !username.trim()) {
      return NextResponse.json({ error: 'username is required' }, { status: 400 });
    }
    if (!password || typeof password !== 'string' || password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const normalizedUsername = username.trim();
    const normalizedEmail = normalizeEmail(email);

    // Atomically claim the invitation so it cannot be reused twice.
    const claim = await claimInvitation(token);
    if ('status' in claim) {
      return NextResponse.json({ error: claim.error }, { status: claim.status });
    }
    const invitation = claim.invitation;

    const existingUsername = await User.findOne({
      username: { $regex: `^${escapeRegex(normalizedUsername)}$`, $options: 'i' },
    });
    if (existingUsername) {
      return NextResponse.json({ error: 'Username already taken' }, { status: 409 });
    }

    if (normalizedEmail) {
      const existingEmail = await User.findOne({ email: normalizedEmail });
      if (existingEmail) {
        return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
      }
    }

    const user = new User({
      id: uuidv4(),
      name: normalizedUsername,
      username: normalizedUsername,
      email: normalizedEmail || null,
      password,
      role: invitation.role,
      restaurantId: invitation.restaurantId,
      restaurantIds: [invitation.restaurantId],
      status: 'Off Shift',
    });
    try {
      await user.save();
    } catch (error) {
      // Roll back the claim so the invite can be retried after a failed save.
      await Invitation.updateOne({ token }, { $unset: { usedAt: 1 } });
      throw error;
    }

    return NextResponse.json({ message: 'Account created successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error registering staff:', error);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }
}