import { createFeatureSelector, createSelector } from '@ngrx/store';
import { JobState } from './job.state';
import { WorkflowStage } from '../../models/job.model';

export const selectJobState = createFeatureSelector<JobState>('jobs');

export const selectAllJobs = createSelector(
  selectJobState,
  (state: JobState) => state.jobs
);

export const selectJobsLoading = createSelector(
  selectJobState,
  (state: JobState) => state.loading
);

export const selectJobsError = createSelector(
  selectJobState,
  (state: JobState) => state.error
);

export const selectSelectedJob = createSelector(
  selectJobState,
  (state: JobState) => state.selectedJob
);

export const selectJobStats = createSelector(
  selectJobState,
  (state: JobState) => state.stats
);

export const selectJobFilter = createSelector(
  selectJobState,
  (state: JobState) => state.filter
);

export const selectFilteredJobs = createSelector(
  selectAllJobs,
  selectJobFilter,
  (jobs, filter) => {
    return jobs.filter(job => {
      const matchesSearch = !filter.search ||
        job.customerName.toLowerCase().includes(filter.search.toLowerCase()) ||
        job.id.toLowerCase().includes(filter.search.toLowerCase()) ||
        job.assignedEngineer.toLowerCase().includes(filter.search.toLowerCase());

      const matchesStatus = filter.status === 'All' || job.status === filter.status;
      const matchesStage = filter.stage === 'All' || job.currentStage === filter.stage;

      return matchesSearch && matchesStatus && matchesStage;
    });
  }
);

export const selectJobsByStage = (stage: WorkflowStage) =>
  createSelector(selectAllJobs, (jobs) => jobs.filter(job => job.currentStage === stage));

export const selectBlockedJobs = createSelector(
  selectAllJobs,
  (jobs) => jobs.filter(job => job.status === 'Blocked')
);
