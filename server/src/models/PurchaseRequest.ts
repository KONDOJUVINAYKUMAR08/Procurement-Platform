import mongoose, { Schema, Document } from 'mongoose';

export interface PurchaseRequestDocument extends Document {
  title: string;
  department: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  description: string;
  estimatedCost: number;
  vendor?: mongoose.Types.ObjectId;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  requestedBy: mongoose.Types.ObjectId;
  approvedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseRequestSchema = new Schema<PurchaseRequestDocument>(
  {
    title: { type: String, required: true, trim: true },
    department: { type: String, required: true },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high', 'urgent'],
      default: 'medium',
    },
    description: { type: String, required: true },
    estimatedCost: { type: Number, required: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor' },
    status: {
      type: String,
      enum: ['draft', 'pending', 'approved', 'rejected'],
      default: 'draft',
    },
    requestedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    rejectionReason: { type: String },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
      },
    ],
  },
  { timestamps: true }
);

purchaseRequestSchema.index({ title: 'text', department: 'text' });

export const PurchaseRequest = mongoose.model<PurchaseRequestDocument>(
  'PurchaseRequest',
  purchaseRequestSchema
);
