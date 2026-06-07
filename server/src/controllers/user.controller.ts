import { Response } from 'express';
import { IAuthenticatedRequest } from '../types';
import { User } from '../models/User';
import { sendSuccess, sendError } from '../utils/helpers';

export class UserController {
  async findAll(_req: IAuthenticatedRequest, res: Response) {
    try {
      const users = await User.find().select('-password');
      return sendSuccess(res, users);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async findById(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await User.findById(req.params.id).select('-password');
      if (!user) return sendError(res, 'User not found', 404);
      return sendSuccess(res, user);
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async update(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: req.body },
        { new: true, runValidators: true }
      ).select('-password');
      if (!user) return sendError(res, 'User not found', 404);
      return sendSuccess(res, user, 'User updated');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }

  async delete(req: IAuthenticatedRequest, res: Response) {
    try {
      const user = await User.findByIdAndDelete(req.params.id);
      if (!user) return sendError(res, 'User not found', 404);
      return sendSuccess(res, null, 'User deleted');
    } catch (error: any) {
      return sendError(res, error.message, 400);
    }
  }
}

export default new UserController();
