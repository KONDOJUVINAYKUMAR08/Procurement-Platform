"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardController = void 0;
const procurement_service_1 = require("@procurement/procurement-service");
const finance_service_1 = require("@procurement/finance-service");
const document_service_1 = require("@procurement/document-service");
const utils_1 = require("@procurement/utils");
class DashboardController {
    async getStats(req, res) {
        try {
            const [totalVendors, activeVendors, purchaseRequests, pendingApprovals, purchaseOrders, pendingPurchaseOrders, activeContracts, expiringContracts, totalInvoices, pendingInvoices, recentActivity, invoiceStats, monthlySpend, procurementByDepartment, vendorByStatus] = await Promise.all([
                procurement_service_1.Vendor.countDocuments(),
                procurement_service_1.Vendor.countDocuments({ status: 'active' }),
                procurement_service_1.PurchaseRequest.countDocuments(),
                procurement_service_1.PurchaseRequest.countDocuments({ status: 'pending' }),
                procurement_service_1.PurchaseOrder.countDocuments(),
                procurement_service_1.PurchaseOrder.countDocuments({ status: { $in: ['draft', 'issued'] } }),
                procurement_service_1.Contract.countDocuments({ status: 'active' }),
                procurement_service_1.Contract.countDocuments({
                    status: 'active',
                    expiryDate: {
                        $lte: new Date(new Date().setDate(new Date().getDate() + 30)),
                        $gte: new Date(),
                    },
                }),
                finance_service_1.Invoice.countDocuments(),
                finance_service_1.Invoice.countDocuments({ status: 'pending' }),
                document_service_1.AuditLog.find()
                    .sort({ createdAt: -1 })
                    .limit(10)
                    .populate('userId', 'firstName lastName email'),
                finance_service_1.Invoice.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 },
                            totalAmount: { $sum: '$totalAmount' }
                        }
                    }
                ]),
                procurement_service_1.PurchaseOrder.aggregate([
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
                procurement_service_1.PurchaseRequest.aggregate([
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
                procurement_service_1.Vendor.aggregate([
                    {
                        $group: {
                            _id: '$status',
                            count: { $sum: 1 }
                        }
                    }
                ])
            ]);
            return (0, utils_1.sendSuccess)(res, {
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
        }
        catch (error) {
            return (0, utils_1.sendError)(res, error.message);
        }
    }
}
exports.DashboardController = DashboardController;
exports.default = new DashboardController();
//# sourceMappingURL=dashboard.controller.js.map