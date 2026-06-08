import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { Vendor, PurchaseRequest, PurchaseOrder, Contract } from '@procurement/procurement-service';
import { Invoice } from '@procurement/finance-service';
import { AuditLog } from '@procurement/document-service';
import { sendSuccess, sendError } from '@procurement/utils';

export class DashboardController {
  async getStats(req: IAuthenticatedRequest, res: Response) {
    try {
      // In Dynamoose, we must scan for counts if we don't have indexes set up for counts
      // For this prototype, we will scan and calculate in memory
      
      const [
        allVendors,
        allPRs,
        allPOs,
        allContracts,
        allInvoices,
        allAuditLogs
      ] = await Promise.all([
        Vendor.scan().exec(),
        PurchaseRequest.scan().exec(),
        PurchaseOrder.scan().exec(),
        Contract.scan().exec(),
        Invoice.scan().exec(),
        AuditLog.scan().exec()
      ]);

      const thirtyDaysFromNow = new Date(new Date().setDate(new Date().getDate() + 30)).getTime();
      const now = new Date().getTime();

      const totalVendors = allVendors.length;
      const activeVendors = allVendors.filter(v => v.status === 'active').length;
      
      const purchaseRequests = allPRs.length;
      const pendingApprovals = allPRs.filter(p => p.status === 'pending').length;
      
      const purchaseOrders = allPOs.length;
      const pendingPurchaseOrders = allPOs.filter(p => ['draft', 'issued'].includes(p.status)).length;
      
      const activeContracts = allContracts.filter(c => c.status === 'active').length;
      const expiringContracts = allContracts.filter(c => {
        if (c.status !== 'active' || !c.expiryDate) return false;
        const exp = new Date(c.expiryDate as any).getTime();
        return exp <= thirtyDaysFromNow && exp >= now;
      }).length;
      
      const totalInvoices = allInvoices.length;
      const pendingInvoices = allInvoices.filter(i => i.status === 'pending').length;

      allAuditLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      const recentActivity = allAuditLogs.slice(0, 10);

      // Aggregations
      const invoiceStatsMap: any = {};
      allInvoices.forEach(i => {
        const s = i.status;
        if (!invoiceStatsMap[s]) invoiceStatsMap[s] = { _id: s, count: 0, totalAmount: 0 };
        invoiceStatsMap[s].count++;
        invoiceStatsMap[s].totalAmount += i.totalAmount || 0;
      });
      const invoiceStats = Object.values(invoiceStatsMap);

      const monthlySpendMap: any = {};
      allPOs.forEach(p => {
        if (['completed', 'shipped'].includes(p.status)) {
          const d = new Date(p.orderDate as any);
          const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
          if (!monthlySpendMap[key]) monthlySpendMap[key] = { _id: { year: d.getFullYear(), month: d.getMonth() + 1 }, total: 0, count: 0 };
          monthlySpendMap[key].total += p.totalAmount || 0;
          monthlySpendMap[key].count++;
        }
      });
      const monthlySpend = Object.values(monthlySpendMap).sort((a: any, b: any) => {
        if (a._id.year !== b._id.year) return b._id.year - a._id.year;
        return b._id.month - a._id.month;
      }).slice(0, 12);

      const procurementByDepartmentMap: any = {};
      allPRs.forEach(p => {
        if (p.status === 'approved') {
          const d = p.department;
          if (!procurementByDepartmentMap[d]) procurementByDepartmentMap[d] = { _id: d, count: 0, totalCost: 0 };
          procurementByDepartmentMap[d].count++;
          procurementByDepartmentMap[d].totalCost += p.estimatedCost || 0;
        }
      });
      const procurementByDepartment = Object.values(procurementByDepartmentMap);

      const vendorByStatusMap: any = {};
      allVendors.forEach(v => {
        const s = v.status;
        if (!vendorByStatusMap[s]) vendorByStatusMap[s] = { _id: s, count: 0 };
        vendorByStatusMap[s].count++;
      });
      const vendorByStatus = Object.values(vendorByStatusMap);

      return sendSuccess(res, {
        overview: {
          totalVendors,
          activeVendors,
          purchaseRequests,
          pendingApprovals,
          purchaseOrders,
          pendingPurchaseOrders,
          activeContracts,
          expiringContracts,
          totalInvoices,
          pendingInvoices,
        },
        invoiceStats,
        monthlySpend,
        procurementByDepartment,
        vendorByStatus,
        recentActivity,
      });
    } catch (error: any) {
      return sendError(res, error.message);
    }
  }
}

export default new DashboardController();
