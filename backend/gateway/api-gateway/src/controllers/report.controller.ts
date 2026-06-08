import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { Vendor, PurchaseRequest, PurchaseOrder, Contract } from '@procurement/procurement-service';
import { Invoice, Payment } from '@procurement/finance-service';
import { sendSuccess, sendError } from '@procurement/utils';

export class ReportController {
  async vendorReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const vendors = await Vendor.find()
        .select('vendorName vendorCode status rating address.country createdAt')
        .sort({ createdAt: -1 });

      const stats = await Vendor.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            avgRating: { $avg: '$rating' },
          },
        },
      ]);

      return sendSuccess(res, { data: vendors, summary: stats });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async procurementReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, department } = req.query;
      const matchStage: any = {};

      if (startDate && endDate) {
        matchStage.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      }
      if (department) {
        matchStage.department = department;
      }

      const requests = await PurchaseRequest.find(matchStage)
        .populate('vendor', 'vendorName')
        .sort({ createdAt: -1 });

      const summary = await PurchaseRequest.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$department',
            totalRequests: { $sum: 1 },
            approvedRequests: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] },
            },
            totalValue: { $sum: '$estimatedCost' },
          },
        },
      ]);

      return sendSuccess(res, { data: requests, summary });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async invoiceReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;
      const matchStage: any = {};

      if (startDate && endDate) {
        matchStage.createdAt = {
          $gte: new Date(startDate as string),
          $lte: new Date(endDate as string),
        };
      }
      if (status) {
        matchStage.status = status;
      }

      const invoices = await Invoice.find(matchStage)
        .populate('vendor', 'vendorName')
        .populate('purchaseOrder', 'poNumber')
        .sort({ createdAt: -1 });

      const summary = await Invoice.aggregate([
        { $match: matchStage },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalAmount: { $sum: '$totalAmount' },
            totalTax: { $sum: '$tax' },
          },
        },
      ]);

      return sendSuccess(res, { data: invoices, summary });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async contractReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const contracts = await Contract.find()
        .populate('vendor', 'vendorName')
        .sort({ expiryDate: 1 });

      const summary = await Contract.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            totalValue: { $sum: '$contractValue' },
          },
        },
      ]);

      return sendSuccess(res, { data: contracts, summary });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new ReportController();
