import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler';
import { WORKFLOW_STAGES, PRODUCT_TYPES } from '../utils/workflow';

export const VALID_PRIORITIES = ['Low', 'Medium', 'High', 'Critical'];
export const VALID_STATUSES = ['Not Started', 'In Progress', 'Blocked', 'Completed', 'Delayed'];

/**
 * Validates request payload for creating a new job contract
 */
export function validateJobCreate(req: Request, res: Response, next: NextFunction): void {
  const {
    customerName,
    siteAddress,
    productType,
    assignedEngineer,
    assignedManager,
    priority,
    estimatedHours
  } = req.body;

  const errors: string[] = [];

  if (!customerName || typeof customerName !== 'string' || customerName.trim().length < 2) {
    errors.push('customerName is required (minimum 2 characters).');
  }

  if (!siteAddress || typeof siteAddress !== 'string' || siteAddress.trim().length < 5) {
    errors.push('siteAddress is required (minimum 5 characters).');
  }

  if (!productType || !PRODUCT_TYPES.includes(productType)) {
    errors.push(`productType must be one of: [${PRODUCT_TYPES.join(', ')}].`);
  }

  if (!assignedEngineer || typeof assignedEngineer !== 'string' || assignedEngineer.trim().length < 2) {
    errors.push('assignedEngineer is required.');
  }

  if (!assignedManager || typeof assignedManager !== 'string' || assignedManager.trim().length < 2) {
    errors.push('assignedManager is required.');
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    errors.push(`priority must be one of: [${VALID_PRIORITIES.join(', ')}].`);
  }

  const hours = Number(estimatedHours);
  if (estimatedHours !== undefined && (isNaN(hours) || hours <= 0 || hours > 5000)) {
    errors.push('estimatedHours must be a positive number between 1 and 5000.');
  }

  if (errors.length > 0) {
    const err: AppError = new Error(`Validation failed: ${errors.join(' ')}`);
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  next();
}

/**
 * Validates stage transition request payload
 */
export function validateStageTransitionInput(req: Request, res: Response, next: NextFunction): void {
  const { newStage, reason } = req.body;

  if (!newStage || !WORKFLOW_STAGES.includes(newStage)) {
    const err: AppError = new Error(
      `Invalid or missing newStage. Must be one of: [${WORKFLOW_STAGES.join(', ')}]`
    );
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  if (reason && typeof reason !== 'string') {
    const err: AppError = new Error('reason must be a valid text string.');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  next();
}

/**
 * Validates status update request payload
 */
export function validateStatusUpdate(req: Request, res: Response, next: NextFunction): void {
  const { status, blockerReason } = req.body;

  if (!status || !VALID_STATUSES.includes(status)) {
    const err: AppError = new Error(
      `Invalid status. Must be one of: [${VALID_STATUSES.join(', ')}]`
    );
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  if (status === 'Blocked' && (!blockerReason || typeof blockerReason !== 'string' || blockerReason.trim().length < 3)) {
    const err: AppError = new Error('blockerReason is required when setting status to Blocked (minimum 3 characters).');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  next();
}

/**
 * Validates blocker creation request
 */
export function validateBlockerCreate(req: Request, res: Response, next: NextFunction): void {
  const { reason } = req.body;

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    const err: AppError = new Error('reason is required to flag a blocker (minimum 5 characters).');
    err.statusCode = 400;
    err.code = 'VALIDATION_ERROR';
    return next(err);
  }

  next();
}
