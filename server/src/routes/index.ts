import { Router } from 'express';
import authRoutes from './auth.routes';
import vendorRoutes from './vendor.routes';
import purchaseRequestRoutes from './purchaseRequest.routes';
import purchaseOrderRoutes from './purchaseOrder.routes';
import contractRoutes from './contract.routes';
import invoiceRoutes from './invoice.routes';
import documentRoutes from './document.routes';
import dashboardRoutes from './dashboard.routes';
import notificationRoutes from './notification.routes';
import auditRoutes from './audit.routes';
import reportRoutes from './report.routes';
import userRoutes from './user.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/vendors', vendorRoutes);
router.use('/purchase-requests', purchaseRequestRoutes);
router.use('/purchase-orders', purchaseOrderRoutes);
router.use('/contracts', contractRoutes);
router.use('/invoices', invoiceRoutes);
router.use('/documents', documentRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/notifications', notificationRoutes);
router.use('/audit-logs', auditRoutes);
router.use('/reports', reportRoutes);
router.use('/users', userRoutes);

export default router;
