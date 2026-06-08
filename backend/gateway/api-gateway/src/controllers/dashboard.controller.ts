import { Response } from 'express';
import { IAuthenticatedRequest } from '@procurement/types';
import { Vendor, PurchaseRequest, PurchaseOrder, Contract } from '@procurement/procurement-service';
import { Invoice } from '@procurement/finance-service';
import { AuditLog } from '@procurement/document-service';
import { sendSuccess, sendError } from '@procurement/utils';

export class DashboardController {
  async getStats(req: IAuthenticatedRequest, res: Response) {
    try {
      const [
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
        recentActivity,
        invoiceStats,
        monthlySpend,
        procurementByDepartment,
        vendorByStatus
      ] = await Promise.all([
        Vendor.countDocuments(),
        Vendor.countDocuments({ status: 'active' }),
        PurchaseRequest.countDocuments(),
        PurchaseRequest.countDocuments({ status: 'pending' }),
        PurchaseOrder.countDocuments(),
        PurchaseOrder.countDocuments({ status: { $in: ['draft', 'issued'] } }),
        Contract.countDocuments({ status: 'active' }),
        Contract.countDocuments({
          status: 'active',
          expiryDate: {
            $lte: new Date(new Date().setDate(new Date().getDate() + 30)),
            $gte: new Date(),
          },
        }),
        Invoice.countDocuments(),
        Invoice.countDocuments({ status: 'pending' }),
        AuditLog.find()
          .sort({ createdAt: -1 })
          .limit(10)
          .populate('userId', 'firstName lastName email'),
        Invoice.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$totalAmount' }
            }
          }
        ]),
        PurchaseOrder.aggregate([
          {
            $match: { status: { $in: ['completed', 'shipped'] } }
          },
          {
            $group: {
              _id: {
                year: { $year: '$orderDate' },
                month: { $month: '$orderDate' }
              },
              total: { $sum: '$totalAmount' },
              count: { $sum: 1 }
            }
          },
          { $sort: { '_id.year': -1, '_id.month': -1 } },
          { $limit: 12 }
        ]),
        PurchaseRequest.aggregate([
          {
            $match: { status: 'approved' }
          },
          {
            $group: {
              _id: '$department',
              count: { $sum: 1 },
              totalCost: { $sum: '$estimatedCost' }
            }
          }
        ]),
        Vendor.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ])
      ]);

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
