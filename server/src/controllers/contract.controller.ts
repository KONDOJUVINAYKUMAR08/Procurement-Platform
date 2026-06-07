import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import contractService from '../services/contract.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class ContractController {
  async create(req: IAuthenticatedRequest, res: Response) {
    try {
      const contract = await contractService.create(req.body, req.user!.userId);
      return sendSuccess(res, contract, 'Contract created', 201);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await contractService.findAll({
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
      const contract = await contractService.findById(req.params.id);
      return sendSuccess(res, contract);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const contract = await contractService.update(req.params.id, req.body, req.user!.userId);
      return sendSuccess(res, contract, 'Contract updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getExpiring(_req: IAuthenticatedRequest, res: Response) {
    try {
      const contracts = await contractService.getExpiringContracts();
      return sendSuccess(res, contracts);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await contractService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new ContractController();
