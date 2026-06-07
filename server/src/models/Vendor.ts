import mongoose, { Schema, Document } from 'mongoose';

export interface VendorDocument extends Document {
  vendorName: string;
  vendorCode: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: {
    street: string;
    city: string;
    state: string;
    country: string;
    zipCode: string;
  };
  taxId: string;
  bankAccount: string;
  status: 'active' | 'inactive' | 'pending' | 'blacklisted';
  rating: number;
  notes: string;
  activities: Array<{
    action: string;
    description: string;
    performedBy: mongoose.Types.ObjectId;
    timestamp: Date;
  }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const vendorSchema = new Schema<VendorDocument>(
  {
    vendorName: { type: String, required: true, trim: true },
    vendorCode: { type: String, required: true, unique: true, trim: true },
    contactPerson: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, required: true, trim: true },
    address: {
      street: { type: String, default: '' },
      city: { type: String, default: '' },
      state: { type: String, default: '' },
      country: { type: String, default: '' },
      zipCode: { type: String, default: '' },
    },
    taxId: { type: String, required: true },
    bankAccount: { type: String, required: true },
    status: {
      type: String,
      enum: ['active', 'inactive', 'pending', 'blacklisted'],
      default: 'pending',
    },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    notes: { type: String, default: '' },
    activities: [
      {
        action: { type: String, required: true },
        description: { type: String, required: true },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        timestamp: { type: Date, default: Date.now },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

vendorSchema.index({ vendorName: 'text', vendorCode: 'text', email: 'text' });

export const Vendor = mongoose.model<VendorDocument>('Vendor', vendorSchema);
