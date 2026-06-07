import { Vendor } from '../models/Vendor';
import { PurchaseRequest } from '../models/PurchaseRequest';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Contract } from '../models/Contract';
import { Invoice } from '../models/Invoice';
import { AuditLog } from '../models/AuditLog';

export class DashboardService {
  async getStats() {
    const [
      totalVendors,
      activeVendors,
      purchaseRequests,
      pendingPRs,
      purchaseOrders,
      pendingPOs,
      activeContracts,
      expiringContracts,
      totalInvoices,
      pendingInvoices,
      recentActivity,
    ] = await Promise.all([
      Vendor.countDocuments(),
      Vendor.countDocuments({ status: 'active' }),
      PurchaseRequest.countDocuments(),
      PurchaseRequest.countDocuments({ status: 'pending' }),
      PurchaseOrder.countDocuments(),
      PurchaseOrder.countDocuments({ status: 'issued' }),
      Contract.countDocuments({ status: 'active' }),
      Contract.countDocuments({
        expiryDate: {
          $lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          $gte: new Date(),
        },
        status: 'active',
      }),
      Invoice.countDocuments(),
      Invoice.countDocuments({ status: 'pending' }),
      AuditLog.find().sort({ createdAt: -1 }).limit(10).populate('userId', 'firstName lastName email'),
    ]);

    const invoiceStats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);

    const monthlySpend = await PurchaseOrder.aggregate([
      {
        $match: {
          createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
          },
          total: { $sum: '$totalAmount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const procurementByDepartment = await PurchaseRequest.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
          totalCost: { $sum: '$estimatedCost' },
        },
      },
      { $sort: { count: -1 } },
    ]);

    const vendorByStatus = await Vendor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    return {
      overview: {
        totalVendors,
        activeVendors,
        purchaseRequests,
        pendingApprovals: pendingPRs,
        purchaseOrders,
        pendingPurchaseOrders: pendingPOs,
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
    };
  }
}

export default new DashboardService();
