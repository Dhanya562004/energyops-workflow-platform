import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { JobService } from '../../services/job.service';
import { RoleService } from '../../core/services/role.service';
import { ToastService } from '../../core/services/toast.service';
import { Job, WorkflowStage, WORKFLOW_STAGES } from '../../models/job.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';

export interface BoardColumn {
  id: string;
  name: string;
  stage: WorkflowStage;
  jobs: Job[];
}

@Component({
  selector: 'app-workflow',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    DragDropModule,
    StatusBadgeComponent,
    PriorityBadgeComponent
  ],
  template: `
    <div class="workflow-page">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Job Workflow Pipeline</h1>
          <p class="page-subtitle">Drag and drop installation jobs across lifecycle stages with real-time transition validation.</p>
        </div>
        <div class="role-override-notice" *ngIf="roleService.canOverrideStage()">
          <span class="notice-badge">⚡ Admin Mode</span>
          <span>Stage transition checks bypassed</span>
        </div>
      </div>

      <!-- Kanban Swimlane Grid -->
      <div class="kanban-board">
        <div 
          *ngFor="let col of columns" 
          class="kanban-column"
        >
          <!-- Column Header -->
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-dot"></span>
              <h3 class="column-title">{{ col.name }}</h3>
            </div>
            <span class="column-count">{{ col.jobs.length }}</span>
          </div>

          <!-- Drop List Area -->
          <div
            [id]="col.id"
            cdkDropList
            [cdkDropListData]="col.jobs"
            [cdkDropListConnectedTo]="connectedColumnIds"
            (cdkDropListDropped)="onDrop($event, col.stage)"
            class="column-cards-container"
          >
            <!-- Job Card -->
            <div
              *ngFor="let job of col.jobs"
              cdkDrag
              [cdkDragData]="job"
              class="job-card"
              [ngClass]="{ 'card-blocked': job.status === 'Blocked' }"
            >
              <div class="card-header">
                <a [routerLink]="['/jobs', job.id]" class="card-id">{{ job.id }}</a>
                <app-priority-badge [priority]="job.priority"></app-priority-badge>
              </div>

              <div class="card-customer">{{ job.customerName }}</div>
              <div class="card-product">{{ job.productType }}</div>

              <div *ngIf="job.status === 'Blocked'" class="card-blocker-banner">
                <span class="alert-icon">⚠️</span>
                <span>{{ job.blockerReason || 'Blocker Active' }}</span>
              </div>

              <div class="card-footer">
                <div class="card-engineer">
                  <span class="eng-icon">👤</span>
                  <span>{{ job.assignedEngineer }}</span>
                </div>
                <app-status-badge [status]="job.status"></app-status-badge>
              </div>
            </div>

            <!-- Empty Column Placeholder -->
            <div *ngIf="col.jobs.length === 0" class="empty-column">
              <span>No jobs in {{ col.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Stage Transition Modal -->
      <div class="modal-backdrop" *ngIf="pendingTransition">
        <div class="modal-card">
          <div class="modal-header">
            <h3>Confirm Workflow Stage Change</h3>
            <button class="modal-close" (click)="cancelTransition()">✕</button>
          </div>

          <div class="modal-body" *ngIf="pendingTransition">
            <p>Are you sure you want to transition job <strong>{{ pendingTransition.job.id }}</strong> ({{ pendingTransition.job.customerName }})?</p>
            
            <div class="transition-preview">
              <div class="stage-pill">{{ pendingTransition.job.currentStage }}</div>
              <div class="arrow">➔</div>
              <div class="stage-pill target">{{ pendingTransition.targetStage }}</div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label>Reason / Audit Log Comment (Optional):</label>
              <input 
                type="text" 
                [(ngModel)]="transitionReason" 
                placeholder="e.g. Design review sign-off completed by senior engineer"
                class="modal-input"
              >
            </div>
          </div>

          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="cancelTransition()">Cancel</button>
            <button class="btn btn-primary" (click)="confirmTransition()">Confirm Stage Change</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .workflow-page {
      display: flex;
      flex-direction: column;
      gap: 16px;
      height: 100%;
    }
    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .page-title {
      font-size: 1.5rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
    }
    .page-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted, #94a3b8);
    }
    .role-override-notice {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(244, 63, 94, 0.15);
      border: 1px solid rgba(244, 63, 94, 0.3);
      padding: 6px 12px;
      border-radius: 8px;
      font-size: 0.78rem;
      color: #fb7185;
      font-weight: 700;
    }
    .notice-badge {
      background: #f43f5e;
      color: #fff;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 0.7rem;
    }

    .kanban-board {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      padding-bottom: 16px;
      min-height: calc(100vh - 180px);
    }
    .kanban-column {
      flex: 0 0 280px;
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      display: flex;
      flex-direction: column;
      max-height: calc(100vh - 200px);
    }
    .column-header {
      padding: 14px 16px;
      border-bottom: 1px solid var(--border-color, #334155);
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: var(--bg-darker, #0f172a);
      border-radius: 12px 12px 0 0;
    }
    .column-title-group {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .column-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #3b82f6;
    }
    .column-title {
      font-size: 0.88rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
    }
    .column-count {
      background: var(--bg-hover, #334155);
      color: var(--text-main, #f8fafc);
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 9999px;
    }

    .column-cards-container {
      padding: 12px;
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 12px;
      min-height: 200px;
    }

    .job-card {
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 10px;
      padding: 14px;
      cursor: grab;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
      transition: transform 0.2s, border-color 0.2s;
      &:hover {
        transform: translateY(-2px);
        border-color: #3b82f6;
      }
      &.card-blocked {
        border-color: rgba(239, 68, 68, 0.5);
        background: rgba(239, 68, 68, 0.04);
      }
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    .card-id {
      font-weight: 800;
      color: #38bdf8;
      font-size: 0.85rem;
      text-decoration: none;
    }
    .card-customer {
      font-weight: 700;
      font-size: 0.9rem;
      color: var(--text-main, #f8fafc);
      margin-bottom: 2px;
    }
    .card-product {
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
      margin-bottom: 10px;
    }

    .card-blocker-banner {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 10px;
      border-top: 1px solid rgba(255,255,255,0.05);
    }
    .card-engineer {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }

    .empty-column {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100px;
      border: 2px dashed var(--border-color, #334155);
      border-radius: 8px;
      color: var(--text-muted, #94a3b8);
      font-size: 0.78rem;
    }

    .cdk-drag-preview {
      box-sizing: border-box;
      border-radius: 10px;
      box-shadow: 0 15px 30px rgba(0,0,0,0.5);
    }
    .cdk-drag-placeholder {
      opacity: 0.2;
    }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.7);
      z-index: 1000;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .modal-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px;
      width: 100%;
      max-width: 460px;
      padding: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.4);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h3 { font-size: 1.1rem; color: var(--text-main, #f8fafc); }
    }
    .modal-close {
      background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer;
    }
    .transition-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 16px 0;
      background: var(--bg-darker, #0f172a);
      padding: 14px;
      border-radius: 8px;
    }
    .stage-pill {
      background: #334155;
      color: #94a3b8;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      &.target { background: #3b82f6; color: #fff; }
    }
    .modal-input {
      width: 100%;
      padding: 10px;
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 8px;
      color: #fff;
      font-size: 0.85rem;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    }
  `]
})
export class WorkflowComponent implements OnInit {
  columns: BoardColumn[] = [];
  connectedColumnIds: string[] = [];
  pendingTransition: { job: Job; targetStage: WorkflowStage; sourceArray: Job[]; targetArray: Job[]; previousIndex: number; currentIndex: number } | null = null;
  transitionReason = '';

  constructor(
    private jobService: JobService,
    public roleService: RoleService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initColumns();
    this.loadBoardData();
  }

  initColumns(): void {
    const mainStages: { name: string; stage: WorkflowStage }[] = [
      { name: 'Site Assessment', stage: 'Site Assessment' },
      { name: 'System Design', stage: 'System Design' },
      { name: 'Design Review', stage: 'Design Review' },
      { name: 'Permit Submission', stage: 'Permit Submission' },
      { name: 'Permit Approval', stage: 'Permit Approval' },
      { name: 'Scheduling', stage: 'Scheduling' },
      { name: 'Installation', stage: 'Installation' },
      { name: 'Inspection', stage: 'Inspection' },
      { name: 'Completion', stage: 'Completion' }
    ];

    this.columns = mainStages.map((s, idx) => ({
      id: `col-${idx}`,
      name: s.name,
      stage: s.stage,
      jobs: []
    }));

    this.connectedColumnIds = this.columns.map(c => c.id);
  }

  loadBoardData(): void {
    this.jobService.getJobs({ limit: 100 }).subscribe(res => {
      // Clear column jobs
      this.columns.forEach(c => c.jobs = []);

      res.data.forEach(job => {
        const col = this.columns.find(c => c.stage === job.currentStage);
        if (col) {
          col.jobs.push(job);
        } else {
          // Default to first column
          this.columns[0].jobs.push(job);
        }
      });
    });
  }

  onDrop(event: CdkDragDrop<Job[]>, targetStage: WorkflowStage): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const job = event.previousContainer.data[event.previousIndex];

    // Check if job is blocked
    if (job.status === 'Blocked' && !this.roleService.canOverrideStage()) {
      this.toastService.error(
        'Transition Blocked',
        `Job ${job.id} is BLOCKED. Resolve the blocker before advancing stages.`
      );
      return;
    }

    // Open confirm modal
    this.pendingTransition = {
      job,
      targetStage,
      sourceArray: event.previousContainer.data,
      targetArray: event.container.data,
      previousIndex: event.previousIndex,
      currentIndex: event.currentIndex
    };
    this.transitionReason = '';
  }

  confirmTransition(): void {
    if (!this.pendingTransition) return;

    const { job, targetStage, sourceArray, targetArray, previousIndex, currentIndex } = this.pendingTransition;

    const isOverride = this.roleService.canOverrideStage();

    this.jobService.updateStage(job.id, targetStage, isOverride, this.transitionReason).subscribe({
      next: (res) => {
        transferArrayItem(sourceArray, targetArray, previousIndex, currentIndex);
        // Update job object inline
        job.currentStage = targetStage;
        if (targetStage === 'Completion') {
          job.status = 'Completed';
        }
        this.toastService.success(
          'Stage Transitioned',
          `Job ${job.id} successfully moved to ${targetStage}.`
        );
        this.pendingTransition = null;
      },
      error: (err) => {
        const msg = err.error?.error?.message || 'Failed to update workflow stage';
        this.toastService.error('Transition Failed', msg);
        this.pendingTransition = null;
      }
    });
  }

  cancelTransition(): void {
    this.pendingTransition = null;
  }
}
