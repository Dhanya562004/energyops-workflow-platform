import { ComponentFixture, TestBed } from '@angular/core/testing';
import { WorkflowComponent } from './workflow.component';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { provideStore, Store } from '@ngrx/store';
import { jobReducer } from '../../state/job/job.reducer';
import * as JobActions from '../../state/job/job.actions';
import { RoleService } from '../../core/services/role.service';
import axe from 'axe-core';

describe('WorkflowComponent WCAG 2.1 AA Automated Accessibility Audit', () => {
  let fixture: ComponentFixture<WorkflowComponent>;
  let store: Store;

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
    store = TestBed.inject(Store);

    store.dispatch(
      JobActions.loadJobsSuccess({
        jobs: [
          {
            id: 'JOB-WCAG-1',
            customerName: 'Accessible Solar Hub',
            siteAddress: '100 Green St',
            productType: 'Commercial Solar',
            assignedEngineer: 'Elena Rostova',
            assignedManager: 'Amanda Torres',
            currentStage: 'Site Assessment',
            status: 'In Progress',
            priority: 'Medium',
            createdAt: '2026-10-01T00:00:00Z',
            updatedAt: '2026-10-01T00:00:00Z',
            targetCompletionDate: '2026-11-01',
            blockerReason: null,
            permitStatus: 'Pending',
            installationProgress: 15,
            estimatedHours: 80,
            actualHours: 10
          }
        ],
        stats: null
      })
    );
    fixture.detectChanges();
  });

  it('1. should pass automated WCAG 2.1 AA axe-core accessibility checks', async () => {
    const results = await axe.run(fixture.nativeElement, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa']
      }
    });

    const violations = results.violations;
    if (violations.length > 0) {
      console.warn('Axe Accessibility Violations Report:', JSON.stringify(violations, null, 2));
    }

    // Report findings directly
    expect(violations.length).toBe(0);
  });
});
