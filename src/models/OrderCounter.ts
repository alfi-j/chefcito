import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderCounter extends Document {
  restaurantId: string;
  date: string;
  lastOrderNumber: number;
}

const OrderCounterSchema: Schema = new Schema({
  restaurantId: { type: String, required: true },
  date: { type: String, required: true },
  lastOrderNumber: { type: Number, default: 0 },
});

OrderCounterSchema.index({ restaurantId: 1, date: 1 }, { unique: true });

const OrderCounter = mongoose.models.OrderCounter || mongoose.model<IOrderCounter>('OrderCounter', OrderCounterSchema, 'ordercounters');
export default OrderCounter;