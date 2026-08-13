import { NextResponse } from 'next/server';
import Invitation from '@/models/Invitation';
import { initializeDatabase } from '@/lib/database-service';

// GET /api/invitations/[token] — validate a token and return invitation info
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    await initializeDatabase();

    const { token } = await params;
    const invitation = await Invitation.findOne({ token });

    if (!invitation) {
      return NextResponse.json({ error: 'Invalid invitation' }, { status: 404 });
    }

    if (invitation.usedAt) {
      return NextResponse.json({ error: 'Invitation already used' }, { status: 410 });
    }

    if (new Date() > invitation.expiresAt) {
      return NextResponse.json({ error: 'Invitation expired' }, { status: 410 });
    }

    return NextResponse.json({
      restaurantName: invitation.restaurantName,
      role: invitation.role,
      expiresAt: invitation.expiresAt,
    });
  } catch (error) {
    console.error('Error validating invitation:', error);
    return NextResponse.json({ error: 'Failed to validate invitation' }, { status: 500 });
  }
}