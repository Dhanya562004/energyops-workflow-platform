import { ComponentFixture, TestBed } from '@angular/core/testing';
import { JobDetailComponent } from './job-detail.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter, ActivatedRoute, convertToParamMap } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { of } from 'rxjs';
import { jobReducer } from '../../../state/job/job.reducer';
import * as JobActions from '../../../state/job/job.actions';
import { Job } from '../../../models/job.model';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';

describe('JobDetailComponent Unit & Integration Tests', () => {
  let component: JobDetailComponent;
  let fixture: ComponentFixture<JobDetailComponent>;
  let store: Store;
  let roleService: RoleService;

  const testJob: Job = {
    id: 'JOB-1001',
    customerName: 'AeroSpace Mfg HQ',
    siteAddress: '100 Innovation Way, Austin, TX',
    productType: 'Commercial Solar',
    assignedEngineer: 'Elena Rostova',
    assignedManager: 'Amanda Torres',
    currentStage: 'Installation',
    status: 'In Progress',
    priority: 'High',
    createdAt: '2026-10-01T00:00:00Z',
    updatedAt: '2026-10-01T00:00:00Z',
    targetCompletionDate: '2026-10-15',
    blockerReason: null,
    permitStatus: 'Approved',
    installationProgress: 75,
    estimatedHours: 120,
    actualHours: 92,
    history: [
      {
        id: 'HIST-1',
        jobId: 'JOB-1001',
        previousStage: 'Scheduling',
        newStage: 'Installation',
        previousStatus: 'In Progress',
        newStatus: 'In Progress',
        changedBy: 'Amanda Torres',
        changeReason: 'Permits clear, hardware delivered',
        createdAt: '2026-10-05T12:00:00Z'
      }
    ],
    blockers: [],
    notes: [
      {
        id: 'NOTE-1',
        jobId: 'JOB-1001',
        author: 'Elena Rostova',
        role: 'Engineer',
        content: 'Inverter rack anchor torque checks completed.',
        createdAt: '2026-10-06T14:30:00Z'
      }
    ]
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JobDetailComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideStore({ jobs: jobReducer }),
        RoleService,
        ToastService,
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              paramMap: convertToParamMap({ id: 'JOB-1001' })
            },
            paramMap: of(convertToParamMap({ id: 'JOB-1001' }))
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(JobDetailComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    roleService = TestBed.inject(RoleService);
    fixture.detectChanges();
  });

  it('1. should create the JobDetailComponent', () => {
    expect(component).toBeTruthy();
  });

  it('2. should display loading skeleton state when loading$ is true', () => {
    store.dispatch(JobActions.loadJobDetail({ id: 'JOB-1001' }));
    fixture.detectChanges();

    const skeleton = fixture.nativeElement.querySelector('.loading-skeleton-card');
    expect(skeleton).not.toBeNull();
  });

  it('3. should render contract specifications and stage stepper when job is in store', () => {
    store.dispatch(JobActions.loadJobDetailSuccess({ job: testJob }));
    fixture.detectChanges();

    const titleElem = fixture.nativeElement.querySelector('.job-id-title');
    expect(titleElem.textContent).toContain('JOB-1001');

    const customerSubtitle = fixture.nativeElement.querySelector('.customer-subtitle');
    expect(customerSubtitle.textContent).toContain('AeroSpace Mfg HQ');

    const steps = fixture.nativeElement.querySelectorAll('.step-item');
    expect(steps.length).toBe(9);
  });

  it('4. should render empty/not found message when job is null and not loading', () => {
    store.dispatch(JobActions.loadJobDetailFailure({ error: 'Job not found' }));
    fixture.detectChanges();

    const notFoundCard = fixture.nativeElement.querySelector('.empty-not-found');
    expect(notFoundCard).not.toBeNull();
    expect(notFoundCard.textContent).toContain('Installation Contract Not Found');
  });

  it('5. should display error banner when stage transition or load fails', () => {
    const errorMsg = 'Stage transition rejected by validation rules.';
    store.dispatch(JobActions.updateJobStageFailure({ error: errorMsg }));
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain(errorMsg);
  });

  it('6. should calculate labor variance correctly', () => {
    // 92 actual vs 120 estimated = -23% variance
    const variance = component.calculateVariance(92, 120);
    expect(variance).toBe(-23);
    expect(component.getVarianceClass(92, 120)).toBe('under');
    expect(component.getVarianceClass(130, 120)).toBe('over');
  });

  it('7. should open and close blocker modal', () => {
    expect(component.showBlockerModal).toBeFalse();
    component.openBlockerModal();
    expect(component.showBlockerModal).toBeTrue();
    expect(component.blockerInput).toBe('');
  });

  it('8. should dispatch updateJobStatus when submitBlocker is called', () => {
    const spy = spyOn(store, 'dispatch');
    component.blockerInput = 'Severe roof leak requiring remediation';

    component.submitBlocker(testJob);
    expect(spy).toHaveBeenCalledWith(
      JobActions.updateJobStatus({
        id: 'JOB-1001',
        status: 'Blocked',
        blockerReason: 'Severe roof leak requiring remediation'
      })
    );
    expect(component.showBlockerModal).toBeFalse();
  });
});
