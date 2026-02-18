import mongoose, { Schema, Document } from 'mongoose';

export interface IRestaurant extends Document {
  id: string;
  name: string;
  ownerId: string;
  createdAt: Date;
  updatedAt: Date;
}

const RestaurantSchema: Schema = new Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  ownerId: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true // This will automatically manage createdAt and updatedAt
});

// Update the updatedAt field before saving
RestaurantSchema.pre<IRestaurant>('save', function (next) {
  this.updatedAt = new Date();
  next();
});

export default mongoose.models.Restaurant || mongoose.model<IRestaurant>('Restaurant', RestaurantSchema);