import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
  id: number;
  name: string;
  isModifierGroup?: boolean;
  linkedModifiers?: string[];
  parentId?: number | null;
  depth?: number;
}

const CategorySchema: Schema = new Schema({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  isModifierGroup: { type: Boolean, default: false },
  linkedModifiers: [{ type: String }],
  parentId: { type: Number, default: null },
  depth: { type: Number, default: 0 }
});

export default mongoose.model<ICategory>('Category', CategorySchema);