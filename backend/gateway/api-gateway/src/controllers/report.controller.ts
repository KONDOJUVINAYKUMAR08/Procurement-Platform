import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { Vendor, PurchaseRequest, Contract } from '@procurement/procurement-service';
import { Invoice } from '@procurement/finance-service';
import { sendSuccess, sendError } from '@procurement/utils';

export class ReportController {
  async vendorReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const allVendors = await Vendor.scan().exec();
      const vendors = allVendors.map((v: any) => ({
        _id: v._id,
        vendorName: v.vendorName,
        vendorCode: v.vendorCode,
        status: v.status,
        rating: v.rating,
        country: v.address?.country,
        createdAt: v.createdAt
      })).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const statsMap: any = {};
      allVendors.forEach((v: any) => {
        if (!statsMap[v.status]) statsMap[v.status] = { _id: v.status, count: 0, totalRating: 0 };
        statsMap[v.status].count++;
        statsMap[v.status].totalRating += (v.rating || 0);
      });
      
      const summary = Object.values(statsMap).map((s: any) => ({
        _id: s._id,
        count: s.count,
        avgRating: s.count > 0 ? s.totalRating / s.count : 0
      }));

      return sendSuccess(res, { data: vendors, summary });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async procurementReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, department } = req.query;
      let scanReq = PurchaseRequest.scan();
      
      if (department) {
        scanReq = scanReq.where('department').eq(department);
      }

      const allRequests: any[] = await scanReq.exec();
      
      let filtered = allRequests;
      if (startDate && endDate) {
        const start = new Date(startDate as string).getTime();
        const end = new Date(endDate as string).getTime();
        filtered = allRequests.filter((r: any) => {
          const t = new Date(r.createdAt).getTime();
          return t >= start && t <= end;
        });
      }

      const requests = filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const summaryMap: any = {};
      filtered.forEach((r: any) => {
        const d = r.department;
        if (!summaryMap[d]) summaryMap[d] = { _id: d, totalRequests: 0, approvedRequests: 0, totalValue: 0 };
        summaryMap[d].totalRequests++;
        if (r.status === 'approved') summaryMap[d].approvedRequests++;
        summaryMap[d].totalValue += (r.estimatedCost || 0);
      });

      return sendSuccess(res, { data: requests, summary: Object.values(summaryMap) });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async invoiceReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const { startDate, endDate, status } = req.query;
      let scanReq = Invoice.scan();
      if (status) scanReq = scanReq.where('status').eq(status);

      const allInvoices: any[] = await scanReq.exec();
      
      let filtered = allInvoices;
      if (startDate && endDate) {
        const start = new Date(startDate as string).getTime();
        const end = new Date(endDate as string).getTime();
        filtered = allInvoices.filter((r: any) => {
          const t = new Date(r.createdAt).getTime();
          return t >= start && t <= end;
        });
      }

      const invoices = filtered.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      const summaryMap: any = {};
      filtered.forEach((i: any) => {
        const s = i.status;
        if (!summaryMap[s]) summaryMap[s] = { _id: s, count: 0, totalAmount: 0, totalTax: 0 };
        summaryMap[s].count++;
        summaryMap[s].totalAmount += (i.totalAmount || 0);
        summaryMap[s].totalTax += (i.tax || 0);
      });

      return sendSuccess(res, { data: invoices, summary: Object.values(summaryMap) });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }

  async contractReport(req: IAuthenticatedRequest, res: Response) {
    try {
      const allContracts = await Contract.scan().exec();
      const contracts = allContracts.sort((a: any, b: any) => {
        const d1 = a.expiryDate ? new Date(a.expiryDate).getTime() : 0;
        const d2 = b.expiryDate ? new Date(b.expiryDate).getTime() : 0;
        return d1 - d2;
      });

      const summaryMap: any = {};
      allContracts.forEach((c: any) => {
        const s = c.status;
        if (!summaryMap[s]) summaryMap[s] = { _id: s, count: 0, totalValue: 0 };
        summaryMap[s].count++;
        summaryMap[s].totalValue += (c.contractValue || 0);
      });

      return sendSuccess(res, { data: contracts, summary: Object.values(summaryMap) });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new ReportController();
