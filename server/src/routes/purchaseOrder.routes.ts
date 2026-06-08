import { Router } from 'express';
import purchaseOrderController from '../controllers/purchaseOrder.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { purchaseOrderSchema } from '../validators';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', purchaseOrderController.findAll);
router.get('/stats', purchaseOrderController.getStats);
router.get('/:id', purchaseOrderController.findById);
router.post('/', authorize('admin', 'procurement_manager'), validate(purchaseOrderSchema), auditLog('create', 'purchase_order'), purchaseOrderController.create);
router.put('/:id', authorize('admin', 'procurement_manager'), purchaseOrderController.update);

export default router;
