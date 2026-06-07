import mongoose, { Schema, Document } from 'mongoose';

export interface DocumentDocument extends Document {
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  category: 'contract' | 'invoice' | 'purchase_order' | 'vendor_certificate';
  relatedId?: string;
  uploadedBy: mongoose.Types.ObjectId;
  createdAt: Date;
}

const documentSchema = new Schema<DocumentDocument>(
  {
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
    s3Key: { type: String, required: true },
    s3Bucket: { type: String, required: true },
    category: {
      type: String,
      enum: ['contract', 'invoice', 'purchase_order', 'vendor_certificate'],
      required: true,
    },
    relatedId: { type: String },
    uploadedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export const DocumentModel = mongoose.model<DocumentDocument>('Document', documentSchema);
