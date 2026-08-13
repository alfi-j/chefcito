import Invitation from '@/models/Invitation';

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function normalizeEmail(email?: string): string | null {
  if (!email) return null;
  const trimmed = email.trim();
  return trimmed ? trimmed.toLowerCase() : null;
}

export interface ClaimedInvitation {
  token: string;
  role: string;
  restaurantId: string;
  restaurantName: string;
  expiresAt: Date;
  usedAt?: Date | null;
}

/**
 * Atomically claims an unexpired, unused invitation.
 * Returns the invitation on success, or an error object with an HTTP status.
 */
export async function claimInvitation(
  token: string
): Promise<{ invitation: ClaimedInvitation } | { status: number; error: string }> {
  const now = new Date();
  const invitation = await Invitation.findOneAndUpdate(
    { token, usedAt: null, expiresAt: { $gt: now } },
    { $set: { usedAt: now } },
    { new: true }
  );

  if (invitation) {
    return { invitation };
  }

  const existing = await Invitation.findOne({ token });
  if (!existing) return { status: 404, error: 'Invalid invitation' };
  if (existing.usedAt) return { status: 410, error: 'Invitation already used' };
  return { status: 410, error: 'Invitation expired' };
}