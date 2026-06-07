import { Router } from 'express';
import documentController, { uploadMiddleware } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';

const router = Router();

router.use(authenticate);

router.get('/', documentController.findAll);
router.post('/upload', uploadMiddleware, documentController.upload);
router.get('/:id/download', documentController.getDownloadUrl);
router.delete('/:id', documentController.delete);

export default router;
