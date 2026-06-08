import { PurchaseRequest } from '../models/PurchaseRequest';
import { Notification } from '../models/Notification';

export class PurchaseRequestService {
  async create(data: any, userId: string) {
    const pr = await PurchaseRequest.create({
      ...data,
      requestedBy: userId,
    });
    return pr;
  }

  async findAll(query: {
    page: number;
    limit: number;
    sort: string;
    order: string;
    search?: string;
    status?: string;
    department?: string;
    priority?: string;
  }) {
    const { page, limit, sort, order, search, status, department, priority } = query;
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (priority) filter.priority = priority;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { department: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sort]: sortOrder };

    const [data, total] = await Promise.all([
      PurchaseRequest.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('requestedBy', 'firstName lastName email')
        .populate('vendor', 'vendorName vendorCode')
        .populate('approvedBy', 'firstName lastName email'),
      PurchaseRequest.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const pr = await PurchaseRequest.findById(id)
      .populate('requestedBy', 'firstName lastName email')
      .populate('vendor', 'vendorName vendorCode')
      .populate('approvedBy', 'firstName lastName email');
    if (!pr) throw new Error('Purchase request not found');
    return pr;
  }

  async update(id: string, data: any) {
    const pr = await PurchaseRequest.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!pr) throw new Error('Purchase request not found');
    return pr;
  }

  async submit(id: string) {
    const pr = await PurchaseRequest.findByIdAndUpdate(
      id,
      { status: 'pending' },
      { new: true }
    );
    if (!pr) throw new Error('Purchase request not found');

    await Notification.create({
      title: 'Purchase Request Submitted',
      message: `PR "${pr.title}" is pending approval.`,
      type: 'purchase_approval',
      relatedId: (pr._id as unknown as string),
      relatedModel: 'PurchaseRequest',
    });

    return pr;
  }

  async approve(id: string, userId: string) {
    const pr = await PurchaseRequest.findByIdAndUpdate(
      id,
      { status: 'approved', approvedBy: userId as any },
      { new: true }
    );
    if (!pr) throw new Error('Purchase request not found');

    await Notification.create({
      title: 'Purchase Request Approved',
      message: `PR "${pr.title}" has been approved.`,
      type: 'purchase_approval',
      userId: pr.requestedBy,
      relatedId: (pr._id as unknown as string),
      relatedModel: 'PurchaseRequest',
    });

    return pr;
  }

  async reject(id: string, userId: string, reason: string) {
    const pr = await PurchaseRequest.findByIdAndUpdate(
      id,
      { status: 'rejected', approvedBy: userId as any, rejectionReason: reason },
      { new: true }
    );
    if (!pr) throw new Error('Purchase request not found');
    return pr;
  }

  async getStats() {
    const stats = await PurchaseRequest.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalCost: { $sum: '$estimatedCost' },
        },
      },
    ]);
    return stats;
  }
}

export default new PurchaseRequestService();
