import mongoose, { Schema, Document } from 'mongoose';

export interface NotificationDocument extends Document {
  title: string;
  message: string;
  type: 'contract_expiry' | 'invoice_due' | 'vendor_approval' | 'purchase_approval' | 'system';
  userId?: mongoose.Types.ObjectId;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  createdAt: Date;
}

const notificationSchema = new Schema<NotificationDocument>(
  {
    title: { type: String, required: true },
    message: { type: String, required: true },
    type: {
      type: String,
      enum: ['contract_expiry', 'invoice_due', 'vendor_approval', 'purchase_approval', 'system'],
      required: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    isRead: { type: Boolean, default: false },
    relatedId: { type: String },
    relatedModel: { type: String },
  },
  { timestamps: true }
);

export const Notification = mongoose.model<NotificationDocument>('Notification', notificationSchema);
