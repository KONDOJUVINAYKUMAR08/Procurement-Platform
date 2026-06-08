import { Contract } from '../models/Contract';
import { generateContractNumber } from '../utils/helpers';
import { Notification } from '../models/Notification';

export class ContractService {
  async create(data: any, userId: string) {
    const contractNumber = generateContractNumber();

    const contract = await Contract.create({
      ...data,
      contractNumber,
      createdBy: userId,
    });

    return contract;
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
        { contractName: { $regex: search, $options: 'i' } },
        { contractNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'asc' ? 1 : -1;
    const sortObj: any = { [sort]: sortOrder };

    const [data, total] = await Promise.all([
      Contract.find(filter)
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .populate('vendor', 'vendorName vendorCode')
        .populate('createdBy', 'firstName lastName email'),
      Contract.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const contract = await Contract.findById(id)
      .populate('vendor', 'vendorName vendorCode email')
      .populate('createdBy', 'firstName lastName email');
    if (!contract) throw new Error('Contract not found');
    return contract;
  }

  async update(id: string, data: any, userId: string) {
    const contract = await Contract.findByIdAndUpdate(id, data, { new: true, runValidators: true });
    if (!contract) throw new Error('Contract not found');
    return contract;
  }

  async addVersion(id: string, documentUrl: string, userId: string) {
    const contract = await Contract.findById(id);
    if (!contract) throw new Error('Contract not found');

    const newVersion = contract.versions.length + 1;
    contract.versions.push({
      version: newVersion,
      documentUrl,
      uploadedAt: new Date(),
      uploadedBy: userId as any,
    });
    contract.documentUrl = documentUrl;
    await contract.save();

    return contract;
  }

  async getExpiringContracts(days: number = 30) {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + days);

    const contracts = await Contract.find({
      expiryDate: { $lte: futureDate, $gte: new Date() },
      status: 'active',
    }).populate('vendor', 'vendorName vendorCode');

    return contracts;
  }

  async getStats() {
    const stats = await Contract.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 },
          totalValue: { $sum: '$contractValue' },
        },
      },
    ]);
    return stats;
  }
}

export default new ContractService();
