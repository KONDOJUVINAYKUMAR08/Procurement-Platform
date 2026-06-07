import { Router } from 'express';
import vendorController from '../controllers/vendor.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { vendorSchema } from '../validators';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', vendorController.findAll);
router.get('/stats', vendorController.getStats);
router.get('/:id', vendorController.findById);
router.post('/', authorize('admin', 'procurement_manager'), auditLog('create', 'vendor'), validate(vendorSchema), vendorController.create);
router.put('/:id', authorize('admin', 'procurement_manager'), auditLog('update', 'vendor'), vendorController.update);
router.delete('/:id', authorize('admin'), auditLog('delete', 'vendor'), vendorController.delete);

export default router;
