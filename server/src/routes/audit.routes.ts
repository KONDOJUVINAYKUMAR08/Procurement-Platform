import { Router } from 'express';
import auditController from '../controllers/audit.controller';
import { authenticate, authorize } from '../middleware/auth';

const router = Router();

router.use(authenticate);
router.use(authorize('admin'));

router.get('/', auditController.findAll);

export default router;
