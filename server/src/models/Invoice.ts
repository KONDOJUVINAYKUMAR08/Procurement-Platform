import mongoose, { Schema, Document } from 'mongoose';

export interface InvoiceDocument extends Document {
  invoiceNumber: string;
  vendor: mongoose.Types.ObjectId;
  purchaseOrder?: mongoose.Types.ObjectId;
  contract?: mongoose.Types.ObjectId;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: Date;
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'disputed';
  description: string;
  documentUrl?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  approvedBy?: mongoose.Types.ObjectId;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new Schema<InvoiceDocument>(
  {
    invoiceNumber: { type: String, required: true, unique: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder' },
    contract: { type: Schema.Types.ObjectId, ref: 'Contract' },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'overdue', 'disputed'],
      default: 'pending',
    },
    description: { type: String, default: '' },
    documentUrl: { type: String },
    paymentDate: { type: Date },
    paymentMethod: { type: String },
    approvedBy: { type: Schema.Types.ObjectId, ref: 'User' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model<InvoiceDocument>('Invoice', invoiceSchema);
