import { Router } from 'express';
import authController from '../controllers/auth.controller';
import userController from '../controllers/user.controller';
import { authenticate, authorize, validate } from '@procurement/middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators';
import { ROLES } from '@procurement/types';

const router: Router = Router();

// Auth routes
router.post('/auth/register', validate(registerSchema), authController.register);
router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/auth/reset-password', validate(resetPasswordSchema), authController.resetPassword);
router.post('/auth/logout', authController.logout);
router.get('/auth/profile', authenticate, authController.getProfile);
router.put('/auth/profile', authenticate, authController.updateProfile);

// User management routes (admin only)
router.get('/users', authenticate, authorize(ROLES.ADMIN), userController.findAll);
router.get('/users/:id', authenticate, authorize(ROLES.ADMIN), userController.findById);
router.put('/users/:id', authenticate, authorize(ROLES.ADMIN), userController.update);
router.delete('/users/:id', authenticate, authorize(ROLES.ADMIN), userController.delete);

export default router;
