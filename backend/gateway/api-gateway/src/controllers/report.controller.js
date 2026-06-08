"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReportController = void 0;
const procurement_service_1 = require("@procurement/procurement-service");
const finance_service_1 = require("@procurement/finance-service");
const utils_1 = require("@procurement/utils");
class ReportController {
    async vendorReport(req, res) {
        try {
            const vendors = await procurement_service_1.Vendor.find()
                .select('vendorName vendorCode status rating address.country createdAt')
                .sort({ createdAt: -1 });
            const stats = await procurement_service_1.Vendor.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        avgRating: { $avg: '$rating' },
                    },
                },
            ]);
            return (0, utils_1.sendSuccess)(res, { data: vendors, summary: stats });
        }
        catch (error) {
            return (0, utils_1.sendError)(res, error.message);
        }
    }
    async procurementReport(req, res) {
        try {
            const { startDate, endDate, department } = req.query;
            const matchStage = {};
            if (startDate && endDate) {
                matchStage.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (department) {
                matchStage.department = department;
            }
            const requests = await procurement_service_1.PurchaseRequest.find(matchStage)
                .populate('vendor', 'vendorName')
                .sort({ createdAt: -1 });
            const summary = await procurement_service_1.PurchaseRequest.aggregate([
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
            return (0, utils_1.sendSuccess)(res, { data: requests, summary });
        }
        catch (error) {
            return (0, utils_1.sendError)(res, error.message);
        }
    }
    async invoiceReport(req, res) {
        try {
            const { startDate, endDate, status } = req.query;
            const matchStage = {};
            if (startDate && endDate) {
                matchStage.createdAt = {
                    $gte: new Date(startDate),
                    $lte: new Date(endDate),
                };
            }
            if (status) {
                matchStage.status = status;
            }
            const invoices = await finance_service_1.Invoice.find(matchStage)
                .populate('vendor', 'vendorName')
                .populate('purchaseOrder', 'poNumber')
                .sort({ createdAt: -1 });
            const summary = await finance_service_1.Invoice.aggregate([
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
            return (0, utils_1.sendSuccess)(res, { data: invoices, summary });
        }
        catch (error) {
            return (0, utils_1.sendError)(res, error.message);
        }
    }
    async contractReport(req, res) {
        try {
            const contracts = await procurement_service_1.Contract.find()
                .populate('vendor', 'vendorName')
                .sort({ expiryDate: 1 });
            const summary = await procurement_service_1.Contract.aggregate([
                {
                    $group: {
                        _id: '$status',
                        count: { $sum: 1 },
                        totalValue: { $sum: '$contractValue' },
                    },
                },
            ]);
            return (0, utils_1.sendSuccess)(res, { data: contracts, summary });
        }
        catch (error) {
            return (0, utils_1.sendError)(res, error.message);
        }
    }
}
exports.ReportController = ReportController;
exports.default = new ReportController();
//# sourceMappingURL=report.controller.js.map