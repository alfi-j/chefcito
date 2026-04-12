import { NextResponse } from 'next/server';
import { OAuth2Client } from 'google-auth-library';
import { User } from '@/models';
import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const client = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function POST(request: Request) {
  try {
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017');
    }

    const body = await request.json();
    const { credential, role } = body;

    if (!credential) {
      return NextResponse.json({ error: 'Missing Google credential' }, { status: 400 });
    }

    // Verify the Google ID token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 });
    }

    const { email, name, sub: googleId } = payload;

    // Find existing user by googleId or email
    let user = await User.findOne({ $or: [{ googleId }, { email }] });

    if (user) {
      // Link googleId if not already set (user registered with email before)
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
    } else {
      // Create new user — role required for registration flow
      if (!role) {
        return NextResponse.json({ error: 'Role is required for new accounts' }, { status: 400 });
      }
      user = new User({
        id: uuidv4(),
        name: name || email,
        email,
        googleId,
        password: null,
        role,
        status: 'Off Shift',
      });
      await user.save();
    }

    // Generate JWT (same shape as existing login)
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'chefcito_secret_key',
      { expiresIn: '24h' }
    );

    const userObject = user.toObject();
    delete userObject.password;

    return NextResponse.json({ user: userObject, token });
  } catch (error) {
    console.error('Google auth error:', error);
    return NextResponse.json({ error: 'Google authentication failed' }, { status: 500 });
  }
}
