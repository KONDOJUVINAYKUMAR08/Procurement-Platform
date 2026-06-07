import { Vendor, VendorDocument } from '../models/Vendor';
import { generateVendorCode } from '../utils/helpers';
import { Notification } from '../models/Notification';

export class VendorService {
  async create(data: Partial<VendorDocument>, userId: string) {
    const vendorCode = data.vendorCode || generateVendorCode();
    
    const vendor = await Vendor.create({
      ...data,
      vendorCode,
      createdBy: userId,
      activities: [{
        action: 'created',
        description: 'Vendor created',
        performedBy: userId,
      }],
    });

    await Notification.create({
      title: 'New Vendor Created',
      message: `Vendor "${vendor.vendorName}" has been created and is pending approval.`,
      type: 'vendor_approval',
      relatedId: (vendor._id as unknown as string),
      relatedModel: 'Vendor',
    });

    return vendor;
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
        { vendorName: { $regex: search, $options: 'i' } },
        { vendorCode: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sort]: sortOrder };

    const [data, total] = await Promise.all([
      Vendor.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('createdBy', 'firstName lastName email'),
      Vendor.countDocuments(filter),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string) {
    const vendor = await Vendor.findById(id)
      .populate('createdBy', 'firstName lastName email')
      .populate('activities.performedBy', 'firstName lastName email');
    if (!vendor) throw new Error('Vendor not found');
    return vendor;
  }

  async update(id: string, data: Partial<VendorDocument>, userId: string) {
    const vendor = await Vendor.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!vendor) throw new Error('Vendor not found');

    vendor.activities.push({
      action: 'updated',
      description: 'Vendor details updated',
      performedBy: userId as any,
      timestamp: new Date(),
    });
    await vendor.save();

    return vendor;
  }

  async delete(id: string) {
    const vendor = await Vendor.findByIdAndDelete(id);
    if (!vendor) throw new Error('Vendor not found');
    return { message: 'Vendor deleted successfully' };
  }

  async getStats() {
    const stats = await Vendor.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
        },
      },
    ]);

    const total = await Vendor.countDocuments();
    const active = stats.find((s) => s._id === 'active')?.count || 0;
    const pending = stats.find((s) => s._id === 'pending')?.count || 0;

    return { total, active, pending, byStatus: stats };
  }
}

export default new VendorService();
