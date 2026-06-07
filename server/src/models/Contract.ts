import mongoose, { Schema, Document } from 'mongoose';

export interface ContractDocument extends Document {
  contractName: string;
  vendor: mongoose.Types.ObjectId;
  contractNumber: string;
  effectiveDate: Date;
  expiryDate: Date;
  contractValue: number;
  status: 'active' | 'expired' | 'terminated' | 'pending_renewal';
  description: string;
  documentUrl?: string;
  versions: Array<{
    version: number;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: mongoose.Types.ObjectId;
  }>;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contractSchema = new Schema<ContractDocument>(
  {
    contractName: { type: String, required: true, trim: true },
    vendor: { type: Schema.Types.ObjectId, ref: 'Vendor', required: true },
    contractNumber: { type: String, required: true, unique: true },
    effectiveDate: { type: Date, required: true },
    expiryDate: { type: Date, required: true },
    contractValue: { type: Number, required: true },
    status: {
      type: String,
      enum: ['active', 'expired', 'terminated', 'pending_renewal'],
      default: 'active',
    },
    description: { type: String, default: '' },
    documentUrl: { type: String },
    versions: [
      {
        version: { type: Number, required: true },
        documentUrl: { type: String, required: true },
        uploadedAt: { type: Date, default: Date.now },
        uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
      },
    ],
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

contractSchema.index({ contractName: 'text', contractNumber: 'text' });

export const Contract = mongoose.model<ContractDocument>('Contract', contractSchema);
