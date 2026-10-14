import { jobReducer } from './job.reducer';
import { initialJobState, JobState } from './job.state';
import * as JobActions from './job.actions';
import { Job } from '../../models/job.model';

describe('JobReducer Unit Tests', () => {
  const sampleJob: Job = {
    id: 'JOB-2001',
    customerName: 'SolarTech HQ',
    siteAddress: '10 Industrial Way, Boston, MA',
    productType: 'Commercial Solar',
    assignedEngineer: 'Marcus Vance',
    assignedManager: 'Amanda Torres',
    currentStage: 'Site Assessment',
    status: 'In Progress',
    priority: 'Medium',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    targetCompletionDate: '2026-10-25',
    blockerReason: null,
    permitStatus: 'Pending',
    installationProgress: 10,
    estimatedHours: 100,
    actualHours: 12
  };

  it('1. should return default state when unknown action is provided', () => {
    const action = { type: 'UNKNOWN_ACTION' } as any;
    const state = jobReducer(undefined, action);
    expect(state).toEqual(initialJobState);
  });

  it('2. loadJobs: should set loading flag to true and clear previous error', () => {
    const previousState: JobState = { ...initialJobState, error: 'Previous error' };
    const state = jobReducer(previousState, JobActions.loadJobs({}));
    expect(state.loading).toBeTrue();
    expect(state.error).toBeNull();
  });

  it('3. loadJobsSuccess: should populate jobs and reset loading to false', () => {
    const state = jobReducer(
      { ...initialJobState, loading: true },
      JobActions.loadJobsSuccess({ jobs: [sampleJob], stats: null })
    );
    expect(state.loading).toBeFalse();
    expect(state.jobs.length).toBe(1);
    expect(state.jobs[0].id).toBe('JOB-2001');
    expect(state.error).toBeNull();
  });

  it('4. loadJobsFailure: should populate error and stop loading', () => {
    const errorMsg = 'Failed to fetch jobs from server';
    const state = jobReducer(
      { ...initialJobState, loading: true },
      JobActions.loadJobsFailure({ error: errorMsg })
    );
    expect(state.loading).toBeFalse();
    expect(state.error).toBe(errorMsg);
  });

  it('5. loadJobDetailSuccess: should populate selectedJob immutably', () => {
    const state = jobReducer(
      { ...initialJobState, loading: true },
      JobActions.loadJobDetailSuccess({ job: sampleJob })
    );
    expect(state.loading).toBeFalse();
    expect(state.selectedJob).toEqual(sampleJob);
  });

  it('6. updateJobStageSuccess: should update target job in array and selectedJob', () => {
    const updatedJob: Job = { ...sampleJob, currentStage: 'System Design', installationProgress: 22 };
    const initialStateWithJob: JobState = {
      ...initialJobState,
      jobs: [sampleJob],
      selectedJob: sampleJob
    };

    const state = jobReducer(
      initialStateWithJob,
      JobActions.updateJobStageSuccess({ job: updatedJob })
    );

    expect(state.jobs[0].currentStage).toBe('System Design');
    expect(state.selectedJob?.currentStage).toBe('System Design');
    expect(state.loading).toBeFalse();
  });

  it('7. updateJobStageFailure: should record validation failure error message', () => {
    const errorMsg = 'Invalid stage transition: Site Assessment to Inspection not permitted';
    const state = jobReducer(
      { ...initialJobState, loading: true },
      JobActions.updateJobStageFailure({ error: errorMsg })
    );
    expect(state.loading).toBeFalse();
    expect(state.error).toBe(errorMsg);
  });

  it('8. updateJobStatusSuccess: should update job status and blocker reason', () => {
    const blockedJob: Job = { ...sampleJob, status: 'Blocked', blockerReason: 'Grid delay' };
    const state = jobReducer(
      { ...initialJobState, jobs: [sampleJob] },
      JobActions.updateJobStatusSuccess({ job: blockedJob })
    );
    expect(state.jobs[0].status).toBe('Blocked');
    expect(state.jobs[0].blockerReason).toBe('Grid delay');
  });

  it('9. createJobSuccess: should prepend newly initialized contract to state array', () => {
    const newJob: Job = { ...sampleJob, id: 'JOB-9999' };
    const state = jobReducer(
      { ...initialJobState, jobs: [sampleJob] },
      JobActions.createJobSuccess({ job: newJob })
    );
    expect(state.jobs.length).toBe(2);
    expect(state.jobs[0].id).toBe('JOB-9999');
  });

  it('10. clearJobError: should reset error back to null', () => {
    const stateWithError: JobState = { ...initialJobState, error: 'Network timeout' };
    const state = jobReducer(stateWithError, JobActions.clearJobError());
    expect(state.error).toBeNull();
  });
});
