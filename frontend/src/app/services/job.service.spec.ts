import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { Job } from '../models/job.model';
import { JobService, JobsResponse, SingleJobResponse } from './job.service';
import { RoleService } from '../core/services/role.service';

describe('JobService Unit & Integration Tests', () => {
  let service: JobService;
  let httpMock: HttpTestingController;
  let _roleService: RoleService;

  const mockJob: Job = {
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
    actualHours: 92
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        JobService,
        RoleService,
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    });

    service = TestBed.inject(JobService);
    httpMock = TestBed.inject(HttpTestingController);
    _roleService = TestBed.inject(RoleService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('1. should be created successfully', () => {
    expect(service).toBeTruthy();
  });

  it('2. getJobs() - should fetch all jobs successfully and update jobsSubject', (done) => {
    const mockResponse: JobsResponse = {
      success: true,
      data: [mockJob],
      pagination: { total: 1, page: 1, limit: 10, totalPages: 1 },
      stats: {
        totalJobs: 1,
        activeJobs: 1,
        completedJobs: 0,
        delayedJobs: 0,
        blockedJobs: 0,
        avgHours: 120
      }
    };

    service.getJobs({ limit: 10 }).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.length).toBe(1);
      expect(res.data[0].id).toBe('JOB-1001');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs?limit=10');
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('3. getJobs() - Failure Path: should handle network/server 500 error gracefully', (done) => {
    service.getJobs().subscribe({
      next: () => fail('Expected network error but got success'),
      error: (err) => {
        expect(err.status).toBe(500);
        expect(err.statusText).toBe('Internal Server Error');
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs');
    req.flush({ error: { message: 'Database connection failed' } }, {
      status: 500,
      statusText: 'Internal Server Error'
    });
  });

  it('4. getJobById() - should retrieve single job with audit relations', (done) => {
    const singleResponse: SingleJobResponse = {
      success: true,
      data: mockJob
    };

    service.getJobById('JOB-1001').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.customerName).toBe('AeroSpace Mfg HQ');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs/JOB-1001');
    expect(req.request.method).toBe('GET');
    req.flush(singleResponse);
  });

  it('5. updateStage() - Success Path: should send stage update request with role context', (done) => {
    const updatedJob: Job = { ...mockJob, currentStage: 'Inspection' };

    service.updateStage('JOB-1001', 'Inspection', false, 'PE signoff complete').subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.currentStage).toBe('Inspection');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs/JOB-1001/stage');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.newStage).toBe('Inspection');
    expect(req.request.body.override).toBeFalse();
    expect(req.request.body.reason).toBe('PE signoff complete');

    req.flush({ success: true, data: updatedJob });
  });

  it('6. updateStage() - Failure Path: should handle 400 validation error when skipping stages non-sequentially', (done) => {
    service.updateStage('JOB-1001', 'Completion', false).subscribe({
      next: () => fail('Expected validation error 400 but got success'),
      error: (err) => {
        expect(err.status).toBe(400);
        expect(err.error.error.code).toBe('INVALID_STAGE_TRANSITION');
        expect(err.error.error.message).toContain('Cannot skip stages');
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs/JOB-1001/stage');
    req.flush(
      {
        success: false,
        error: {
          code: 'INVALID_STAGE_TRANSITION',
          message: 'Cannot skip stages from "Installation" to "Completion". Sequential transition required.'
        }
      },
      { status: 400, statusText: 'Bad Request' }
    );
  });

  it('7. updateStage() - Failure Path: should handle 403 forbidden error when unpermitted role attempts override', (done) => {
    service.updateStage('JOB-1001', 'Completion', true).subscribe({
      next: () => fail('Expected 403 Forbidden error but got success'),
      error: (err) => {
        expect(err.status).toBe(403);
        expect(err.error.error.code).toBe('FORBIDDEN_ACTION');
        done();
      }
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs/JOB-1001/stage');
    req.flush(
      {
        success: false,
        error: {
          code: 'FORBIDDEN_ACTION',
          message: 'Role "Engineer" is unauthorized to execute stage sequence override.'
        }
      },
      { status: 403, statusText: 'Forbidden' }
    );
  });

  it('8. createJob() - should send POST request with new contract specifications', (done) => {
    const newJobPayload: Partial<Job> = {
      customerName: 'Highland Logistics',
      siteAddress: '55 Freight Rd, Denver, CO',
      productType: 'EV Charging Hub',
      assignedEngineer: 'David Chen',
      estimatedHours: 90
    };

    service.createJob(newJobPayload).subscribe(res => {
      expect(res.success).toBeTrue();
      expect(res.data.id).toBe('JOB-9999');
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/jobs');
    expect(req.request.method).toBe('POST');
    expect(req.request.body.customerName).toBe('Highland Logistics');

    req.flush({ success: true, data: { ...newJobPayload, id: 'JOB-9999', currentStage: 'Site Assessment', status: 'In Progress' } });
  });

  it('9. resolveBlocker() - should send PATCH to resolve blocker and resume contract', (done) => {
    service.resolveBlocker('BLK-101', 'Permit expedited by city council').subscribe(res => {
      expect(res.success).toBeTrue();
      done();
    });

    const req = httpMock.expectOne('http://localhost:3000/api/blockers/BLK-101/resolve');
    expect(req.request.method).toBe('PATCH');
    expect(req.request.body.resolutionNotes).toBe('Permit expedited by city council');

    req.flush({ success: true, message: 'Blocker resolved' });
  });
});
