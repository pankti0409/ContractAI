import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  role: 'user' | 'admin';
  createdAt: Date;
}

const UserSchema = new Schema<IUser>({
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  name: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  company: { type: String },
  role: { type: String, enum: ['user', 'admin'], default: 'user', index: true },
}, { timestamps: { createdAt: true, updatedAt: true } });

export const User = mongoose.model<IUser>('User', UserSchema);