import mongoose, { Schema, Document } from 'mongoose';

export interface IInventoryItem extends Document {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  reorderThreshold: number;
  lastRestocked: Date;
  linkedItemIds?: string[];
  category?: string;
}

const InventorySchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, required: true },
  reorderThreshold: { type: Number, required: true },
  lastRestocked: { type: Date, required: true },
  linkedItemIds: [{ type: String }],
  category: { type: String }
});

export default mongoose.model<IInventoryItem>('Inventory', InventorySchema);