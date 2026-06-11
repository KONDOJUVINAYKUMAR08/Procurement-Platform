/**
 * API Service Layer
 *
 * All functions in this file normalize the backend response shape so that
 * callers always receive clean, typed data — never nested API wrapper objects.
 *
 * Backend response shape (from sendSuccess / sendError in @procurement/utils):
 *   Single item:  { success, message, data: T }
 *   List:         { success, message, data: { data: T[], pagination: {...} } }
 *
 * Axios stores the HTTP body in response.data.
 * So the full chain is:
 *   axiosResponse.data            → { success, message, data: ... }
 *   axiosResponse.data.data       → inner payload (item or { data, pagination })
 *   axiosResponse.data.data.data  → array of items (for list endpoints)
 */

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
  Document,
} from '../types';

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Unwrap { success, message, data: T } → T */
const item = <T>(res: any): T => res.data.data as T;

/** Unwrap { success, message, data: { data: T[], pagination } } → { items, pagination } */
const list = <T>(res: any): { items: T[]; pagination: PaginatedResponse<T>['pagination'] } => {
  const payload = res.data?.data ?? res.data ?? {};
  const items: T[] = Array.isArray(payload?.data) ? payload.data : [];
  const pagination = payload?.pagination ?? { page: 1, limit: 20, total: 0, totalPages: 0 };
  return { items, pagination };
};

// ── Auth ─────────────────────────────────────────────────────────────────────

export const authApi = {
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await api.post('/auth/login', { email, password });
    return item<AuthResponse>(res);
  },
  register: async (data: any): Promise<AuthResponse> => {
    const res = await api.post('/auth/register', data);
    return item<AuthResponse>(res);
  },
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, password: string) =>
    api.post('/auth/reset-password', { token, password }),
  getProfile: async (): Promise<User> => {
    const res = await api.get('/auth/profile');
    return item<User>(res);
  },
  updateProfile: async (data: any): Promise<User> => {
    const res = await api.put('/auth/profile', data);
    return item<User>(res);
  },
  logout: () => api.post('/auth/logout'),
  changePassword: (data: any) => api.post('/auth/change-password', data),
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export const dashboardApi = {
  getStats: async (): Promise<DashboardStats> => {
    const res = await api.get('/dashboard');
    return item<DashboardStats>(res);
  },
};

// ── Vendors ───────────────────────────────────────────────────────────────────

export const vendorApi = {
  getAll: async (params?: any): Promise<{ items: Vendor[]; pagination: any }> => {
    const res = await api.get('/vendors', { params });
    return list<Vendor>(res);
  },
  getById: async (id: string): Promise<Vendor> => {
    const res = await api.get(`/vendors/${id}`);
    return item<Vendor>(res);
  },
  create: async (data: any): Promise<Vendor> => {
    const res = await api.post('/vendors', data);
    return item<Vendor>(res);
  },
  update: async (id: string, data: any): Promise<Vendor> => {
    const res = await api.put(`/vendors/${id}`, data);
    return item<Vendor>(res);
  },
  delete: (id: string) => api.delete(`/vendors/${id}`),
  getStats: async () => {
    const res = await api.get('/vendors/stats');
    return item<any>(res);
  },
};

// ── Purchase Requests ─────────────────────────────────────────────────────────

export const purchaseRequestApi = {
  getAll: async (params?: any): Promise<{ items: PurchaseRequest[]; pagination: any }> => {
    const res = await api.get('/purchase-requests', { params });
    return list<PurchaseRequest>(res);
  },
  getById: async (id: string): Promise<PurchaseRequest> => {
    const res = await api.get(`/purchase-requests/${id}`);
    return item<PurchaseRequest>(res);
  },
  create: async (data: any): Promise<PurchaseRequest> => {
    const res = await api.post('/purchase-requests', data);
    return item<PurchaseRequest>(res);
  },
  update: async (id: string, data: any): Promise<PurchaseRequest> => {
    const res = await api.put(`/purchase-requests/${id}`, data);
    return item<PurchaseRequest>(res);
  },
  submit: (id: string) => api.post(`/purchase-requests/${id}/submit`),
  approve: (id: string) => api.post(`/purchase-requests/${id}/approve`),
  reject: (id: string, reason: string) =>
    api.post(`/purchase-requests/${id}/reject`, { reason }),
};

// ── Purchase Orders ───────────────────────────────────────────────────────────

export const purchaseOrderApi = {
  getAll: async (params?: any): Promise<{ items: PurchaseOrder[]; pagination: any }> => {
    const res = await api.get('/purchase-orders', { params });
    return list<PurchaseOrder>(res);
  },
  getById: async (id: string): Promise<PurchaseOrder> => {
    const res = await api.get(`/purchase-orders/${id}`);
    return item<PurchaseOrder>(res);
  },
  create: async (data: any): Promise<PurchaseOrder> => {
    const res = await api.post('/purchase-orders', data);
    return item<PurchaseOrder>(res);
  },
  update: async (id: string, data: any): Promise<PurchaseOrder> => {
    const res = await api.put(`/purchase-orders/${id}`, data);
    return item<PurchaseOrder>(res);
  },
};

// ── Contracts ─────────────────────────────────────────────────────────────────

export const contractApi = {
  getAll: async (params?: any): Promise<{ items: Contract[]; pagination: any }> => {
    const res = await api.get('/contracts', { params });
    return list<Contract>(res);
  },
  getById: async (id: string): Promise<Contract> => {
    const res = await api.get(`/contracts/${id}`);
    return item<Contract>(res);
  },
  create: async (data: any): Promise<Contract> => {
    const res = await api.post('/contracts', data);
    return item<Contract>(res);
  },
  update: async (id: string, data: any): Promise<Contract> => {
    const res = await api.put(`/contracts/${id}`, data);
    return item<Contract>(res);
  },
  getExpiring: async (): Promise<Contract[]> => {
    const res = await api.get('/contracts/expiring');
    const payload = res.data?.data;
    return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  },
};

// ── Invoices ──────────────────────────────────────────────────────────────────

export const invoiceApi = {
  getAll: async (params?: any): Promise<{ items: Invoice[]; pagination: any }> => {
    const res = await api.get('/invoices', { params });
    return list<Invoice>(res);
  },
  getById: async (id: string): Promise<Invoice> => {
    const res = await api.get(`/invoices/${id}`);
    return item<Invoice>(res);
  },
  create: async (data: any): Promise<Invoice> => {
    const res = await api.post('/invoices', data);
    return item<Invoice>(res);
  },
  update: async (id: string, data: any): Promise<Invoice> => {
    const res = await api.put(`/invoices/${id}`, data);
    return item<Invoice>(res);
  },
  approve: (id: string) => api.post(`/invoices/${id}/approve`),
  markAsPaid: (id: string, paymentMethod: string) =>
    api.post(`/invoices/${id}/pay`, { paymentMethod }),
  delete: (id: string) => api.delete(`/invoices/${id}`),
  generatePdf: async (id: string): Promise<{ url: string; fileName: string }> => {
    const res = await api.post(`/invoices/${id}/pdf`);
    return item<{ url: string; fileName: string }>(res);
  },
  getStats: async (): Promise<any> => {
    const res = await api.get('/invoices/stats');
    return item<any>(res);
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const notificationApi = {
  getAll: async (params?: any): Promise<{ items: Notification[]; pagination: any }> => {
    const res = await api.get('/notifications', { params });
    return list<Notification>(res);
  },
  getUnreadCount: async (): Promise<number> => {
    const res = await api.get('/notifications/unread-count');
    const payload = item<{ count: number }>(res);
    return payload?.count ?? 0;
  },
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/read-all'),
};

// ── Audit Logs ────────────────────────────────────────────────────────────────

export const auditApi = {
  getAll: async (params?: any): Promise<{ items: AuditLog[]; pagination: any }> => {
    const res = await api.get('/audit-logs', { params });
    return list<AuditLog>(res);
  },
};

// ── Users ─────────────────────────────────────────────────────────────────────

export const userApi = {
  getAll: async (): Promise<User[]> => {
    const res = await api.get('/users');
    const payload = res.data?.data;
    return Array.isArray(payload) ? payload : Array.isArray(payload?.data) ? payload.data : [];
  },
  getById: async (id: string): Promise<User> => {
    const res = await api.get(`/users/${id}`);
    return item<User>(res);
  },
  update: async (id: string, data: any): Promise<User> => {
    const res = await api.put(`/users/${id}`, data);
    return item<User>(res);
  },
  delete: (id: string) => api.delete(`/users/${id}`),
};

// ── Documents ─────────────────────────────────────────────────────────────────

export const documentApi = {
  upload: async (formData: FormData): Promise<Document> => {
    const res = await api.post('/documents/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return item<Document>(res);
  },
  getAll: async (params?: any): Promise<{ items: Document[]; pagination: any }> => {
    const res = await api.get('/documents', { params });
    return list<Document>(res);
  },
  getDownloadUrl: async (id: string): Promise<{ url: string; fileName: string }> => {
    const res = await api.get(`/documents/${id}/download`);
    return item<{ url: string; fileName: string }>(res);
  },
  delete: (id: string) => api.delete(`/documents/${id}`),
};

// ── Customers ─────────────────────────────────────────────────────────────────

export const customerApi = {
  getAll: async (params?: any): Promise<{ items: any[]; pagination: any }> => {
    const res = await api.get('/customers', { params });
    return list<any>(res);
  },
  getById: async (id: string): Promise<any> => {
    const res = await api.get(`/customers/${id}`);
    return item<any>(res);
  },
  create: async (data: any): Promise<any> => {
    const res = await api.post('/customers', data);
    return item<any>(res);
  },
  update: async (id: string, data: any): Promise<any> => {
    const res = await api.put(`/customers/${id}`, data);
    return item<any>(res);
  },
  delete: (id: string) => api.delete(`/customers/${id}`),
  getStats: async (): Promise<any> => {
    const res = await api.get('/customers/stats');
    return item<any>(res);
  },
};

// ── Reports ───────────────────────────────────────────────────────────────────

export const reportApi = {
  vendor: async (): Promise<{ data: any[]; summary: any[] }> => {
    const res = await api.get('/reports/vendors');
    return item<{ data: any[]; summary: any[] }>(res);
  },
  procurement: async (params?: any): Promise<{ data: any[]; summary: any[] }> => {
    const res = await api.get('/reports/procurement', { params });
    return item<{ data: any[]; summary: any[] }>(res);
  },
  invoice: async (params?: any): Promise<{ data: any[]; summary: any[] }> => {
    const res = await api.get('/reports/invoices', { params });
    return item<{ data: any[]; summary: any[] }>(res);
  },
  contract: async (): Promise<{ data: any[]; summary: any[] }> => {
    const res = await api.get('/reports/contracts');
    return item<{ data: any[]; summary: any[] }>(res);
  },
};

// ── HR API ────────────────────────────────────────────────────────────────────

export const hrApi = {
  // Employees
  employees: {
    getAll: async (params?: any) => { const res = await api.get('/hr/employees', { params }); return list<any>(res); },
    getById: async (id: string) => { const res = await api.get(`/hr/employees/${id}`); return item<any>(res); },
    create: async (data: any) => { const res = await api.post('/hr/employees', data); return item<any>(res); },
    update: async (id: string, data: any) => { const res = await api.put(`/hr/employees/${id}`, data); return item<any>(res); },
    delete: (id: string) => api.delete(`/hr/employees/${id}`),
    getStats: async () => { const res = await api.get('/hr/employees/stats'); return item<any>(res); },
  },

  // Attendance
  attendance: {
    getAll: async (params?: any) => { const res = await api.get('/hr/attendance', { params }); return list<any>(res); },
    getMy: async (params?: any) => { const res = await api.get('/hr/attendance/my', { params }); return (res.data?.data || res.data) as any[]; },
    getSummary: async (params?: any) => { const res = await api.get('/hr/attendance/summary', { params }); return item<any>(res); },
    checkIn: async (data: { photoBase64?: string; latitude?: number; longitude?: number; address?: string; notes?: string }) => {
      const res = await api.post('/hr/attendance/checkin', data);
      return item<any>(res);
    },
    checkOut: async () => { const res = await api.post('/hr/attendance/checkout', {}); return item<any>(res); },
  },

  // Payroll
  payroll: {
    getAll: async (params?: any) => { const res = await api.get('/hr/payroll', { params }); return list<any>(res); },
    getById: async (id: string) => { const res = await api.get(`/hr/payroll/${id}`); return item<any>(res); },
    generate: async (data: any) => { const res = await api.post('/hr/payroll/generate', data); return item<any>(res); },
    markPaid: async (id: string) => { const res = await api.post(`/hr/payroll/${id}/mark-paid`, {}); return item<any>(res); },
    generatePdf: async (id: string) => { const res = await api.post(`/hr/payroll/${id}/pdf`, {}); return item<any>(res); },
  },

  // Letters & Certificates
  letters: {
    getAll: async (params?: any) => { const res = await api.get('/hr/letters', { params }); return list<any>(res); },
    getById: async (id: string) => { const res = await api.get(`/hr/letters/${id}`); return item<any>(res); },
    create: async (data: any) => { const res = await api.post('/hr/letters', data); return item<any>(res); },
    delete: (id: string) => api.delete(`/hr/letters/${id}`),
    generatePdf: async (id: string) => { const res = await api.post(`/hr/letters/${id}/pdf`, {}); return item<any>(res); },
  },
};

