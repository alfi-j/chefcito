import mongoose, { Schema, Document } from 'mongoose';

export interface IStaff extends Document {
  id: string;
  name: string;
  email: string;
  role: 'Staff' | 'Admin' | 'Restaurant Owner';
  status: 'On Shift' | 'Off Shift' | 'On Break';
  membership: 'free' | 'pro';
  createdAt?: Date;
  updatedAt?: Date;
}

const StaffSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: {
    type: String,
    required: true,
    enum: ['Staff', 'Admin', 'Restaurant Owner']
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

export default mongoose.model<IStaff>('Staff', StaffSchema);