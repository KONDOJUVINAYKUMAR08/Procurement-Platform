import { Router } from 'express';
import purchaseRequestController from '../controllers/purchaseRequest.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { purchaseRequestSchema } from '../validators';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', purchaseRequestController.findAll);
router.get('/stats', purchaseRequestController.getStats);
router.get('/:id', purchaseRequestController.findById);
router.post('/', authorize('admin', 'procurement_manager'), validate(purchaseRequestSchema), purchaseRequestController.create);
router.put('/:id', authorize('admin', 'procurement_manager'), purchaseRequestController.update);
router.post('/:id/submit', authorize('admin', 'procurement_manager'), auditLog('submit', 'purchase_request'), purchaseRequestController.submit);
router.post('/:id/approve', authorize('admin'), auditLog('approve', 'purchase_request'), purchaseRequestController.approve);
router.post('/:id/reject', authorize('admin'), auditLog('reject', 'purchase_request'), purchaseRequestController.reject);

export default router;
