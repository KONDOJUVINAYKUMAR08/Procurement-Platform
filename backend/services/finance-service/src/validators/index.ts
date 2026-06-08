import Joi from 'joi';

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

export const paymentSchema = Joi.object({
  invoiceId: Joi.string().required(),
  paymentMethod: Joi.string().valid('wire_transfer', 'check', 'ach', 'credit_card').required(),
  notes: Joi.string().allow(''),
});
