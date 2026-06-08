import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import paymentController from '../controllers/payment.controller';
import { authenticate, authorize, validate, auditLog } from '@procurement/middleware';
import { invoiceSchema, paymentSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: import('express').Router = Router();

router.use(authenticate);

// Invoice Routes
router.get('/invoices', invoiceController.findAll);
router.get('/invoices/stats', invoiceController.getStats);
router.get('/invoices/:id', invoiceController.findById);
router.post('/invoices', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), validate(invoiceSchema), auditLog('create', 'invoice'), invoiceController.create);
router.put('/invoices/:id', authorize(ROLES.ADMIN, ROLES.PROCUREMENT_MANAGER), invoiceController.update);
router.post('/invoices/:id/approve', authorize(ROLES.ADMIN, ROLES.FINANCE), auditLog('approve', 'invoice'), invoiceController.approve);

// Payment Routes
router.get('/payments', authorize(ROLES.ADMIN, ROLES.FINANCE), paymentController.findAll);
router.get('/payments/stats', authorize(ROLES.ADMIN, ROLES.FINANCE), paymentController.getStats);
router.get('/payments/:id', authorize(ROLES.ADMIN, ROLES.FINANCE), paymentController.findById);
router.post('/payments', authorize(ROLES.ADMIN, ROLES.FINANCE), validate(paymentSchema), auditLog('create', 'payment'), paymentController.create);

export default router;
