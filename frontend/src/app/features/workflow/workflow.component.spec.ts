import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowComponent } from './workflow.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { jobReducer } from '../../state/job/job.reducer';
import * as JobActions from '../../state/job/job.actions';
import { Job } from '../../models/job.model';
import { RoleService } from '../../core/services/role.service';

describe('WorkflowComponent (Kanban Board) Unit & Accessibility Tests', () => {
  let component: WorkflowComponent;
  let fixture: ComponentFixture<WorkflowComponent>;
  let store: Store;
  let roleService: RoleService;

  const testJobs: Job[] = [
    {
      id: 'JOB-101',
      customerName: 'Solar Array Alpha',
      siteAddress: '123 Sol St',
      productType: 'Commercial Solar',
      assignedEngineer: 'Elena Rostova',
      assignedManager: 'Amanda Torres',
      currentStage: 'Site Assessment',
      status: 'In Progress',
      priority: 'High',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      targetCompletionDate: '2026-11-01',
      blockerReason: null,
      permitStatus: 'Pending',
      installationProgress: 11,
      estimatedHours: 80,
      actualHours: 10
    },
    {
      id: 'JOB-102',
      customerName: 'Wind Turbine Delta',
      siteAddress: '456 Gust Ave',
      productType: 'Industrial Wind Turbine',
      assignedEngineer: 'Marcus Vance',
      assignedManager: 'Robert Sterling',
      currentStage: 'System Design',
      status: 'Blocked',
      priority: 'Critical',
      createdAt: '2026-10-01T00:00:00Z',
      updatedAt: '2026-10-01T00:00:00Z',
      targetCompletionDate: '2026-10-28',
      blockerReason: 'Structural review pending',
      permitStatus: 'Revision Required',
      installationProgress: 22,
      estimatedHours: 120,
      actualHours: 35
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [WorkflowComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        provideStore({ jobs: jobReducer }),
        RoleService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(WorkflowComponent);
    component = fixture.componentInstance;
    store = TestBed.inject(Store);
    roleService = TestBed.inject(RoleService);
    fixture.detectChanges();
  });

  it('1. should create the Kanban workflow board component', () => {
    expect(component).toBeTruthy();
  });

  it('2. should initialize 9 workflow stage columns', () => {
    expect(component.columns.length).toBe(9);
    expect(component.columns[0].name).toBe('Site Assessment');
    expect(component.columns[8].name).toBe('Completion');
  });

  it('3. should render jobs in their corresponding stage columns from NgRx store', () => {
    store.dispatch(JobActions.loadJobsSuccess({ jobs: testJobs, stats: null }));
    fixture.detectChanges();

    const siteAssessmentCol = component.columns.find(c => c.stage === 'Site Assessment');
    const systemDesignCol = component.columns.find(c => c.stage === 'System Design');

    expect(siteAssessmentCol?.jobs.length).toBe(1);
    expect(siteAssessmentCol?.jobs[0].id).toBe('JOB-101');

    expect(systemDesignCol?.jobs.length).toBe(1);
    expect(systemDesignCol?.jobs[0].id).toBe('JOB-102');
  });

  it('4. should display an accessible error alert banner when a workflow error occurs', () => {
    const errorMsg = 'Cannot skip stages from "Site Assessment" to "Completion".';
    store.dispatch(JobActions.updateJobStageFailure({ error: errorMsg }));
    fixture.detectChanges();

    const banner = fixture.nativeElement.querySelector('.error-banner');
    expect(banner).not.toBeNull();
    expect(banner.textContent).toContain('Workflow Error:');
    expect(banner.textContent).toContain(errorMsg);
  });

  it('5. should display a loading indicator bar while store is updating', () => {
    store.dispatch(JobActions.loadJobs({}));
    fixture.detectChanges();

    const loadingBar = fixture.nativeElement.querySelector('.loading-state-bar');
    expect(loadingBar).not.toBeNull();
    expect(loadingBar.textContent).toContain('Syncing workflow pipeline state');
  });

  it('6. should render empty state placeholder when a column has zero contracts', () => {
    store.dispatch(JobActions.loadJobsSuccess({ jobs: [testJobs[0]], stats: null }));
    fixture.detectChanges();

    const completionColElem = fixture.nativeElement.querySelector('[aria-label*="Completion column"]');
    expect(completionColElem).not.toBeNull();
    expect(completionColElem.textContent).toContain('No jobs in Completion');
  });

  it('7. should handle keyboard stage advancement via ArrowRight key event', () => {
    const spy = spyOn(component, 'moveStageDirectly');
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });

    component.onCardKeydown(event, testJobs[0]);
    expect(spy).toHaveBeenCalledWith(testJobs[0], 'forward');
  });

  it('8. should calculate next and previous stages accurately', () => {
    expect(component.getNextStage('Site Assessment')).toBe('System Design');
    expect(component.getPreviousStage('System Design')).toBe('Site Assessment');
    expect(component.canMoveBack(testJobs[0])).toBeFalse();
    expect(component.canMoveForward(testJobs[0])).toBeTrue();
  });
});
