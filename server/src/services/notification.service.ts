import { Notification } from '../models/Notification';

export class NotificationService {
  async findAll(userId?: string, page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};
    if (userId) {
      filter.$or = [{ userId }, { userId: { $exists: false } }];
    }

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Notification.countDocuments(filter),
    ]);

    return {
      data,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  async getUnreadCount(userId?: string) {
    const filter: Record<string, unknown> = { isRead: false };
    if (userId) {
      filter.$or = [{ userId }, { userId: { $exists: false } }];
    }
    return Notification.countDocuments(filter);
  }

  async markAsRead(id: string) {
    return Notification.findByIdAndUpdate(id, { isRead: true }, { new: true });
  }

  async markAllAsRead(userId?: string) {
    const filter: Record<string, unknown> = { isRead: false };
    if (userId) {
      filter.$or = [{ userId }, { userId: { $exists: false } }];
    }
    return Notification.updateMany(filter, { isRead: true });
  }

  async delete(id: string) {
    return Notification.findByIdAndDelete(id);
  }
}

export default new NotificationService();
