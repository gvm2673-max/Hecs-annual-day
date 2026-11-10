import { Request, Response, NextFunction } from 'express';
import { connectDB } from '../config/db.js';

export async function checkDbConnection(req: Request, res: Response, next: NextFunction) {
  try {
    await connectDB();
    next();
  } catch (err: any) {
    console.error('API Database Connection Error:', err);
    return res.status(503).json({
      success: false,
      error: 'DatabaseUnavailable',
      message: 'Database Connection Error. Please verify your MONGODB_URI configuration.'
    });
  }
}
