import { Request, Response } from 'express';
import { asyncHandler } from '../utils/async-handler';
import authService from '../services/auth.service';
import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['superadmin', 'admin', 'operator', 'viewer']),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
});

export class AuthController {
  login = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.login(req.body);

    res.json({
      success: true,
      data: result,
    });
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await authService.refresh(refreshToken);

    res.json({
      success: true,
      data: result,
    });
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const userId = req.user!.userId;

    await authService.logout(userId, refreshToken);

    res.json({
      success: true,
      data: { message: 'Logged out successfully' },
    });
  });

  register = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.register(req.body);

    res.status(201).json({
      success: true,
      data: user,
    });
  });

  me = asyncHandler(async (req: Request, res: Response) => {
    res.json({
      success: true,
      data: req.user,
    });
  });
}

export default new AuthController();
