import { Request, Response } from 'express';
import mongoose from 'mongoose';

export async function getHealthStatus(req: Request, res: Response) {
  const dbConnected = mongoose.connection.readyState === 1;
  return res.json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    database: {
      connected: dbConnected,
      status: dbConnected ? 'connected' : 'disconnected'
    }
  });
}
