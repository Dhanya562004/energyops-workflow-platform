import { createReducer, on } from '@ngrx/store';
import { initialJobState, JobState } from './job.state';
import * as JobActions from './job.actions';

export const jobReducer = createReducer(
  initialJobState,

  // Load Jobs
  on(JobActions.loadJobs, (state): JobState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(JobActions.loadJobsSuccess, (state, { jobs, stats }): JobState => ({
    ...state,
    loading: false,
    jobs,
    stats: stats !== undefined ? stats : state.stats,
    error: null
  })),
  on(JobActions.loadJobsFailure, (state, { error }): JobState => ({
    ...state,
    loading: false,
    error
  })),

  // Load Job Detail
  on(JobActions.loadJobDetail, (state): JobState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(JobActions.loadJobDetailSuccess, (state, { job }): JobState => ({
    ...state,
    loading: false,
    selectedJob: job,
    error: null
  })),
  on(JobActions.loadJobDetailFailure, (state, { error }): JobState => ({
    ...state,
    loading: false,
    error
  })),

  // Update Stage
  on(JobActions.updateJobStage, (state): JobState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(JobActions.updateJobStageSuccess, (state, { job }): JobState => ({
    ...state,
    loading: false,
    jobs: state.jobs.map(j => (j.id === job.id ? job : j)),
    selectedJob: state.selectedJob?.id === job.id ? job : state.selectedJob,
    error: null
  })),
  on(JobActions.updateJobStageFailure, (state, { error }): JobState => ({
    ...state,
    loading: false,
    error
  })),

  // Update Status
  on(JobActions.updateJobStatus, (state): JobState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(JobActions.updateJobStatusSuccess, (state, { job }): JobState => ({
    ...state,
    loading: false,
    jobs: state.jobs.map(j => (j.id === job.id ? job : j)),
    selectedJob: state.selectedJob?.id === job.id ? job : state.selectedJob,
    error: null
  })),
  on(JobActions.updateJobStatusFailure, (state, { error }): JobState => ({
    ...state,
    loading: false,
    error
  })),

  // Resolve Blocker
  on(JobActions.resolveBlocker, (state): JobState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(JobActions.resolveBlockerSuccess, (state, { job }): JobState => ({
    ...state,
    loading: false,
    jobs: job ? state.jobs.map(j => (j.id === job.id ? job : j)) : state.jobs,
    selectedJob: job && state.selectedJob?.id === job.id ? job : state.selectedJob,
    error: null
  })),
  on(JobActions.resolveBlockerFailure, (state, { error }): JobState => ({
    ...state,
    loading: false,
    error
  })),

  // Create Job
  on(JobActions.createJob, (state): JobState => ({
    ...state,
    loading: true,
    error: null
  })),
  on(JobActions.createJobSuccess, (state, { job }): JobState => ({
    ...state,
    loading: false,
    jobs: [job, ...state.jobs],
    error: null
  })),
  on(JobActions.createJobFailure, (state, { error }): JobState => ({
    ...state,
    loading: false,
    error
  })),

  // Clear Error
  on(JobActions.clearJobError, (state): JobState => ({
    ...state,
    error: null
  })),

  // Filter
  on(JobActions.setJobFilters, (state, { search, status, stage }): JobState => ({
    ...state,
    filter: {
      search: search !== undefined ? search : state.filter.search,
      status: status !== undefined ? status : state.filter.status,
      stage: stage !== undefined ? stage : state.filter.stage
    }
  }))
);
