import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import { AuditLog } from '../models/AuditLog';
import { sendSuccess, sendError } from '../utils/helpers';

export class AuditController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const filter: Record<string, unknown> = {};
      if (req.query.entity) filter.entity = req.query.entity;
      if (req.query.action) filter.action = req.query.action;
      if (req.query.userId) filter.userId = req.query.userId;

      const [data, total] = await Promise.all([
        AuditLog.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .populate('userId', 'firstName lastName email'),
        AuditLog.countDocuments(filter),
      ]);

      return sendSuccess(res, {
        data,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new AuditController();
