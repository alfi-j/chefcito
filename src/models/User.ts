import mongoose, { Schema, Document } from 'mongoose';
import * as bcrypt from 'bcryptjs';

export interface IUser extends Document {
  id: string;
  name: string;
  email: string;
  password: string;
  role: 'Owner' | 'Admin' | 'Staff' | string; // Extended to support custom roles
  status: 'On Shift' | 'Off Shift' | 'On Break';
  membership: 'free' | 'pro';
  createdAt?: Date;
  updatedAt?: Date;
  comparePassword: (password: string) => Promise<boolean>;
}

const UserSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: {
    type: String,
    required: true
    // Removed enum constraint to allow custom roles
  },
  status: {
    type: String,
    required: true,
    enum: ['On Shift', 'Off Shift', 'On Break']
  },
  membership: {
    type: String,
    required: true,
    enum: ['free', 'pro']
  }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

UserSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();
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