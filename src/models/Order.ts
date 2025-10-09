import mongoose, { Schema, Document } from 'mongoose';

interface IOrderItem {
  id: string;
  menuItemId: string;
  quantity: number;
  cookedCount: number;
  newCount: number;
  cookingCount: number;
  readyCount: number;
  servedCount: number;
  selectedExtraIds?: string[];
  splitId?: number;
  notes?: string;
}

interface IOrderStatusUpdate {
  status: string;
  timestamp: Date;
}

interface IDeliveryInfo {
  name: string;
  address: string;
  phone: string;
}

export interface IOrder extends Document {
  id: number;
  items: IOrderItem[];
  status: 'pending' | 'completed';
  createdAt: Date;
  completedAt?: Date;
  table: number;
  isPinned?: boolean;
  customerId?: string;
  staffName?: string;
  statusHistory?: IOrderStatusUpdate[];
  notes?: string;
  orderType: 'dine-in' | 'delivery';
  deliveryInfo?: IDeliveryInfo;
}

const OrderItemSchema: Schema = new Schema({
  id: { type: String, required: true },
  menuItemId: { type: String, required: true },
  quantity: { type: Number, required: true },
  cookedCount: { type: Number, default: 0 },
  newCount: { type: Number, default: 0 },
  cookingCount: { type: Number, default: 0 },
  readyCount: { type: Number, default: 0 },
  servedCount: { type: Number, default: 0 },
  selectedExtraIds: [{ type: String }],
  splitId: { type: Number },
  notes: { type: String }
});

const OrderStatusUpdateSchema: Schema = new Schema({
  status: { type: String, required: true },
  timestamp: { type: Date, required: true }
});

const DeliveryInfoSchema: Schema = new Schema({
  name: { type: String, required: true },
  address: { type: String, required: true },
  phone: { type: String, required: true }
});

const OrderSchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  items: { type: [OrderItemSchema], required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['pending', 'completed'] 
  },
  createdAt: { type: Date, required: true },
  completedAt: { type: Date },
  table: { type: Number, required: true },
  isPinned: { type: Boolean, default: false },
  customerId: { type: String },
  staffName: { type: String },
  statusHistory: { type: [OrderStatusUpdateSchema], default: [] },
  notes: { type: String },
  orderType: { 
    type: String, 
    required: true, 
    enum: ['dine-in', 'delivery'] 
  },
  deliveryInfo: { type: DeliveryInfoSchema }
});

export default mongoose.model<IOrder>('Order', OrderSchema);