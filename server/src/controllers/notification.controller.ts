import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import notificationService from '../services/notification.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class NotificationController {
  async findAll(req: IAuthenticatedRequest, res: Response) {
    try {
      const result = await notificationService.findAll(
        req.user!.userId,
        parseInt(req.query.page as string) || 1,
        parseInt(req.query.limit as string) || 20
      );
      return sendSuccess(res, result);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async getUnreadCount(req: IAuthenticatedRequest, res: Response) {
    try {
      const count = await notificationService.getUnreadCount(req.user!.userId);
      return sendSuccess(res, { count });
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async markAsRead(req: IAuthenticatedRequest, res: Response) {
    try {
      const notification = await notificationService.markAsRead(req.params.id);
      return sendSuccess(res, notification);
    } catch (error: any) {
      return sendError(res, error.message, 404);
    }
  }

  async markAllAsRead(req: IAuthenticatedRequest, res: Response) {
    try {
      await notificationService.markAllAsRead(req.user!.userId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new NotificationController();
