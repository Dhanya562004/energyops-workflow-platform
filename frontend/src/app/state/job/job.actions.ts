import { createAction, props } from '@ngrx/store';
import { Job, JobQueryParams, JobStats, WorkflowStage, WorkflowStatus } from '../../models/job.model';

// Load Jobs
export const loadJobs = createAction(
  '[Job] Load Jobs',
  props<{ queryParams?: JobQueryParams }>()
);

export const loadJobsSuccess = createAction(
  '[Job] Load Jobs Success',
  props<{ jobs: Job[]; stats?: JobStats | null }>()
);

export const loadJobsFailure = createAction(
  '[Job] Load Jobs Failure',
  props<{ error: string }>()
);

// Load Single Job
export const loadJobDetail = createAction(
  '[Job] Load Job Detail',
  props<{ id: string }>()
);

export const loadJobDetailSuccess = createAction(
  '[Job] Load Job Detail Success',
  props<{ job: Job }>()
);

export const loadJobDetailFailure = createAction(
  '[Job] Load Job Detail Failure',
  props<{ error: string }>()
);

// Update Stage
export const updateJobStage = createAction(
  '[Job] Update Job Stage',
  props<{ id: string; newStage: WorkflowStage; override?: boolean; reason?: string }>()
);

export const updateJobStageSuccess = createAction(
  '[Job] Update Job Stage Success',
  props<{ job: Job }>()
);

export const updateJobStageFailure = createAction(
  '[Job] Update Job Stage Failure',
  props<{ error: string }>()
);

// Update Status / Flag Blocker
export const updateJobStatus = createAction(
  '[Job] Update Job Status',
  props<{ id: string; status: WorkflowStatus; blockerReason?: string }>()
);

export const updateJobStatusSuccess = createAction(
  '[Job] Update Job Status Success',
  props<{ job: Job }>()
);

export const updateJobStatusFailure = createAction(
  '[Job] Update Job Status Failure',
  props<{ error: string }>()
);

// Resolve Blocker
export const resolveBlocker = createAction(
  '[Job] Resolve Blocker',
  props<{ blockerId: string; jobId: string; resolvedBy: string; resolutionNotes?: string }>()
);

export const resolveBlockerSuccess = createAction(
  '[Job] Resolve Blocker Success',
  props<{ blockerId: string; job?: Job }>()
);

export const resolveBlockerFailure = createAction(
  '[Job] Resolve Blocker Failure',
  props<{ error: string }>()
);

// Create Job
export const createJob = createAction(
  '[Job] Create Job',
  props<{ job: Partial<Job> }>()
);

export const createJobSuccess = createAction(
  '[Job] Create Job Success',
  props<{ job: Job }>()
);

export const createJobFailure = createAction(
  '[Job] Create Job Failure',
  props<{ error: string }>()
);

// Clear Error / Filter actions
export const clearJobError = createAction('[Job] Clear Error');

export const setJobFilters = createAction(
  '[Job] Set Filters',
  props<{ search?: string; status?: string; stage?: string }>()
);
