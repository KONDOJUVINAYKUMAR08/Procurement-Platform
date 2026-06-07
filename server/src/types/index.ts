import { Request } from 'express';

export interface IUser {
  _id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'procurement_manager' | 'finance';
  department: string;
  isActive: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuthPayload {
  userId: string;
  email: string;
  role: string;
}

export interface IAuthenticatedRequest extends Request {
  user?: IAuthPayload;
}

export type VendorStatus = 'active' | 'inactive' | 'pending' | 'blacklisted';

export interface IVendor {
  _id: string;
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
  status: VendorStatus;
  rating: number;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PRStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type PRPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface IPurchaseRequest {
  _id: string;
  title: string;
  department: string;
  priority: PRPriority;
  description: string;
  estimatedCost: number;
  vendor?: string;
  status: PRStatus;
  requestedBy: string;
  approvedBy?: string;
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

export type POStatus = 'draft' | 'issued' | 'acknowledged' | 'shipped' | 'completed' | 'cancelled';

export interface IPurchaseOrder {
  _id: string;
  poNumber: string;
  vendor: string;
  purchaseRequest?: string;
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
  status: POStatus;
  orderDate: Date;
  expectedDeliveryDate?: Date;
  notes: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ContractStatus = 'active' | 'expired' | 'terminated' | 'pending_renewal';

export interface IContract {
  _id: string;
  contractName: string;
  vendor: string;
  contractNumber: string;
  effectiveDate: Date;
  expiryDate: Date;
  contractValue: number;
  status: ContractStatus;
  description: string;
  documentUrl?: string;
  versions: Array<{
    version: number;
    documentUrl: string;
    uploadedAt: Date;
    uploadedBy: string;
  }>;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type InvoiceStatus = 'pending' | 'approved' | 'paid' | 'overdue' | 'disputed';

export interface IInvoice {
  _id: string;
  invoiceNumber: string;
  vendor: string;
  purchaseOrder?: string;
  contract?: string;
  amount: number;
  tax: number;
  totalAmount: number;
  dueDate: Date;
  status: InvoiceStatus;
  description: string;
  documentUrl?: string;
  paymentDate?: Date;
  paymentMethod?: string;
  approvedBy?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type NotificationType = 'contract_expiry' | 'invoice_due' | 'vendor_approval' | 'purchase_approval' | 'system';

export interface INotification {
  _id: string;
  title: string;
  message: string;
  type: NotificationType;
  userId?: string;
  isRead: boolean;
  relatedId?: string;
  relatedModel?: string;
  createdAt: Date;
}

export interface IAuditLog {
  _id: string;
  userId: string;
  action: string;
  entity: string;
  entityId?: string;
  details: Record<string, unknown>;
  ipAddress: string;
  userAgent: string;
  createdAt: Date;
}

export interface IDocument {
  _id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  size: number;
  s3Key: string;
  s3Bucket: string;
  category: 'contract' | 'invoice' | 'purchase_order' | 'vendor_certificate';
  relatedId?: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
