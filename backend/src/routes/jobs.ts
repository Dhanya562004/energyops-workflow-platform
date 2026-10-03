import { Router, Request, Response, NextFunction } from 'express';
import db from '../db/database';
import { validateStageTransition, WORKFLOW_STAGES } from '../utils/workflow';
import { AppError } from '../middleware/errorHandler';

const router = Router();

// GET /api/jobs - List jobs with search, filtering, sorting, pagination
router.get('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      search,
      status,
      stage,
      engineer,
      manager,
      priority,
      productType,
      page = '1',
      limit = '10',
      sort = 'createdAt',
      order = 'DESC'
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 10;
    const offset = (pageNum - 1) * limitNum;

    let whereConditions: string[] = [];
    let params: any[] = [];

    if (search) {
      whereConditions.push(`(
        id LIKE ? OR 
        customerName LIKE ? OR 
        siteAddress LIKE ? OR 
        assignedEngineer LIKE ?
      )`);
      const searchPattern = `%${search}%`;
      params.push(searchPattern, searchPattern, searchPattern, searchPattern);
    }

    if (status && status !== 'All') {
      whereConditions.push('status = ?');
      params.push(status);
    }

    if (stage && stage !== 'All') {
      whereConditions.push('currentStage = ?');
      params.push(stage);
    }

    if (engineer && engineer !== 'All') {
      whereConditions.push('assignedEngineer = ?');
      params.push(engineer);
    }

    if (manager && manager !== 'All') {
      whereConditions.push('assignedManager = ?');
      params.push(manager);
    }

    if (priority && priority !== 'All') {
      whereConditions.push('priority = ?');
      params.push(priority);
    }

    if (productType && productType !== 'All') {
      whereConditions.push('productType = ?');
      params.push(productType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';
    
    // Allowed sort columns
    const allowedSorts = ['id', 'customerName', 'currentStage', 'status', 'priority', 'createdAt', 'updatedAt', 'targetCompletionDate', 'installationProgress'];
    const safeSort = allowedSorts.includes(sort as string) ? (sort as string) : 'createdAt';
    const safeOrder = (order as string).toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    // Count query
    const countStmt = db.prepare(`SELECT COUNT(*) as total FROM jobs ${whereClause}`);
    const countResult = countStmt.get(...params) as { total: number };
    const total = countResult.total;

    // Data query
    const query = `
      SELECT * FROM jobs 
      ${whereClause} 
      ORDER BY ${safeSort} ${safeOrder} 
      LIMIT ? OFFSET ?
    `;
    const jobs = db.prepare(query).all(...params, limitNum, offset);

    // Compute Dashboard summary stats
    const statsStmt = db.prepare(`
      SELECT
        COUNT(*) as totalJobs,
        SUM(CASE WHEN status = 'In Progress' OR status = 'Not Started' THEN 1 ELSE 0 END) as activeJobs,
        SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as completedJobs,
        SUM(CASE WHEN status = 'Delayed' THEN 1 ELSE 0 END) as delayedJobs,
        SUM(CASE WHEN status = 'Blocked' THEN 1 ELSE 0 END) as blockedJobs,
        AVG(actualHours) as avgHours
      FROM jobs
    `);
    const stats = statsStmt.get();

    res.json({
      success: true,
      data: jobs,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum)
      },
      stats
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id - Single job detail with relations
router.get('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    if (!job) {
      const err: AppError = new Error(`Job ${id} not found`);
      err.statusCode = 404;
      err.code = 'JOB_NOT_FOUND';
      return next(err);
    }

    const history = db.prepare('SELECT * FROM job_history WHERE jobId = ? ORDER BY createdAt DESC').all(id);
    const blockers = db.prepare('SELECT * FROM blockers WHERE jobId = ? ORDER BY createdAt DESC').all(id);
    const alerts = db.prepare('SELECT * FROM alerts WHERE jobId = ? ORDER BY createdAt DESC').all(id);
    const notes = db.prepare('SELECT * FROM job_notes WHERE jobId = ? ORDER BY createdAt DESC').all(id);

    res.json({
      success: true,
      data: {
        ...job,
        history,
        blockers,
        alerts,
        notes
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs - Create new job
router.post('/', (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      customerName,
      siteAddress,
      productType,
      assignedEngineer,
      assignedManager,
      currentStage = 'Site Assessment',
      priority = 'Medium',
      targetCompletionDate,
      estimatedHours = 100,
      userRole = 'Manager'
    } = req.body;

    if (!customerName || !siteAddress || !productType || !assignedEngineer || !assignedManager) {
      const err: AppError = new Error('Missing required job fields (customerName, siteAddress, productType, assignedEngineer, assignedManager)');
      err.statusCode = 400;
      err.code = 'VALIDATION_ERROR';
      return next(err);
    }

    const id = `JOB-${1000 + Math.floor(Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const defaultTarget = targetCompletionDate || new Date(Date.now() + 14 * 86400000).toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO jobs (
        id, customerName, siteAddress, productType, assignedEngineer, assignedManager,
        currentStage, status, priority, createdAt, updatedAt, targetCompletionDate,
        blockerReason, permitStatus, installationProgress, estimatedHours, actualHours
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(
      id, customerName, siteAddress, productType, assignedEngineer, assignedManager,
      currentStage, 'In Progress', priority, now, now, defaultTarget,
      null, 'Pending', 0, estimatedHours, 0
    );

    // Record initial history
    const histStmt = db.prepare(`
      INSERT INTO job_history (id, jobId, previousStage, newStage, previousStatus, newStatus, changedBy, changeReason, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    histStmt.run(`HIST-${Date.now()}`, id, null, currentStage, null, 'In Progress', assignedManager, 'Job created', now);

    const createdJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    res.status(201).json({
      success: true,
      data: createdJob,
      message: `Job ${id} created successfully`
    });
  } catch (err) {
    next(err);
  }
});

// PUT /api/jobs/:id - Update job fields
router.put('/:id', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const existing = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;

    if (!existing) {
      const err: AppError = new Error(`Job ${id} not found`);
      err.statusCode = 404;
      return next(err);
    }

    const {
      customerName = existing.customerName,
      siteAddress = existing.siteAddress,
      productType = existing.productType,
      assignedEngineer = existing.assignedEngineer,
      assignedManager = existing.assignedManager,
      priority = existing.priority,
      targetCompletionDate = existing.targetCompletionDate,
      permitStatus = existing.permitStatus,
      installationProgress = existing.installationProgress,
      estimatedHours = existing.estimatedHours,
      actualHours = existing.actualHours
    } = req.body;

    const now = new Date().toISOString();

    const updateStmt = db.prepare(`
      UPDATE jobs SET
        customerName = ?,
        siteAddress = ?,
        productType = ?,
        assignedEngineer = ?,
        assignedManager = ?,
        priority = ?,
        targetCompletionDate = ?,
        permitStatus = ?,
        installationProgress = ?,
        estimatedHours = ?,
        actualHours = ?,
        updatedAt = ?
      WHERE id = ?
    `);

    updateStmt.run(
      customerName, siteAddress, productType, assignedEngineer, assignedManager,
      priority, targetCompletionDate, permitStatus, installationProgress,
      estimatedHours, actualHours, now, id
    );

    const updated = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    res.json({
      success: true,
      data: updated,
      message: `Job ${id} updated`
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id/stage - Workflow stage transition with validation
router.patch('/:id/stage', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { newStage, userRole = 'Engineer', userName = 'System User', override = false, reason } = req.body;

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    if (!job) {
      const err: AppError = new Error(`Job ${id} not found`);
      err.statusCode = 404;
      return next(err);
    }

    const validation = validateStageTransition(
      job.currentStage,
      newStage,
      job.status,
      userRole,
      override
    );

    if (!validation.valid) {
      const err: AppError = new Error(validation.reason || 'Invalid stage transition');
      err.statusCode = 400;
      err.code = 'INVALID_STAGE_TRANSITION';
      return next(err);
    }

    const now = new Date().toISOString();

    // Auto-update status if moving to Completion
    let updatedStatus = job.status;
    if (newStage === 'Completion') {
      updatedStatus = 'Completed';
    } else if (job.status === 'Completed') {
      updatedStatus = 'In Progress';
    }

    // Auto-update progress %
    const stageIndex = WORKFLOW_STAGES.indexOf(newStage as any);
    const progressPct = Math.round(((stageIndex + 1) / WORKFLOW_STAGES.length) * 100);

    const updateStmt = db.prepare(`
      UPDATE jobs SET
        currentStage = ?,
        status = ?,
        installationProgress = ?,
        updatedAt = ?
      WHERE id = ?
    `);
    updateStmt.run(newStage, updatedStatus, progressPct, now, id);

    // Audit log history
    const histStmt = db.prepare(`
      INSERT INTO job_history (id, jobId, previousStage, newStage, previousStatus, newStatus, changedBy, changeReason, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    histStmt.run(
      `HIST-${Date.now()}`,
      id,
      job.currentStage,
      newStage,
      job.status,
      updatedStatus,
      userName,
      reason || `Transitioned stage from ${job.currentStage} to ${newStage}`,
      now
    );

    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    res.json({
      success: true,
      data: updatedJob,
      message: `Job ${id} stage updated to ${newStage}`
    });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/jobs/:id/status - Update status directly
router.patch('/:id/status', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status, blockerReason, userName = 'System User' } = req.body;

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    if (!job) {
      const err: AppError = new Error(`Job ${id} not found`);
      err.statusCode = 404;
      return next(err);
    }

    const now = new Date().toISOString();

    if (status === 'Blocked' && blockerReason) {
      // Add blocker entry
      const blockerStmt = db.prepare(`
        INSERT INTO blockers (id, jobId, reason, status, createdBy, createdAt)
        VALUES (?, ?, ?, 'Active', ?, ?)
      `);
      blockerStmt.run(`BLK-${Date.now()}`, id, blockerReason, userName, now);

      // Create critical alert
      const alertStmt = db.prepare(`
        INSERT INTO alerts (id, jobId, type, severity, message, status, createdAt)
        VALUES (?, ?, 'Job Blocked', 'CRITICAL', ?, 'Active', ?)
      `);
      alertStmt.run(`ALT-${Date.now()}`, id, `Job ${id} was marked as BLOCKED: ${blockerReason}`, now);
    }

    const updateStmt = db.prepare(`
      UPDATE jobs SET status = ?, blockerReason = ?, updatedAt = ? WHERE id = ?
    `);
    updateStmt.run(status, status === 'Blocked' ? blockerReason : null, now, id);

    // Audit log
    const histStmt = db.prepare(`
      INSERT INTO job_history (id, jobId, previousStage, newStage, previousStatus, newStatus, changedBy, changeReason, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    histStmt.run(`HIST-${Date.now()}`, id, job.currentStage, job.currentStage, job.status, status, userName, `Status changed to ${status}`, now);

    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    res.json({
      success: true,
      data: updatedJob,
      message: `Job ${id} status updated to ${status}`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/blockers - Flag a blocker
router.post('/:id/blockers', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { reason, createdBy = 'Engineer' } = req.body;

    if (!reason) {
      const err: AppError = new Error('Blocker reason is required');
      err.statusCode = 400;
      return next(err);
    }

    const job = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id) as any;
    if (!job) {
      const err: AppError = new Error(`Job ${id} not found`);
      err.statusCode = 404;
      return next(err);
    }

    const now = new Date().toISOString();
    const blockerId = `BLK-${Date.now()}`;

    // Insert blocker
    db.prepare(`
      INSERT INTO blockers (id, jobId, reason, status, createdBy, createdAt)
      VALUES (?, ?, ?, 'Active', ?, ?)
    `).run(blockerId, id, reason, createdBy, now);

    // Update job status to Blocked
    db.prepare(`
      UPDATE jobs SET status = 'Blocked', blockerReason = ?, updatedAt = ? WHERE id = ?
    `).run(reason, now, id);

    // Log alert
    db.prepare(`
      INSERT INTO alerts (id, jobId, type, severity, message, status, createdAt)
      VALUES (?, ?, 'Job Blocked', 'CRITICAL', ?, 'Active', ?)
    `).run(`ALT-${Date.now()}`, id, `Job ${id} is BLOCKED: ${reason}`, now);

    // Log history
    db.prepare(`
      INSERT INTO job_history (id, jobId, previousStage, newStage, previousStatus, newStatus, changedBy, changeReason, createdAt)
      VALUES (?, ?, ?, ?, ?, 'Blocked', ?, ?, ?)
    `).run(`HIST-${Date.now()}`, id, job.currentStage, job.currentStage, job.status, createdBy, `Blocker flagged: ${reason}`, now);

    const updatedJob = db.prepare('SELECT * FROM jobs WHERE id = ?').get(id);

    res.status(201).json({
      success: true,
      data: updatedJob,
      message: `Blocker recorded for job ${id}`
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/jobs/:id/notes - Add note
router.post('/:id/notes', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { author, role, content } = req.body;

    if (!author || !content) {
      const err: AppError = new Error('Author and content are required');
      err.statusCode = 400;
      return next(err);
    }

    const now = new Date().toISOString();
    const noteId = `NTE-${Date.now()}`;

    db.prepare(`
      INSERT INTO job_notes (id, jobId, author, role, content, createdAt)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(noteId, id, author, role || 'Engineer', content, now);

    const notes = db.prepare('SELECT * FROM job_notes WHERE jobId = ? ORDER BY createdAt DESC').all(id);

    res.status(201).json({
      success: true,
      data: notes,
      message: 'Note added successfully'
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/jobs/:id/history - Get audit history
router.get('/:id/history', (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const history = db.prepare('SELECT * FROM job_history WHERE jobId = ? ORDER BY createdAt DESC').all(id);

    res.json({
      success: true,
      data: history
    });
  } catch (err) {
    next(err);
  }
});

export default router;
