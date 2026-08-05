import mongoose, { Schema, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  name: string;
  username?: string;
  email?: string;
  password: string;
  googleId?: string;
  restaurantId?: string; // currently active restaurant id
  restaurantIds: string[]; // all restaurants this user is a member of (single-owner multi-restaurant support)
  role: 'Owner' | 'Admin' | 'Staff' | string; // Extended to allow custom roles
  status: 'On Shift' | 'Off Shift' | 'On Break';
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  username: { type: String, required: false, default: null, unique: false },
  email: { type: String, required: false, default: null, sparse: true, unique: true },
  password: { type: String, required: false, default: null },
  googleId: { type: String, required: false, default: null },
  restaurantId: { type: String, required: false, default: null },
  restaurantIds: { type: [String], required: false, default: (): string[] => [] },
  role: {
    type: String,
    required: true
    // Removed enum constraint to allow custom roles
  },
  status: {
    type: String,
    required: true,
    enum: ['On Shift', 'Off Shift', 'On Break']
  }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

UserSchema.pre<IUser>('save', async function (next) {
  // Keep restaurantIds in sync with restaurantId (backward compatible:
  // the app still reads restaurantId while multi-restaurant support grows).
  if (this.restaurantId && !this.restaurantIds.includes(this.restaurantId)) {
    this.restaurantIds.push(this.restaurantId);
  }
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

UserSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return await bcrypt.compare(password, this.password);
};

// Prevent model recompilation in development mode
const User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema, 'users');
export default User;