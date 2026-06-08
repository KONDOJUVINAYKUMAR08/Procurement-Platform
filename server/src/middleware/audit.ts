import { Response, NextFunction } from 'express';
import { IAuthenticatedRequest } from '../types';
import { AuditLog } from '../models/AuditLog';
import logger from '../config/logger';

export const auditLog = (action: string, entity: string) => {
  return async (req: IAuthenticatedRequest, res: Response, next: NextFunction) => {
    const originalEnd = res.end;
    const requestData = {
      body: req.body,
      params: req.params,
      query: req.query,
    };

    res.end = function (this: Response, ...args: unknown[]) {
      if (req.user && res.statusCode < 400) {
        AuditLog.create({
          userId: req.user.userId,
          action,
          entity,
          entityId: req.params?.id,
          details: {
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            ...requestData,
          },
          ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
          userAgent: req.get('user-agent') || 'unknown',
        }).catch((err: Error) => {
          logger.error('Audit log creation failed:', err);
        });
      }

      return (originalEnd as Function).apply(this, args);
    };

    next();
  };
};
