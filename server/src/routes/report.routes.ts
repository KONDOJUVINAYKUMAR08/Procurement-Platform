import { Router } from 'express';
import reportController from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/vendors', reportController.vendorReport);
router.get('/procurement', reportController.procurementReport);
router.get('/invoices', reportController.invoiceReport);
router.get('/contracts', reportController.contractReport);

export default router;
