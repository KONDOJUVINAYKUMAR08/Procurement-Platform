import { Router } from 'express';
import invoiceController from '../controllers/invoice.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { invoiceSchema } from '../validators';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', invoiceController.findAll);
router.get('/stats', invoiceController.getStats);
router.get('/:id', invoiceController.findById);
router.post('/', authorize('admin', 'procurement_manager'), validate(invoiceSchema), auditLog('create', 'invoice'), invoiceController.create);
router.put('/:id', authorize('admin', 'procurement_manager'), invoiceController.update);
router.post('/:id/approve', authorize('admin', 'procurement_manager', 'finance'), auditLog('approve', 'invoice'), invoiceController.approve);
router.post('/:id/pay', authorize('finance', 'admin'), auditLog('payment', 'invoice'), invoiceController.markAsPaid);

export default router;
