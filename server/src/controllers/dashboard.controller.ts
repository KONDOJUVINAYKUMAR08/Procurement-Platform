import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import dashboardService from '../services/dashboard.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class DashboardController {
  async getStats(_req: IAuthenticatedRequest, res: Response) {
    try {
      const stats = await dashboardService.getStats();
      return sendSuccess(res, stats);
    } catch (error: any) {
      return sendError(res, error.message, 500);
    }
  }
}

export default new DashboardController();
