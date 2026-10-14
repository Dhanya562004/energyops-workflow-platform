import { Job, JobStats } from '../../models/job.model';

export interface JobState {
  jobs: Job[];
  selectedJob: Job | null;
  loading: boolean;
  error: string | null;
  stats: JobStats | null;
  filter: {
    search: string;
    status: string;
    stage: string;
  };
}

export const initialJobState: JobState = {
  jobs: [],
  selectedJob: null,
  loading: false,
  error: null,
  stats: null,
  filter: {
    search: '',
    status: 'All',
    stage: 'All'
  }
};
