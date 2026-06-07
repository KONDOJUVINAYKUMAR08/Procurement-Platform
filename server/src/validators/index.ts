import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  firstName: Joi.string().min(1).max(100).required(),
  lastName: Joi.string().min(1).max(100).required(),
  role: Joi.string().valid('admin', 'procurement_manager', 'finance').default('procurement_manager'),
  department: Joi.string().min(1).max(100).required(),
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(6).required(),
});

export const vendorSchema = Joi.object({
  vendorName: Joi.string().min(1).max(200).required(),
  contactPerson: Joi.string().min(1).max(200).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(1).max(20).required(),
  address: Joi.object({
    street: Joi.string().allow(''),
    city: Joi.string().allow(''),
    state: Joi.string().allow(''),
    country: Joi.string().allow(''),
    zipCode: Joi.string().allow(''),
  }).default({}),
  taxId: Joi.string().required(),
  bankAccount: Joi.string().required(),
  status: Joi.string().valid('active', 'inactive', 'pending', 'blacklisted'),
  rating: Joi.number().min(0).max(5),
  notes: Joi.string().allow(''),
});

export const purchaseRequestSchema = Joi.object({
  title: Joi.string().min(1).max(300).required(),
  department: Joi.string().required(),
  priority: Joi.string().valid('low', 'medium', 'high', 'urgent').default('medium'),
  description: Joi.string().required(),
  estimatedCost: Joi.number().min(0).required(),
  vendor: Joi.string(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).default([]),
});

export const purchaseOrderSchema = Joi.object({
  vendor: Joi.string().required(),
  purchaseRequest: Joi.string(),
  items: Joi.array().items(
    Joi.object({
      name: Joi.string().required(),
      description: Joi.string().allow(''),
      quantity: Joi.number().min(1).required(),
      unitPrice: Joi.number().min(0).required(),
    })
  ).min(1).required(),
  tax: Joi.number().min(0).default(0),
  expectedDeliveryDate: Joi.date(),
  notes: Joi.string().allow(''),
});

export const contractSchema = Joi.object({
  contractName: Joi.string().required(),
  vendor: Joi.string().required(),
  effectiveDate: Joi.date().required(),
  expiryDate: Joi.date().greater(Joi.ref('effectiveDate')).required(),
  contractValue: Joi.number().min(0).required(),
  description: Joi.string().allow(''),
  documentUrl: Joi.string().allow(''),
});

export const invoiceSchema = Joi.object({
  vendor: Joi.string().required(),
  purchaseOrder: Joi.string(),
  contract: Joi.string(),
  amount: Joi.number().min(0).required(),
  tax: Joi.number().min(0).default(0),
  dueDate: Joi.date().required(),
  description: Joi.string().allow(''),
  documentUrl: Joi.string().allow(''),
});

export const userUpdateSchema = Joi.object({
  firstName: Joi.string().min(1).max(100),
  lastName: Joi.string().min(1).max(100),
  role: Joi.string().valid('admin', 'procurement_manager', 'finance'),
  department: Joi.string(),
  isActive: Joi.boolean(),
});

export const validatePagination = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(20),
  sort: Joi.string().default('createdAt'),
  order: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().allow(''),
});
