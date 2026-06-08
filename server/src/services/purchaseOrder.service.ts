import { PurchaseOrder } from '../models/PurchaseOrder';
import { generatePoNumber } from '../utils/helpers';

export class PurchaseOrderService {
  async create(data: any, userId: string) {
    const poNumber = generatePoNumber();
    const items = data.items.map((item: any) => ({
      ...item,
      totalPrice: item.quantity * item.unitPrice,
    }));
    const subtotal = items.reduce((sum: number, item: any) => sum + item.totalPrice, 0);
    const tax = data.tax || 0;
    const totalAmount = subtotal + tax;

    const po = await PurchaseOrder.create({
      ...data,
      poNumber,
      items,
      subtotal,
      tax,
      totalAmount,
      createdBy: userId,
    });

    return po;
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
        { poNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sort]: sortOrder };

    const [data, total] = await Promise.all([
      PurchaseOrder.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('vendor', 'vendorName vendorCode')
        .populate('purchaseRequest', 'title')
        .populate('createdBy', 'firstName lastName email'),
      PurchaseOrder.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const po = await PurchaseOrder.findById(id)
      .populate('vendor', 'vendorName vendorCode email phone address')
      .populate('purchaseRequest', 'title')
      .populate('createdBy', 'firstName lastName email');
    if (!po) throw new Error('Purchase order not found');
    return po;
  }

  async update(id: string, data: any) {
    const po = await PurchaseOrder.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!po) throw new Error('Purchase order not found');
    return po;
  }

  async getStats() {
    const stats = await PurchaseOrder.aggregate([
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

export default new PurchaseOrderService();
