import mongoose, { Schema, Document } from 'mongoose';

export interface ISubscription extends Document {
  id: string;
  userId: string;
  userEmail: string;
  plan: 'free' | 'pro';
  status: 'active' | 'cancelled' | 'expired' | 'pending';
  payphoneTransactionId?: string;
  startDate: Date;
  endDate?: Date;
  nextBillingDate?: Date;
  amount: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

const SubscriptionSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  userId: { type: String, required: true, index: true },
  userEmail: { type: String, required: true },
  plan: {
    type: String,
    required: true,
    enum: ['free', 'pro'],
    default: 'free'
  },
  status: {
    type: String,
    required: true,
    enum: ['active', 'cancelled', 'expired', 'pending'],
    default: 'pending'
  },
  payphoneTransactionId: { type: String },
  startDate: { type: Date, required: true, default: Date.now },
  endDate: { type: Date },
  nextBillingDate: { type: Date },
  amount: { type: Number, required: true },
  currency: { type: String, required: true, default: 'USD' }
}, {
  timestamps: true
});

// Index for efficient querying
SubscriptionSchema.index({ userId: 1, status: 1 });
SubscriptionSchema.index({ nextBillingDate: 1 });

// Prevent model recompilation in development mode
const Subscription = mongoose.models.Subscription || mongoose.model<ISubscription>('Subscription', SubscriptionSchema, 'subscriptions');
export default Subscription;