import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { corsMiddleware } from './src/middleware/cors.middleware.js';
import { checkDbConnection } from './src/middleware/dbCheck.middleware.js';
import healthRoutes from './src/routes/health.routes.js';
import authRoutes from './src/routes/auth.routes.js';
import eventRoutes from './src/routes/event.routes.js';
import publicRoutes from './src/routes/public.routes.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 5000;

// Apply CORS & Body Parser Middlewares
app.use(corsMiddleware);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Ensure MongoDB Connection Middleware for all /api routes
app.use('/api', checkDbConnection);

// Mount REST API Routers
app.use('/api', healthRoutes);
app.use('/api', authRoutes);
app.use('/api', eventRoutes);
app.use('/api', publicRoutes);

// Catch-all 404 handler for unknown API routes
app.use('/api*', (req: Request, res: Response) => {
  return res.status(404).json({
    success: false,
    error: 'NotFound',
    message: `API endpoint ${req.originalUrl || req.url} not found`
  });
});

// Express Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('Unhandled Backend Error:', err);
  if (res.headersSent) {
    return next(err);
  }
  const statusCode = err.status || err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    error: err.name || 'InternalServerError',
    message: err.message || 'An unexpected server error occurred'
  });
});

// Start Standalone Node HTTP Server (if not running in Serverless environment)
if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Digital Invitation Backend API running on port ${PORT}`);
  });
}

export default app;
