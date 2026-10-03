import { Router, Request, Response, NextFunction } from 'express';
import db from '../db/database';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/alerts - Operational monitoring alerts
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status = 'All', severity = 'All' } = req.query;

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (status !== 'All') {
      whereConditions.push('a.status = ?');
      params.push(status);
    }

    if (severity !== 'All') {
      whereConditions.push('a.severity = ?');
      params.push(severity);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const query = `
      SELECT 
        a.*, 
        j.customerName, 
        j.currentStage, 
        j.assignedEngineer,
        j.priority as jobPriority
      FROM alerts a
      LEFT JOIN jobs j ON a.jobId = j.id
      ${whereClause}
      ORDER BY 
        CASE a.severity
          WHEN 'CRITICAL' THEN 1
          WHEN 'HIGH' THEN 2
          WHEN 'MEDIUM' THEN 3
          ELSE 4
        END,
        a.createdAt DESC
    `;

    const alerts = db.prepare(query).all(...params);

    const counts = db.prepare(`
      SELECT
        COUNT(*) as totalAlerts,
        SUM(CASE WHEN status = 'Active' THEN 1 ELSE 0 END) as activeAlerts,
        SUM(CASE WHEN severity = 'CRITICAL' AND status = 'Active' THEN 1 ELSE 0 END) as criticalAlerts
      FROM alerts
    `).get();

    res.json({
      success: true,
      data: alerts,
      summary: counts
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/alerts/:id/acknowledge - Acknowledge alert
router.patch('/:id/acknowledge', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { acknowledgedBy = 'Operational Admin' } = req.body;

    const alert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);
    if (!alert) {
      const err: AppError = new Error(`Alert ${id} not found`);
      err.statusCode = 404;
      return next(err);
    }

    const now = new Date().toISOString();

    db.prepare(`
      UPDATE alerts SET
        status = 'Acknowledged',
        acknowledgedAt = ?,
        acknowledgedBy = ?
      WHERE id = ?
    `).run(now, acknowledgedBy, id);

    const updatedAlert = db.prepare('SELECT * FROM alerts WHERE id = ?').get(id);

    res.json({
      success: true,
      data: updatedAlert,
      message: `Alert ${id} acknowledged by ${acknowledgedBy}`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
