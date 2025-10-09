import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentMethod extends Document {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'bank_transfer';
  enabled: boolean;
  banks?: string[];
}

const PaymentMethodSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  type: {
    type: String,
    required: true,
    enum: ['cash', 'card', 'bank_transfer']
  },
  enabled: { type: Boolean, required: true },
  banks: [{ type: String }]
});

export default mongoose.model<IPaymentMethod>('PaymentMethod', PaymentMethodSchema);