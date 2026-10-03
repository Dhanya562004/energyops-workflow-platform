import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(err: AppError, req: Request, res: Response, next: NextFunction) {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'SERVER_ERROR';

  console.error(`[Error] ${req.method} ${req.url} - Status ${statusCode}:`, err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code,
      details: err.details || null,
      timestamp: new Date().toISOString()
    }
  });
}
