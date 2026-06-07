import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import purchaseRequestService from '../services/purchaseRequest.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class PurchaseRequestController {
  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const pr = await purchaseRequestService.create(req.body, req.user!.userId);
      return sendSuccess(res, pr, 'Purchase request created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await purchaseRequestService.findAll({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'createdAt',
        order: (req.query.order as string) || 'desc',
        search: req.query.search as string,
        status: req.query.status as string,
        department: req.query.department as string,
        priority: req.query.priority as string,
      });
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const pr = await purchaseRequestService.findById(req.params.id);
      return sendSuccess(res, pr);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const pr = await purchaseRequestService.update(req.params.id, req.body);
      return sendSuccess(res, pr, 'Purchase request updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async submit(req: IAuthenticatedRequest, res: Response) {
    try {
      const pr = await purchaseRequestService.submit(req.params.id);
      return sendSuccess(res, pr, 'Purchase request submitted');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async approve(req: IAuthenticatedRequest, res: Response) {
    try {
      const pr = await purchaseRequestService.approve(req.params.id, req.user!.userId);
      return sendSuccess(res, pr, 'Purchase request approved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async reject(req: IAuthenticatedRequest, res: Response) {
    try {
      const { reason } = req.body;
      const pr = await purchaseRequestService.reject(req.params.id, req.user!.userId, reason);
      return sendSuccess(res, pr, 'Purchase request rejected');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await purchaseRequestService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new PurchaseRequestController();
