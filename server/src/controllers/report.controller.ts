import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import reportService from '../services/report.service';
import { sendSuccess, sendError } from '../utils/helpers';

export class ReportController {
  async vendorReport(_req: IAuthenticatedRequest, res: Response) {
    try {
      const data = await reportService.generateVendorReport();
      return sendSuccess(res, data);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async procurementReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const data = await reportService.generateProcurementReport(startDate, endDate);
      return sendSuccess(res, data);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async invoiceReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const data = await reportService.generateInvoiceReport(startDate, endDate);
      return sendSuccess(res, data);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async contractReport(_req: IAuthenticatedRequest, res: Response) {
    try {
      const data = await reportService.generateContractReport();
      return sendSuccess(res, data);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new ReportController();
