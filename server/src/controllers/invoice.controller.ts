import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import invoiceService from '../services/invoice.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class InvoiceController {
  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.create(req.body, req.user!.userId);
      return sendSuccess(res, invoice, 'Invoice created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await invoiceService.findAll({
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
      const invoice = await invoiceService.findById(req.params.id);
      return sendSuccess(res, invoice);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.update(req.params.id, req.body);
      return sendSuccess(res, invoice, 'Invoice updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async approve(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.approve(req.params.id, req.user!.userId);
      return sendSuccess(res, invoice, 'Invoice approved');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async markAsPaid(req: IAuthenticatedRequest, res: Response) {
    try {
      const invoice = await invoiceService.markAsPaid(req.params.id, req.body.paymentMethod);
      return sendSuccess(res, invoice, 'Invoice marked as paid');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await invoiceService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new InvoiceController();
