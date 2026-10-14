import { Injectable, inject } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import * as JobActions from './job.actions';
import { JobService } from '../../services/job.service';
import { ToastService } from '../../core/services/toast.service';

@Injectable()
export class JobEffects {
  private actions$ = inject(Actions);
  private jobService = inject(JobService);
  private toastService = inject(ToastService);

  loadJobs$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobActions.loadJobs),
      switchMap(({ queryParams }) =>
        this.jobService.getJobs(queryParams).pipe(
          map(res => JobActions.loadJobsSuccess({ jobs: res.data, stats: res.stats })),
          catchError(err => {
            const errorMsg = err.error?.error?.message || err.message || 'Failed to load jobs';
            return of(JobActions.loadJobsFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  loadJobDetail$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobActions.loadJobDetail),
      switchMap(({ id }) =>
        this.jobService.getJobById(id).pipe(
          map(res => JobActions.loadJobDetailSuccess({ job: res.data })),
          catchError(err => {
            const errorMsg = err.error?.error?.message || err.message || `Failed to load job ${id}`;
            return of(JobActions.loadJobDetailFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  updateJobStage$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobActions.updateJobStage),
      switchMap(({ id, newStage, override, reason }) =>
        this.jobService.updateStage(id, newStage, override, reason).pipe(
          tap(() => {
            this.toastService.success(
              'Stage Advanced',
              `Job ${id} transitioned to "${newStage}" successfully.`
            );
          }),
          map(res => JobActions.updateJobStageSuccess({ job: res.data })),
          catchError(err => {
            const errorMsg = err.error?.error?.message || err.message || 'Stage transition rejected by validation rules';
            this.toastService.error('Transition Rejected', errorMsg);
            return of(JobActions.updateJobStageFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  updateJobStatus$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobActions.updateJobStatus),
      switchMap(({ id, status, blockerReason }) =>
        this.jobService.updateStatus(id, status, blockerReason).pipe(
          tap(() => {
            this.toastService.success(
              'Status Updated',
              `Job ${id} status updated to "${status}".`
            );
          }),
          map(res => JobActions.updateJobStatusSuccess({ job: res.data })),
          catchError(err => {
            const errorMsg = err.error?.error?.message || err.message || 'Failed to update status';
            this.toastService.error('Update Failed', errorMsg);
            return of(JobActions.updateJobStatusFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  resolveBlocker$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobActions.resolveBlocker),
      switchMap(({ blockerId, resolutionNotes }) =>
        this.jobService.resolveBlocker(blockerId, resolutionNotes || '').pipe(
          tap(() => {
            this.toastService.success(
              'Blocker Resolved',
              `Blocker resolved. Job status resumed.`
            );
          }),
          map(res => JobActions.resolveBlockerSuccess({ blockerId, job: res.data?.job })),
          catchError(err => {
            const errorMsg = err.error?.error?.message || err.message || 'Failed to resolve blocker';
            this.toastService.error('Action Failed', errorMsg);
            return of(JobActions.resolveBlockerFailure({ error: errorMsg }));
          })
        )
      )
    )
  );

  createJob$ = createEffect(() =>
    this.actions$.pipe(
      ofType(JobActions.createJob),
      switchMap(({ job }) =>
        this.jobService.createJob(job).pipe(
          tap(res => {
            this.toastService.success(
              'Job Created',
              `Job ${res.data.id} initialized successfully.`
            );
          }),
          map(res => JobActions.createJobSuccess({ job: res.data })),
          catchError(err => {
            const errorMsg = err.error?.error?.message || err.message || 'Failed to create job contract';
            this.toastService.error('Creation Failed', errorMsg);
            return of(JobActions.createJobFailure({ error: errorMsg }));
          })
        )
      )
    )
  );
}
