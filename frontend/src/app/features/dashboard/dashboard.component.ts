import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormControl } from '@angular/forms';
import { debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { JobService } from '../../services/job.service';
import { Job, JobQueryParams, JobStats, WORKFLOW_STAGES, WORKFLOW_STATUSES, PRODUCT_TYPES } from '../../models/job.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { StageBadgeComponent } from '../../shared/components/stage-badge/stage-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StatusBadgeComponent,
    StageBadgeComponent,
    PriorityBadgeComponent
  ],
  template: `
    <div class="dashboard-page">
      <!-- Page Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Operations Command Center</h1>
          <p class="page-subtitle">Real-time installation tracking, workflow pipeline monitoring, and resource management.</p>
        </div>
        <div class="header-actions">
          <a routerLink="/workflow" class="btn btn-secondary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="5" height="18" rx="1"/>
              <rect x="10" y="3" width="5" height="12" rx="1"/>
              <rect x="17" y="3" width="5" height="15" rx="1"/>
            </svg>
            Kanban Board
          </a>
          <a routerLink="/jobs" class="btn btn-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New Installation Job
          </a>
        </div>
      </div>

      <!-- KPI Stat Cards Grid -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon icon-blue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.activeJobs || 0 }}</span>
            <span class="stat-label">Active Installations</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-green">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.completedJobs || 0 }}</span>
            <span class="stat-label">Completed Jobs</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-amber">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.delayedJobs || 0 }}</span>
            <span class="stat-label">Delayed Jobs</span>
          </div>
        </div>

        <div class="stat-card highlight-red">
          <div class="stat-icon icon-red">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="7.86 2 16.14 2 22 7.86 22 16.14 16.14 22 7.86 22 2 16.14 2 7.86 7.86 2"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ stats?.blockedJobs || 0 }}</span>
            <span class="stat-label">Blocked (Alerts Active)</span>
          </div>
        </div>

        <div class="stat-card">
          <div class="stat-icon icon-indigo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div class="stat-content">
            <span class="stat-value">{{ (stats?.avgHours || 0) | number:'1.0-1' }}h</span>
            <span class="stat-label">Avg Execution Hours</span>
          </div>
        </div>
      </div>

      <!-- Filters & Controls Bar -->
      <div class="filter-panel">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="search-icon">
            <circle cx="11" cy="11" r="8"/>
            <line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input 
            type="text" 
            [formControl]="searchControl" 
            placeholder="Search by Job ID, customer, address, or engineer..."
            class="search-input"
          >
        </div>

        <div class="filter-group">
          <select [(ngModel)]="selectedStatus" (change)="onFilterChange()" class="filter-select">
            <option value="All">All Statuses</option>
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>

          <select [(ngModel)]="selectedStage" (change)="onFilterChange()" class="filter-select">
            <option value="All">All Stages</option>
            <option *ngFor="let st of stages" [value]="st">{{ st }}</option>
          </select>

          <select [(ngModel)]="selectedPriority" (change)="onFilterChange()" class="filter-select">
            <option value="All">All Priorities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>

          <select [(ngModel)]="selectedSort" (change)="onFilterChange()" class="filter-select">
            <option value="createdAt">Sort: Created Date</option>
            <option value="targetCompletionDate">Sort: Target Completion</option>
            <option value="installationProgress">Sort: Progress %</option>
            <option value="priority">Sort: Priority</option>
          </select>
        </div>
      </div>

      <!-- Main Jobs Data Table -->
      <div class="table-container card">
        <div *ngIf="loading$ | async" class="skeleton-loader">
          <div class="skeleton-row" *ngFor="let i of [1,2,3,4,5]"></div>
        </div>

        <table *ngIf="!(loading$ | async)" class="jobs-table">
          <thead>
            <tr>
              <th>Job ID & Customer</th>
              <th>Product Type</th>
              <th>Stage</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Assigned Engineer</th>
              <th>Progress</th>
              <th>Target Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let job of jobs" [ngClass]="{ 'row-blocked': job.status === 'Blocked' }">
              <td>
                <a [routerLink]="['/jobs', job.id]" class="job-id-link">{{ job.id }}</a>
                <div class="customer-name">{{ job.customerName }}</div>
                <div class="site-address">{{ job.siteAddress }}</div>
              </td>
              <td>
                <span class="product-tag">{{ job.productType }}</span>
              </td>
              <td>
                <app-stage-badge [stage]="job.currentStage"></app-stage-badge>
              </td>
              <td>
                <app-status-badge [status]="job.status"></app-status-badge>
                <div *ngIf="job.blockerReason" class="blocker-tooltip" [title]="job.blockerReason">
                  ⚠️ {{ job.blockerReason | slice:0:35 }}...
                </div>
              </td>
              <td>
                <app-priority-badge [priority]="job.priority"></app-priority-badge>
              </td>
              <td>
                <div class="engineer-cell">
                  <span class="engineer-name">{{ job.assignedEngineer }}</span>
                  <span class="manager-sub">Mgr: {{ job.assignedManager }}</span>
                </div>
              </td>
              <td>
                <div class="progress-bar-container">
                  <div class="progress-bar-fill" [style.width.%]="job.installationProgress"></div>
                </div>
                <span class="progress-text">{{ job.installationProgress }}%</span>
              </td>
              <td>
                <div class="date-text" [ngClass]="{ 'date-overdue': isOverdue(job.targetCompletionDate) }">
                  {{ job.targetCompletionDate | date:'mediumDate' }}
                </div>
              </td>
              <td>
                <a [routerLink]="['/jobs', job.id]" class="btn-action">View Details</a>
              </td>
            </tr>

            <tr *ngIf="jobs.length === 0">
              <td colspan="9" class="empty-state">
                <div class="empty-content">
                  <span class="empty-icon">🔍</span>
                  <h3>No Installation Jobs Found</h3>
                  <p>Try resetting your search query or status filter.</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Table Footer / Pagination -->
        <div class="table-footer" *ngIf="pagination">
          <span class="pagination-info">
            Showing {{ (pagination.page - 1) * pagination.limit + 1 }} - 
            {{ Math.min(pagination.page * pagination.limit, pagination.total) }} of {{ pagination.total }} jobs
          </span>

          <div class="pagination-controls">
            <button 
              class="btn-page" 
              [disabled]="pagination.page === 1" 
              (click)="changePage(pagination.page - 1)"
            >
              Previous
            </button>
            <span class="page-number">Page {{ pagination.page }} of {{ pagination.totalPages }}</span>
            <button 
              class="btn-page" 
              [disabled]="pagination.page === pagination.totalPages" 
              (click)="changePage(pagination.page + 1)"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.6rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
      margin-bottom: 4px;
    }
    .page-subtitle {
      color: var(--text-muted, #94a3b8);
      font-size: 0.88rem;
    }
    .header-actions {
      display: flex;
      gap: 12px;
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 16px;
    }
    .stat-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      padding: 18px;
      display: flex;
      align-items: center;
      gap: 14px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
      &.highlight-red { border-color: rgba(239, 68, 68, 0.4); background: rgba(239, 68, 68, 0.05); }
    }
    .stat-icon {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      svg { width: 22px; height: 22px; }
      &.icon-blue { background: rgba(59, 130, 246, 0.15); svg { stroke: #3b82f6; } }
      &.icon-green { background: rgba(16, 185, 129, 0.15); svg { stroke: #10b981; } }
      &.icon-amber { background: rgba(245, 158, 11, 0.15); svg { stroke: #f59e0b; } }
      &.icon-red { background: rgba(239, 68, 68, 0.15); svg { stroke: #ef4444; } }
      &.icon-indigo { background: rgba(99, 102, 241, 0.15); svg { stroke: #818cf8; } }
    }
    .stat-value {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
      line-height: 1;
    }
    .stat-label {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }

    .filter-panel {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      background: var(--bg-surface, #1e293b);
      padding: 14px 18px;
      border-radius: 12px;
      border: 1px solid var(--border-color, #334155);
    }
    .search-box {
      position: relative;
      flex: 1;
      max-width: 420px;
    }
    .search-icon {
      position: absolute;
      left: 12px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      stroke: var(--text-muted, #94a3b8);
    }
    .search-input {
      width: 100%;
      padding: 9px 12px 9px 38px;
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 8px;
      color: var(--text-main, #f8fafc);
      font-size: 0.85rem;
      outline: none;
      &:focus { border-color: #3b82f6; }
    }
    .filter-group {
      display: flex;
      gap: 10px;
    }
    .filter-select {
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 8px;
      padding: 8px 12px;
      color: var(--text-main, #f8fafc);
      font-size: 0.82rem;
      font-weight: 600;
      outline: none;
    }

    .table-container {
      background: var(--bg-surface, #1e293b);
      border-radius: 12px;
      border: 1px solid var(--border-color, #334155);
      overflow: hidden;
    }
    .jobs-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      th {
        background: var(--bg-darker, #0f172a);
        padding: 12px 16px;
        font-size: 0.75rem;
        font-weight: 700;
        color: var(--text-muted, #94a3b8);
        text-transform: uppercase;
        border-bottom: 1px solid var(--border-color, #334155);
      }
      td {
        padding: 14px 16px;
        border-bottom: 1px solid var(--border-color, #334155);
        font-size: 0.85rem;
      }
      tr:hover { background: rgba(255,255,255,0.02); }
      tr.row-blocked { background: rgba(239, 68, 68, 0.04); }
    }
    .job-id-link {
      font-weight: 800;
      color: #38bdf8;
      text-decoration: none;
      &:hover { text-decoration: underline; }
    }
    .customer-name {
      font-weight: 700;
      color: var(--text-main, #f8fafc);
    }
    .site-address {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }
    .product-tag {
      font-size: 0.78rem;
      font-weight: 600;
      color: #cbd5e1;
    }
    .blocker-tooltip {
      font-size: 0.7rem;
      color: #ef4444;
      font-weight: 600;
      margin-top: 4px;
    }
    .engineer-cell {
      display: flex;
      flex-direction: column;
    }
    .engineer-name {
      font-weight: 600;
      color: var(--text-main, #f8fafc);
    }
    .manager-sub {
      font-size: 0.7rem;
      color: var(--text-muted, #94a3b8);
    }

    .progress-bar-container {
      width: 100px;
      height: 6px;
      background: var(--bg-darker, #0f172a);
      border-radius: 9999px;
      overflow: hidden;
      margin-bottom: 4px;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #10b981);
    }
    .progress-text {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--text-muted, #94a3b8);
    }

    .date-text {
      font-size: 0.8rem;
      color: var(--text-muted, #94a3b8);
      &.date-overdue { color: #f87171; font-weight: 700; }
    }

    .btn-action {
      font-size: 0.75rem;
      font-weight: 700;
      color: #38bdf8;
      background: rgba(56, 189, 248, 0.1);
      padding: 5px 10px;
      border-radius: 6px;
      text-decoration: none;
      &:hover { background: rgba(56, 189, 248, 0.2); }
    }

    .table-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 18px;
      background: var(--bg-darker, #0f172a);
      border-top: 1px solid var(--border-color, #334155);
    }
    .pagination-info {
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
    }
    .pagination-controls {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .btn-page {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      color: var(--text-main, #f8fafc);
      padding: 5px 12px;
      border-radius: 6px;
      font-size: 0.78rem;
      cursor: pointer;
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .page-number {
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
    }
    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      .empty-icon { font-size: 2rem; }
      h3 { font-size: 1.1rem; color: var(--text-main, #f8fafc); }
      p { font-size: 0.85rem; color: var(--text-muted, #94a3b8); }
    }
  `]
})
export class DashboardComponent implements OnInit {
  jobs: Job[] = [];
  stats: JobStats | null = null;
  pagination: any = null;
  loading$!: Observable<boolean>;

  searchControl = new FormControl('');
  selectedStatus = 'All';
  selectedStage = 'All';
  selectedPriority = 'All';
  selectedSort = 'createdAt';
  currentPage = 1;

  statuses = WORKFLOW_STATUSES;
  stages = WORKFLOW_STAGES;
  Math = Math;

  constructor(private jobService: JobService) {
    this.loading$ = this.jobService.loading$;
  }

  ngOnInit(): void {
    this.loadJobs();

    this.searchControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.currentPage = 1;
        this.loadJobs();
      });
  }

  loadJobs(): void {
    const params: JobQueryParams = {
      search: this.searchControl.value || '',
      status: this.selectedStatus,
      stage: this.selectedStage,
      priority: this.selectedPriority,
      sort: this.selectedSort,
      page: this.currentPage,
      limit: 10
    };

    this.jobService.getJobs(params).subscribe(res => {
      this.jobs = res.data;
      this.stats = res.stats;
      this.pagination = res.pagination;
    });
  }

  onFilterChange(): void {
    this.currentPage = 1;
    this.loadJobs();
  }

  changePage(page: number): void {
    this.currentPage = page;
    this.loadJobs();
  }

  isOverdue(dateStr: string): boolean {
    return new Date(dateStr).getTime() < Date.now();
  }
}
