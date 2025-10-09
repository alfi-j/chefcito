import mongoose, { Schema, Document } from 'mongoose';

export interface IMenuItem extends Document {
  id: string;
  name: string;
  price: number;
  description?: string;
  available?: boolean;
  category: string;
  imageUrl: string;
  aiHint?: string;
  linkedModifiers?: string[];
  sortIndex: number;
}

const MenuItemSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  available: { type: Boolean, default: true },
  category: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  aiHint: { type: String },
  linkedModifiers: [{ type: String }],
  sortIndex: { type: Number, default: 0 }
});

export default mongoose.model<IMenuItem>('MenuItem', MenuItemSchema);