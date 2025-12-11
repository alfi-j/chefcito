import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

const RoleSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true, unique: true },
  description: { type: String },
  permissions: [{ 
    type: String,
    enum: [
      'menu_access',
      'order_management',
      'kds_access',
      'reports_access',
      'restaurant_settings',
      'user_management',
      'payment_processing',
      'inventory_management'
    ]
  }]
}, {
  timestamps: true
});

// Prevent model recompilation in development mode
const Role = mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema, 'roles');
export default Role;