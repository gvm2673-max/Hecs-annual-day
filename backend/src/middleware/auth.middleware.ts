import { Request, Response, NextFunction } from 'express';
import { AdminUserModel } from '../models/adminUser.model.js';

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Admin authorization token required'
      });
    }

    const token = authHeader.split(' ')[1];
    const admin = await AdminUserModel.findOne({ tokens: token });
    if (!admin) {
      return res.status(401).json({
        success: false,
        error: 'Unauthorized',
        message: 'Session expired or invalid token'
      });
    }

    (req as any).adminUser = admin;
    next();
  } catch (err: any) {
    return res.status(500).json({
      success: false,
      error: 'AuthError',
      message: 'Database authentication error'
    });
  }
}
