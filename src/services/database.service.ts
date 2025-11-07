import mongoose from 'mongoose';
import Category from '../models/Category';
import MenuItem from '../models/MenuItem';
import Order from '../models/Order';
import Inventory from '../models/Inventory';
import Customer from '../models/Customer';
import Payment from '../models/Payment';
import User from '../models/User';
import { IUser } from '../models/User';

class DatabaseService {
  private isConnected = false;

  async connect(uri: string): Promise<void> {
    if (this.isConnected) {
      return;
    }

    try {
      await mongoose.connect(uri);
      this.isConnected = true;
      console.log('Connected to MongoDB');
    } catch (error) {
      console.error('MongoDB connection error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.disconnect();
      this.isConnected = false;
      console.log('Disconnected from MongoDB');
    }
  }

  // User methods
  async getAllUsers(): Promise<IUser[]> {
    return await User.find({});
  }

  async getUserByEmail(email: string): Promise<IUser | null> {
    return await User.findOne({ email });
  }

  async createUser(userData: any): Promise<IUser> {
    const user = new User(userData);
    return await user.save();
  }

  async updateUserRole(id: string, role: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { _id: id },
      { role },
      { new: true }
    );
  }

  async updateUserMembership(id: string, membership: string): Promise<IUser | null> {
    return await User.findOneAndUpdate(
      { _id: id },
      { membership },
      { new: true }
    );
  }


  // Category methods
  async getAllCategories(): Promise<any[]> {
    return await Category.find({});
  }

  async createCategory(categoryData: any): Promise<any> {
    const category = new Category(categoryData);
    return await category.save();
  }

  // MenuItem methods
  async getAllMenuItems(): Promise<any[]> {
    return await MenuItem.find({});
  }

  async createMenuItem(itemData: any): Promise<any> {
    const item = new MenuItem(itemData);
    return await item.save();
  }

  // Order methods
  async getAllOrders(): Promise<any[]> {
    return await Order.find({});
  }

  async createOrder(orderData: any): Promise<any> {
    const order = new Order(orderData);
    return await order.save();
  }

  // Inventory methods
  async getAllInventory(): Promise<any[]> {
    return await Inventory.find({});
  }

  async createInventoryItem(itemData: any): Promise<any> {
    const item = new Inventory(itemData);
    return await item.save();
  }

  // Customer methods
  async getAllCustomers(): Promise<any[]> {
    return await Customer.find({});
  }

  async createCustomer(customerData: any): Promise<any> {
    const customer = new Customer(customerData);
    return await customer.save();
  }

  // Payment methods
  async getAllPaymentMethods(): Promise<any[]> {
    return await Payment.find({});
  }

  async createPaymentMethod(methodData: any): Promise<any> {
    const method = new Payment(methodData);
    return await method.save();
  }
}

export default new DatabaseService();