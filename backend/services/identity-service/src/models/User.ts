import * as dynamoose from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import { UserRole } from '@procurement/types';
import { v4 as uuidv4 } from 'uuid';

export interface UserDocument extends Item {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  department: string;
  isActive: boolean;
  lastLogin?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  fullName: string;
}

const userSchema = new dynamoose.Schema(
  {
    _id: {
      type: String,
      hashKey: true,
      default: () => uuidv4(),
    },
    email: {
      type: String,
      required: true,
      index: {
        name: 'emailIndex',
        type: 'global',
      },
    },
    password: { type: String, required: true },
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    role: {
      type: String,
      enum: ['admin', 'procurement_manager', 'finance', 'vendor', 'auditor'],
      default: 'procurement_manager',
    },
    department: { type: String, default: 'General' },
    isActive: { type: Boolean, default: true },
    lastLogin: { type: Date },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
  },
  { timestamps: true }
);

export const User = dynamoose.model<UserDocument>('Identity_User', userSchema, {
  create: true, // create table if not exists
});
