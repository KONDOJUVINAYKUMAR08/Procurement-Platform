import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import vendorService from '../services/vendor.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class VendorController {
  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const vendor = await vendorService.create(req.body, req.user!.userId);
      return sendSuccess(res, vendor, 'Vendor created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await vendorService.findAll({
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
      const vendor = await vendorService.findById(req.params.id);
      return sendSuccess(res, vendor);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const vendor = await vendorService.update(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, vendor, 'Vendor updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await vendorService.delete(req.params.id);
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await vendorService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new VendorController();
