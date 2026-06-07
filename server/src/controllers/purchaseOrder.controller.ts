import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import purchaseOrderService from '../services/purchaseOrder.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class PurchaseOrderController {
  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const po = await purchaseOrderService.create(req.body, req.user!.userId);
      return sendSuccess(res, po, 'Purchase order created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await purchaseOrderService.findAll({
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sort: (req.query.sort as string) || 'createdAt',
        order: (req.query.order as string) || 'desc',
        search: req.query.search as string,
        status: req.query.status as string,
      });
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const po = await purchaseOrderService.findById(req.params.id);
      return sendSuccess(res, po);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const po = await purchaseOrderService.update(req.params.id, req.body);
      return sendSuccess(res, po, 'Purchase order updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await purchaseOrderService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new PurchaseOrderController();
