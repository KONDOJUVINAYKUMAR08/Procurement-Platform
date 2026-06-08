import { Invoice } from '../models/Invoice';
import { generateInvoiceNumber } from '../utils/helpers';
import { Notification } from '../models/Notification';

export class InvoiceService {
  async create(data: any, userId: string) {
    const invoiceNumber = generateInvoiceNumber();
    const totalAmount = data.amount + (data.tax || 0);

    const invoice = await Invoice.create({
      ...data,
      invoiceNumber,
      totalAmount,
      createdBy: userId,
    });

    return invoice;
  }

  async findAll(query: {
    page: number;
    limit: number;
    sort: string;
    order: string;
    search?: string;
    status?: string;
  }) {
    const { page, limit, sort, order, search, status } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { invoiceNumber: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sort]: sortOrder };

    const [data, total] = await Promise.all([
      Invoice.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('vendor', 'vendorName vendorCode')
        .populate('purchaseOrder', 'poNumber')
        .populate('approvedBy', 'firstName lastName email')
        .populate('createdBy', 'firstName lastName email'),
      Invoice.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const invoice = await Invoice.findById(id)
      .populate('vendor', 'vendorName vendorCode email')
      .populate('purchaseOrder', 'poNumber')
      .populate('contract', 'contractName contractNumber')
      .populate('approvedBy', 'firstName lastName email')
      .populate('createdBy', 'firstName lastName email');
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async update(id: string, data: any) {
    const invoice = await Invoice.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async approve(id: string, userId: string) {
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status: 'approved', approvedBy: userId as any },
      { new: true }
    );
    if (!invoice) throw new Error('Invoice not found');

    await Notification.create({
      title: 'Invoice Approved',
      message: `Invoice ${invoice.invoiceNumber} has been approved.`,
      type: 'system',
      relatedId: (invoice._id as unknown as string),
      relatedModel: 'Invoice',
    });

    return invoice;
  }

  async markAsPaid(id: string, paymentMethod: string) {
    const invoice = await Invoice.findByIdAndUpdate(
      id,
      { status: 'paid', paymentDate: new Date(), paymentMethod },
      { new: true }
    );
    if (!invoice) throw new Error('Invoice not found');
    return invoice;
  }

  async getStats() {
    const stats = await Invoice.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalAmount: { $sum: '$totalAmount' },
        },
      },
    ]);
    return stats;
  }
}

export default new InvoiceService();
