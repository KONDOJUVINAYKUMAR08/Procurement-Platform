import { Router } from 'express';
import contractController from '../controllers/contract.controller';
import { authenticate, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { contractSchema } from '../validators';
import { auditLog } from '../middleware/audit';

const router = Router();

router.use(authenticate);

router.get('/', contractController.findAll);
router.get('/stats', contractController.getStats);
router.get('/expiring', contractController.getExpiring);
router.get('/:id', contractController.findById);
router.post('/', authorize('admin', 'procurement_manager'), validate(contractSchema), auditLog('create', 'contract'), contractController.create);
router.put('/:id', authorize('admin', 'procurement_manager'), auditLog('update', 'contract'), contractController.update);

export default router;
