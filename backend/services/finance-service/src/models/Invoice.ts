import * as dynamoose from 'dynamoose';
import { Item } from 'dynamoose/dist/Item';
import { v4 as uuidv4 } from 'uuid';

export interface InvoiceDocument extends Item {
  _id: string;
  invoiceNumber: string;
  vendor: string;
  purchaseOrder?: string;
  contract?: string;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: Date;
  status: 'pending' | 'approved' | 'paid' | 'overdue' | 'disputed';
  description: string;
  documentUrl?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

const invoiceSchema = new dynamoose.Schema(
  {
    _id: {
      type: String,
      hashKey: true,
      default: () => uuidv4(),
    },
    invoiceNumber: {
      type: String,
      required: true,
      index: {
        name: 'invoiceNumberIndex',
        type: 'global',
      },
    },
    vendor: {
      type: String,
      required: true,
      index: {
        name: 'invoiceVendorIndex',
        type: 'global',
      },
    },
    purchaseOrder: { type: String },
    contract: { type: String },
    amount: { type: Number, required: true },
    tax: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    dueDate: { type: Date, required: true },
    status: {
      type: String,
      enum: ['pending', 'approved', 'paid', 'overdue', 'disputed'],
      default: 'pending',
      index: {
        name: 'invoiceStatusIndex',
        type: 'global',
      },
    },
    description: { type: String, default: '' },
    documentUrl: { type: String },
    paymentDate: { type: Date },
    paymentMethod: { type: String },
    approvedBy: { type: String },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

export const Invoice = dynamoose.model<InvoiceDocument>('Finance_Invoice', invoiceSchema, {
  create: true,
});
