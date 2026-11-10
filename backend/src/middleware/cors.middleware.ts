import { Request, Response, NextFunction } from 'express';

export function corsMiddleware(req: Request, res: Response, next: NextFunction) {
  const allowedOrigin = process.env.FRONTEND_URL || '*';
  const requestOrigin = req.headers.origin;

  if (allowedOrigin === '*' || !requestOrigin || requestOrigin === allowedOrigin) {
    res.header('Access-Control-Allow-Origin', requestOrigin || allowedOrigin);
  } else {
    res.header('Access-Control-Allow-Origin', allowedOrigin);
  }

  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Credentials', 'true');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  next();
}
