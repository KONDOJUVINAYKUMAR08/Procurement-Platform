import { Response } from 'express';
import multer from 'multer';
import { IAuthenticatedRequest } from '../types';
import documentService from '../services/document.service';
import { sendSuccess, sendError } from '../utils/helpers';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowedTypes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'));
    }
  },
});

export const uploadMiddleware = upload.single('file');

export class DocumentController {
  async upload(req: IAuthenticatedRequest, res: Response) {
    try {
      if (!req.file) return sendError(res, 'No file uploaded', 400);
      
      const { category, relatedId } = req.body;
      const document = await documentService.upload(
        req.file,
        category || 'vendor_certificate',
        relatedId,
        req.user!.userId
      );
      return sendSuccess(res, document, 'Document uploaded', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const documents = await documentService.findAll({
        category: req.query.category as string,
        relatedId: req.query.relatedId as string,
      });
      return sendSuccess(res, documents);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getDownloadUrl(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await documentService.getDownloadUrl(req.params.id);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await documentService.delete(req.params.id);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }
}

export default new DocumentController();
