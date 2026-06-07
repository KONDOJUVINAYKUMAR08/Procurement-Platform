import { Vendor } from '../models/Vendor';
import { PurchaseRequest } from '../models/PurchaseRequest';
import { PurchaseOrder } from '../models/PurchaseOrder';
import { Contract } from '../models/Contract';
import { Invoice } from '../models/Invoice';

export class ReportService {
  async generateVendorReport() {
    return Vendor.find()
      .populate('createdBy', 'firstName lastName email')
      .lean();
  }

  async generateProcurementReport(startDate?: Date, endDate?: Date) {
    const filter: Record<string, unknown> = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as any).$gte = startDate;
      if (endDate) (filter.createdAt as any).$lte = endDate;
    }

    const [prs, pos] = await Promise.all([
      PurchaseRequest.find(filter).populate('requestedBy', 'firstName lastName').populate('vendor').lean(),
      PurchaseOrder.find(filter).populate('vendor').populate('createdBy', 'firstName lastName').lean(),
    ]);

    return { purchaseRequests: prs, purchaseOrders: pos };
  }

  async generateInvoiceReport(startDate?: Date, endDate?: Date) {
    const filter: Record<string, unknown> = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) (filter.createdAt as any).$gte = startDate;
      if (endDate) (filter.createdAt as any).$lte = endDate;
    }

    return Invoice.find(filter)
      .populate('vendor', 'vendorName vendorCode')
      .populate('approvedBy', 'firstName lastName')
      .lean();
  }

  async generateContractReport() {
    return Contract.find()
      .populate('vendor', 'vendorName vendorCode')
      .lean();
  }
}

export default new ReportService();
