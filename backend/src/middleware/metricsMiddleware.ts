import { Request, Response, NextFunction } from 'express';
import db from '../db/database';

export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const endpoint = req.route ? req.route.path : req.path;
    const success = res.statusCode < 400 ? 1 : 0;
    
    // Ignore static files or internal checks if any
    if (req.path.startsWith('/api') || req.path === '/graphql') {
      try {
        const stmt = db.prepare(`
          INSERT INTO metrics (id, timestamp, latencyMs, statusCode, endpoint, success)
          VALUES (?, ?, ?, ?, ?, ?)
        `);
        stmt.run(
          `MTR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          new Date().toISOString(),
          duration,
          res.statusCode,
          endpoint,
          success
        );
      } catch (err) {
        console.error('Error logging metric:', err);
      }
    }
  });

  next();
}
