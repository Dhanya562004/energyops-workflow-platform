import { Router, Request, Response, NextFunction } from 'express';
import db from '../db/database';
import { AppError } from '../middleware/errorHandler';
import { requireAuth, requireRole } from '../middleware/authMiddleware';

const router = Router();

// PATCH /api/blockers/:id/resolve - Resolve a blocker and unblock job
router.patch(
  '/:id/resolve',
  requireAuth,
  requireRole('Admin', 'Manager'),
  (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { resolutionNotes } = req.body;
      const effectiveResolver = req.user!.name;

      const blocker = db.prepare('SELECT * FROM blockers WHERE id = ?').get(id) as any;
      if (!blocker) {
        const err: AppError = new Error(`Blocker ${id} not found`);
        err.statusCode = 404;
        return next(err);
      }

      const now = new Date().toISOString();

      // Mark blocker resolved
      db.prepare(`
        UPDATE blockers SET
          status = 'Resolved',
          resolvedBy = ?,
          resolvedAt = ?,
          resolutionNotes = ?
        WHERE id = ?
      `).run(effectiveResolver, now, resolutionNotes || 'Blocker resolved by operational manager.', id);

    // Check if job has remaining active blockers
    const activeBlockers = db.prepare(`
      SELECT COUNT(*) as count FROM blockers WHERE jobId = ? AND status = 'Active'
    `).get(blocker.jobId) as { count: number };

    let updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(blocker.jobId) as any;

    if (activeBlockers.count === 0 && updatedJob) {
      // Unblock job status
      db.prepare(`
        UPDATE jobs SET status = 'In Progress', blockerReason = NULL, updatedAt = ? WHERE id = ?
      `).run(now, blocker.jobId);

      // Audit history
      db.prepare(`
        INSERT INTO job_history (id, jobId, previousStage, newStage, previousStatus, newStatus, changedBy, changeReason, createdAt)
        VALUES (?, ?, ?, ?, 'Blocked', 'In Progress', ?, ?, ?)
      `).run(
        `HIST-${Date.now()}`,
        blocker.jobId,
        updatedJob.currentStage,
        updatedJob.currentStage,
        effectiveResolver,
        `Blocker resolved: ${blocker.reason}`,
        now
      );

      updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(blocker.jobId);
    }

    res.json({
      success: true,
      data: {
        blockerId: id,
        job: updatedJob
      },
      message: `Blocker ${id} marked as resolved.`
    });
  } catch (err) {
    next(err);
  }
});

export default router;
