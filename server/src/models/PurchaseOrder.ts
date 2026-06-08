import mongoose, { Schema, Document } from 'mongoose';

export interface PurchaseOrderDocument extends Document {
  poNumber: string;
  vendor: mongoose.Types.ObjectId;
  purchaseRequest?: mongoose.Types.ObjectId;
  items: Array<{
    name: string;
    description: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  subtotal: number;
  tax: number;
  totalAmount: number;
  status: 'draft' | 'issued' | 'acknowledged' | 'shipped' | 'completed' | 'cancelled';
  orderDate: Date;
  expectedDeliveryDate?: Date;
  notes: string;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const purchaseOrderSchema = new Schema<PurchaseOrderDocument>(
  {
    poNumber: { type: String, required: true, unique: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    purchaseRequest: { type: Schema.Types.ObjectId, ref: 'PurchaseRequest' },
    items: [
      {
        name: { type: String, required: true },
        description: { type: String, default: '' },
        quantity: { type: Number, required: true },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
      },
    ],
    subtotal: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'issued', 'acknowledged', 'shipped', 'completed', 'cancelled'],
      default: 'draft',
    },
    orderDate: { type: Date, default: Date.now },
    expectedDeliveryDate: { type: Date },
    notes: { type: String, default: '' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const PurchaseOrder = mongoose.model<PurchaseOrderDocument>(
  'PurchaseOrder',
  purchaseOrderSchema
);
