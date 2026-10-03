import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { JobService } from '../../../services/job.service';
import { ToastService } from '../../../core/services/toast.service';
import { Job, PRODUCT_TYPES, WORKFLOW_STATUSES, WORKFLOW_STAGES } from '../../../models/job.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';

@Component({
  selector: 'app-jobs-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    FormsModule,
    StatusBadgeComponent,
    StageBadgeComponent,
    PriorityBadgeComponent
  ],
  template: `
    <div class="jobs-list-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Installation Jobs Registry</h1>
          <p class="page-subtitle">Central management database of all enterprise energy installation contracts.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          ➕ Create New Job
        </button>
      </div>

      <!-- Quick Filter Bar -->
      <div class="filter-card card">
        <input 
          type="text" 
          [(ngModel)]="searchQuery" 
          (ngModelChange)="onSearch()" 
          placeholder="Filter by customer, ID, engineer..." 
          class="search-input"
        >

        <select [(ngModel)]="statusFilter" (change)="onSearch()" class="filter-select">
          <option value="All">All Statuses</option>
          <option *ngFor="let st of statuses" [value]="st">{{ st }}</option>
        </select>

        <select [(ngModel)]="stageFilter" (change)="onSearch()" class="filter-select">
          <option value="All">All Stages</option>
          <option *ngFor="let sg of stages" [value]="sg">{{ sg }}</option>
        </select>
      </div>

      <!-- Jobs Grid Cards -->
      <div class="jobs-grid">
        <div 
          *ngFor="let job of jobs" 
          class="job-grid-card card"
          [ngClass]="{ 'card-blocked': job.status === 'Blocked' }"
        >
          <div class="card-top">
            <a [routerLink]="['/jobs', job.id]" class="job-id">{{ job.id }}</a>
            <app-priority-badge [priority]="job.priority"></app-priority-badge>
          </div>

          <h3 class="customer-name">{{ job.customerName }}</h3>
          <p class="site-address">📍 {{ job.siteAddress }}</p>

          <div class="badge-row">
            <app-stage-badge [stage]="job.currentStage"></app-stage-badge>
            <app-status-badge [status]="job.status"></app-status-badge>
          </div>

          <div *ngIf="job.blockerReason" class="blocker-warning">
            ⚠️ {{ job.blockerReason }}
          </div>

          <div class="card-meta">
            <div class="meta-item">
              <span class="meta-label">Product</span>
              <span class="meta-val">{{ job.productType }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Engineer</span>
              <span class="meta-val">{{ job.assignedEngineer }}</span>
            </div>
            <div class="meta-item">
              <span class="meta-label">Progress</span>
              <span class="meta-val">{{ job.installationProgress }}%</span>
            </div>
          </div>

          <div class="card-footer">
            <a [routerLink]="['/jobs', job.id]" class="btn btn-secondary btn-full">View Full Specification ➔</a>
          </div>
        </div>
      </div>

      <!-- Create New Job Reactive Form Modal -->
      <div class="modal-backdrop" *ngIf="showCreateModal">
        <div class="modal-card wide">
          <div class="modal-header">
            <h3>Create New Installation Job</h3>
            <button class="modal-close" (click)="showCreateModal = false">✕</button>
          </div>

          <form [formGroup]="jobForm" (ngSubmit)="submitCreateJob()" class="create-form">
            <div class="form-grid">
              <div class="form-group">
                <label>Customer / Enterprise Name *</label>
                <input type="text" formControlName="customerName" class="form-input" placeholder="e.g. Apex BioTech HQ">
                <div *ngIf="jobForm.get('customerName')?.invalid && jobForm.get('customerName')?.touched" class="field-error">
                  Customer name is required.
                </div>
              </div>

              <div class="form-group">
                <label>Site Address *</label>
                <input type="text" formControlName="siteAddress" class="form-input" placeholder="e.g. 500 Energy Blvd, Austin, TX">
                <div *ngIf="jobForm.get('siteAddress')?.invalid && jobForm.get('siteAddress')?.touched" class="field-error">
                  Site address is required.
                </div>
              </div>

              <div class="form-group">
                <label>Product System Type *</label>
                <select formControlName="productType" class="form-select">
                  <option *ngFor="let p of productTypes" [value]="p">{{ p }}</option>
                </select>
              </div>

              <div class="form-group">
                <label>Assigned Lead Engineer *</label>
                <select formControlName="assignedEngineer" class="form-select">
                  <option value="Elena Rostova">Elena Rostova</option>
                  <option value="Marcus Vance">Marcus Vance</option>
                  <option value="Sarah Jenkins">Sarah Jenkins</option>
                  <option value="David Chen">David Chen</option>
                  <option value="Aisha Khan">Aisha Khan</option>
                  <option value="Carlos Mendez">Carlos Mendez</option>
                </select>
              </div>

              <div class="form-group">
                <label>Priority Level *</label>
                <select formControlName="priority" class="form-select">
                  <option value="Critical">Critical</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                  <option value="Low">Low</option>
                </select>
              </div>

              <div class="form-group">
                <label>Estimated Labor Hours *</label>
                <input type="number" formControlName="estimatedHours" class="form-input">
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showCreateModal = false">Cancel</button>
              <button type="submit" [disabled]="jobForm.invalid" class="btn btn-primary">Create Job Contract</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .jobs-list-page { display: flex; flex-direction: column; gap: 20px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; }
    .page-title { font-size: 1.5rem; font-weight: 800; color: var(--text-main, #f8fafc); }
    .page-subtitle { font-size: 0.85rem; color: var(--text-muted, #94a3b8); }

    .filter-card {
      background: var(--bg-surface, #1e293b); border: 1px solid var(--border-color, #334155);
      padding: 14px 18px; border-radius: 12px; display: flex; gap: 14px;
    }
    .search-input {
      flex: 1; padding: 8px 14px; background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155); border-radius: 8px; color: #fff; font-size: 0.85rem;
    }
    .filter-select {
      background: var(--bg-darker, #0f172a); border: 1px solid var(--border-color, #334155);
      border-radius: 8px; padding: 8px 12px; color: #fff; font-size: 0.82rem; font-weight: 600;
    }

    .jobs-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 18px;
    }
    .job-grid-card {
      background: var(--bg-surface, #1e293b); border: 1px solid var(--border-color, #334155);
      border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 10px;
      &.card-blocked { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.04); }
    }
    .card-top { display: flex; justify-content: space-between; align-items: center; }
    .job-id { font-weight: 800; color: #38bdf8; text-decoration: none; font-size: 0.9rem; }
    .customer-name { font-size: 1.05rem; font-weight: 800; color: var(--text-main, #f8fafc); }
    .site-address { font-size: 0.78rem; color: var(--text-muted, #94a3b8); }

    .badge-row { display: flex; gap: 8px; align-items: center; }
    .blocker-warning {
      background: rgba(239, 68, 68, 0.15); color: #f87171; padding: 6px 10px;
      border-radius: 6px; font-size: 0.75rem; font-weight: 600;
    }

    .card-meta {
      display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 8px;
      background: var(--bg-darker, #0f172a); padding: 10px; border-radius: 8px; margin-top: 4px;
    }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-size: 0.68rem; color: var(--text-muted, #94a3b8); font-weight: 600; }
    .meta-val { font-size: 0.78rem; font-weight: 700; color: var(--text-main, #f8fafc); }

    .card-footer { margin-top: 6px; }
    .btn-full { width: 100%; text-align: center; display: block; }

    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.75); z-index: 1000; display: flex; align-items: center; justify-content: center;
    }
    .modal-card.wide { width: 100%; max-width: 600px; }
    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .form-group { display: flex; flex-direction: column; gap: 4px; label { font-size: 0.78rem; color: var(--text-muted, #94a3b8); font-weight: 600; } }
    .form-input, .form-select {
      padding: 9px; background: var(--bg-darker, #0f172a); border: 1px solid var(--border-color, #334155);
      border-radius: 8px; color: #fff; font-size: 0.85rem;
    }
    .field-error { font-size: 0.7rem; color: #ef4444; }
  `]
})
export class JobsListComponent implements OnInit {
  jobs: Job[] = [];
  searchQuery = '';
  statusFilter = 'All';
  stageFilter = 'All';

  statuses = WORKFLOW_STATUSES;
  stages = WORKFLOW_STAGES;
  productTypes = PRODUCT_TYPES;

  showCreateModal = false;
  jobForm: FormGroup;

  constructor(
    private jobService: JobService,
    private fb: FormBuilder,
    private toastService: ToastService
  ) {
    this.jobForm = this.fb.group({
      customerName: ['', Validators.required],
      siteAddress: ['', Validators.required],
      productType: ['Commercial Solar', Validators.required],
      assignedEngineer: ['Elena Rostova', Validators.required],
      priority: ['Medium', Validators.required],
      estimatedHours: [120, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.loadJobs();
  }

  loadJobs(): void {
    this.jobService.getJobs({
      search: this.searchQuery,
      status: this.statusFilter,
      stage: this.stageFilter,
      limit: 50
    }).subscribe(res => {
      this.jobs = res.data;
    });
  }

  onSearch(): void {
    this.loadJobs();
  }

  openCreateModal(): void {
    this.jobForm.reset({
      productType: 'Commercial Solar',
      assignedEngineer: 'Elena Rostova',
      priority: 'Medium',
      estimatedHours: 120
    });
    this.showCreateModal = true;
  }

  submitCreateJob(): void {
    if (this.jobForm.invalid) return;

    this.jobService.createJob(this.jobForm.value).subscribe({
      next: (res) => {
        this.toastService.success('Job Created', `Job ${res.data.id} initialized successfully.`);
        this.showCreateModal = false;
        this.loadJobs();
      },
      error: (err) => {
        this.toastService.error('Create Failed', err.error?.error?.message || 'Failed to create job');
      }
    });
  }
}
