import api from './api';
import {
  AuthResponse,
  Vendor,
  PurchaseRequest,
  PurchaseOrder,
  Contract,
  Invoice,
  Notification,
  AuditLog,
  DashboardStats,
  PaginatedResponse,
  User,
} from '../types';

// Auth
export const authApi = {
  login: (email: string, password: string) =>
    api.post<{ data: AuthResponse }>('/auth/login', { email, password }),
  register: (data: any) =>
    api.post<{ data: AuthResponse }>('/auth/register', data),
  forgotPassword: (email: string) =>
    api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  getProfile: () => api.get<{ data: User }>('/auth/profile'),
  updateProfile: (data: any) => api.put<{ data: User }>('/auth/profile', data),
  logout: () => api.post('/auth/logout'),
};

// Dashboard
export const dashboardApi = {
  getStats: () => api.get<{ data: DashboardStats }>('/dashboard'),
};

// Vendors
export const vendorApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<Vendor>>('/vendors', { params }),
  getById: (id: string) => api.get<{ data: Vendor }>(`/vendors/${id}`),
  create: (data: any) => api.post<{ data: Vendor }>('/vendors', data),
  update: (id: string, data: any) => api.put<{ data: Vendor }>(`/vendors/${id}`, data),
  delete: (id: string) => api.delete(`/vendors/${id}`),
  getStats: () => api.get('/vendors/stats'),
};

// Purchase Requests
export const purchaseRequestApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<PurchaseRequest>>('/purchase-requests', { params }),
  getById: (id: string) => api.get<{ data: PurchaseRequest }>(`/purchase-requests/${id}`),
  create: (data: any) => api.post<{ data: PurchaseRequest }>('/purchase-requests', data),
  update: (id: string, data: any) => api.put<{ data: PurchaseRequest }>(`/purchase-requests/${id}`, data),
  submit: (id: string) => api.post(`/purchase-requests/${id}/submit`),
  approve: (id: string) => api.post(`/purchase-requests/${id}/approve`),
  reject: (id: string, reason: string) => api.post(`/purchase-requests/${id}/reject`, { reason }),
  getStats: () => api.get('/purchase-requests/stats'),
};

// Purchase Orders
export const purchaseOrderApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<PurchaseOrder>>('/purchase-orders', { params }),
  getById: (id: string) => api.get<{ data: PurchaseOrder }>(`/purchase-orders/${id}`),
  create: (data: any) => api.post<{ data: PurchaseOrder }>('/purchase-orders', data),
  update: (id: string, data: any) => api.put<{ data: PurchaseOrder }>(`/purchase-orders/${id}`, data),
  getStats: () => api.get('/purchase-orders/stats'),
};

// Contracts
export const contractApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<Contract>>('/contracts', { params }),
  getById: (id: string) => api.get<{ data: Contract }>(`/contracts/${id}`),
  create: (data: any) => api.post<{ data: Contract }>('/contracts', data),
  update: (id: string, data: any) => api.put<{ data: Contract }>(`/contracts/${id}`, data),
  getExpiring: () => api.get('/contracts/expiring'),
  getStats: () => api.get('/contracts/stats'),
};

// Invoices
export const invoiceApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<Invoice>>('/invoices', { params }),
  getById: (id: string) => api.get<{ data: Invoice }>(`/invoices/${id}`),
  create: (data: any) => api.post<{ data: Invoice }>('/invoices', data),
  update: (id: string, data: any) => api.put<{ data: Invoice }>(`/invoices/${id}`, data),
  approve: (id: string) => api.post(`/invoices/${id}/approve`),
  markAsPaid: (id: string, paymentMethod: string) =>
    api.post(`/invoices/${id}/pay`, { paymentMethod }),
  getStats: () => api.get('/invoices/stats'),
};

// Notifications
export const notificationApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<Notification>>('/notifications', { params }),
  getUnreadCount: () => api.get<{ data: { count: number } }>('/notifications/unread-count'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// Audit Logs
export const auditApi = {
  getAll: (params?: any) => api.get<PaginatedResponse<AuditLog>>('/audit-logs', { params }),
};

// Users
export const userApi = {
  getAll: () => api.get<{ data: User[] }>('/users'),
  getById: (id: string) => api.get<{ data: User }>(`/users/${id}`),
  update: (id: string, data: any) => api.put<{ data: User }>(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Documents
export const documentApi = {
  upload: (formData: FormData) =>
    api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
  getAll: (params?: any) => api.get('/documents', { params }),
  getDownloadUrl: (id: string) => api.get(`/documents/${id}/download`),
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// Reports
export const reportApi = {
  vendor: () => api.get('/reports/vendors'),
  procurement: (params?: any) => api.get('/reports/procurement', { params }),
  invoice: (params?: any) => api.get('/reports/invoices', { params }),
  contract: () => api.get('/reports/contracts'),
};
