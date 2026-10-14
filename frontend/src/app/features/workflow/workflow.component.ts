import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CdkDragDrop, DragDropModule, moveItemInArray } from '@angular/cdk/drag-drop';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { RoleService } from '../../core/services/role.service';
import { Job, WorkflowStage, WORKFLOW_STAGES } from '../../models/job.model';
import { StatusBadgeComponent } from '../../shared/components/status-badge/status-badge.component';
import { PriorityBadgeComponent } from '../../shared/components/priority-badge/priority-badge.component';
import * as JobActions from '../../state/job/job.actions';
import { selectAllJobs, selectJobsLoading, selectJobsError } from '../../state/job/job.selectors';

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
    <div class="workflow-page" role="region" aria-label="Interactive Kanban Workflow Pipeline">
      <!-- Header -->
      <div class="page-header">
        <div>
          <h1 class="page-title">Job Workflow Pipeline</h1>
          <p class="page-subtitle">Drag and drop or keyboard-navigate installation jobs across lifecycle stages with real-time transition validation.</p>
        </div>
        <div class="header-controls">
          <div class="role-override-notice" *ngIf="roleService.canOverrideStage()" role="status">
            <span class="notice-badge">⚡ Admin Mode</span>
            <span>Stage transition checks bypassed</span>
          </div>
          <button 
            type="button" 
            class="btn btn-secondary btn-sm" 
            (click)="refreshBoard()" 
            [disabled]="(loading$ | async) === true"
            aria-label="Refresh Kanban Board Data"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Error State Alert Banner -->
      <div 
        *ngIf="error$ | async as error" 
        class="error-banner" 
        role="alert" 
        aria-live="assertive"
      >
        <div class="error-content">
          <span class="error-icon" aria-hidden="true">⚠️</span>
          <div class="error-text">
            <strong>Workflow Error:</strong> {{ error }}
          </div>
        </div>
        <button 
          type="button" 
          class="btn-dismiss" 
          (click)="clearError()" 
          aria-label="Dismiss workflow error alert"
        >
          ✕
        </button>
      </div>

      <!-- Loading State Overlay / Skeleton -->
      <div *ngIf="loading$ | async" class="loading-state-bar" role="progressbar" aria-label="Updating workflow pipeline">
        <span class="loading-spinner" aria-hidden="true"></span>
        <span>Syncing workflow pipeline state...</span>
      </div>

      <!-- Kanban Swimlane Grid -->
      <div class="kanban-board" role="region" aria-label="Workflow Stages Kanban Grid">
        <div 
          *ngFor="let col of columns; let colIdx = index" 
          class="kanban-column"
          [attr.aria-label]="col.name + ' column containing ' + col.jobs.length + ' jobs'"
        >
          <!-- Column Header -->
          <div class="column-header">
            <div class="column-title-group">
              <span class="column-dot" aria-hidden="true"></span>
              <h2 class="column-title">{{ col.name }}</h2>
            </div>
            <span class="column-count" [attr.aria-label]="col.jobs.length + ' jobs in ' + col.name">{{ col.jobs.length }}</span>
          </div>

          <!-- Drop List Area -->
          <div
            [id]="col.id"
            cdkDropList
            [cdkDropListData]="col.jobs"
            [cdkDropListConnectedTo]="connectedColumnIds"
            (cdkDropListDropped)="onDrop($event, col.stage)"
            class="column-cards-container"
            role="list"
            [attr.aria-label]="col.name + ' cards list'"
          >
            <!-- Job Card -->
            <div
              *ngFor="let job of col.jobs; let cardIdx = index"
              cdkDrag
              [cdkDragData]="job"
              class="job-card"
              [ngClass]="{ 'card-blocked': isJobBlocked(job) }"
              role="listitem"
              tabindex="0"
              (keydown)="onCardKeydown($event, job)"
              [attr.aria-label]="'Job ' + job.id + ', ' + job.customerName + ', Stage: ' + job.currentStage + ', Status: ' + job.status"
            >
              <div class="card-header">
                <a [routerLink]="['/jobs', job.id]" class="card-id" [attr.aria-label]="'View details for ' + job.id">{{ job.id }}</a>
                <app-priority-badge [priority]="job.priority"></app-priority-badge>
              </div>

              <div class="card-customer">{{ job.customerName }}</div>
              <div class="card-product">{{ job.productType }}</div>

              <div *ngIf="isJobBlocked(job)" class="card-blocker-banner" role="alert">
                <span class="alert-icon" aria-hidden="true">⚠️</span>
                <span>{{ job.blockerReason || 'Blocker Active' }}</span>
              </div>

              <!-- Quick Accessible Keyboard Actions -->
              <div class="card-stage-actions" aria-label="Move stage buttons">
                <button
                  type="button"
                  class="btn-stage-move prev"
                  *ngIf="canMoveBack(job)"
                  (click)="moveStageDirectly(job, 'backward')"
                  [attr.aria-label]="'Move job ' + job.id + ' back to ' + getPreviousStage(job.currentStage)"
                  title="Move to previous stage"
                >
                  ◀
                </button>
                <span class="stage-step-indicator">{{ getStageStepNumber(job.currentStage) }}/9</span>
                <button
                  type="button"
                  class="btn-stage-move next"
                  *ngIf="canMoveForward(job)"
                  (click)="moveStageDirectly(job, 'forward')"
                  [attr.aria-label]="'Advance job ' + job.id + ' to ' + getNextStage(job.currentStage)"
                  title="Advance to next stage"
                >
                  ▶
                </button>
              </div>

              <div class="card-footer">
                <div class="card-engineer">
                  <span class="eng-icon" aria-hidden="true">👤</span>
                  <span>{{ job.assignedEngineer }}</span>
                </div>
                <app-status-badge [status]="job.status"></app-status-badge>
              </div>
            </div>

            <!-- Empty Column Placeholder -->
            <div *ngIf="col.jobs.length === 0" class="empty-column" role="status">
              <span class="empty-icon" aria-hidden="true">📂</span>
              <span>No jobs in {{ col.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Confirm Stage Transition Modal -->
      <div 
        class="modal-backdrop" 
        *ngIf="pendingTransition" 
        role="dialog" 
        aria-modal="true" 
        aria-labelledby="modal-title"
      >
        <div class="modal-card">
          <div class="modal-header">
            <h3 id="modal-title">Confirm Workflow Stage Change</h3>
            <button 
              type="button" 
              class="modal-close" 
              (click)="cancelTransition()" 
              aria-label="Close stage change dialog"
            >✕</button>
          </div>

          <div class="modal-body" *ngIf="pendingTransition">
            <p>Are you sure you want to transition job <strong>{{ pendingTransition.job.id }}</strong> ({{ pendingTransition.job.customerName }})?</p>
            
            <div class="transition-preview" aria-label="Stage change preview">
              <div class="stage-pill">{{ pendingTransition.job.currentStage }}</div>
              <div class="arrow" aria-hidden="true">➔</div>
              <div class="stage-pill target">{{ pendingTransition.targetStage }}</div>
            </div>

            <div class="form-group" style="margin-top: 16px;">
              <label for="audit-reason-input">Reason / Audit Log Comment (Optional):</label>
              <input 
                id="audit-reason-input"
                type="text" 
                [(ngModel)]="transitionReason" 
                placeholder="e.g. Design review sign-off completed by senior engineer"
                class="modal-input"
              >
            </div>
          </div>

          <div class="modal-footer">
            <button type="button" class="btn btn-secondary" (click)="cancelTransition()">Cancel</button>
            <button type="button" class="btn btn-primary" (click)="confirmTransition()">Confirm Stage Change</button>
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
      flex-wrap: wrap;
      gap: 12px;
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
    .header-controls {
      display: flex;
      align-items: center;
      gap: 12px;
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

    .error-banner {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      color: #fca5a5;
      padding: 12px 16px;
      border-radius: 8px;
      font-size: 0.88rem;
    }
    .error-content {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .error-icon {
      font-size: 1.2rem;
    }
    .btn-dismiss {
      background: transparent;
      border: none;
      color: #fca5a5;
      font-size: 1.1rem;
      cursor: pointer;
      padding: 4px 8px;
      border-radius: 4px;
      &:hover { background: rgba(239, 68, 68, 0.2); }
      &:focus-visible { outline: 2px solid #ef4444; }
    }

    .loading-state-bar {
      display: flex;
      align-items: center;
      gap: 10px;
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.3);
      color: #93c5fd;
      padding: 8px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
    }
    .loading-spinner {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(147, 197, 253, 0.3);
      border-top-color: #60a5fa;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .kanban-board {
      display: flex;
      gap: 14px;
      overflow-x: auto;
      padding-bottom: 16px;
      min-height: calc(100vh - 220px);
      scrollbar-width: thin;
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
      margin: 0;
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
      box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
      transition: border-color 0.15s ease, transform 0.15s ease, box-shadow 0.15s ease;
      display: flex;
      flex-direction: column;
      gap: 8px;
      &:hover {
        border-color: #38bdf8;
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(56, 189, 248, 0.15);
      }
      &:focus-visible {
        outline: 2px solid #38bdf8;
        outline-offset: 2px;
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
    }
    .card-id {
      font-size: 0.88rem;
      font-weight: 800;
      color: #38bdf8;
      text-decoration: none;
      &:hover { text-decoration: underline; }
      &:focus-visible { outline: 2px solid #38bdf8; border-radius: 4px; }
    }

    .card-customer {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
    }
    .card-product {
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
    }

    .card-blocker-banner {
      background: rgba(239, 68, 68, 0.15);
      color: #f87171;
      border: 1px solid rgba(239, 68, 68, 0.3);
      padding: 6px 8px;
      border-radius: 6px;
      font-size: 0.72rem;
      font-weight: 600;
      display: flex;
      gap: 6px;
      align-items: flex-start;
    }

    .card-stage-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: rgba(30, 41, 59, 0.6);
      border-radius: 6px;
      padding: 4px 8px;
      margin-top: 2px;
    }
    .btn-stage-move {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      color: #38bdf8;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: background 0.15s ease;
      &:hover {
        background: #38bdf8;
        color: #0f172a;
      }
      &:focus-visible {
        outline: 2px solid #38bdf8;
      }
    }
    .stage-step-indicator {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted, #94a3b8);
    }

    .card-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 6px;
      border-top: 1px solid rgba(51, 65, 85, 0.5);
    }
    .card-engineer {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.75rem;
      color: var(--text-muted, #94a3b8);
    }

    .empty-column {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 140px;
      border: 1px dashed var(--border-color, #334155);
      border-radius: 8px;
      color: var(--text-muted, #64748b);
      font-size: 0.78rem;
    }
    .empty-icon {
      font-size: 1.5rem;
      opacity: 0.5;
    }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0, 0, 0, 0.75);
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
      max-width: 480px;
      padding: 20px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.4);
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      h3 { color: #fff; margin: 0; font-size: 1.1rem; }
    }
    .modal-close {
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 1.2rem;
      cursor: pointer;
      &:focus-visible { outline: 2px solid #38bdf8; }
    }
    .transition-preview {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      margin: 16px 0;
      padding: 14px;
      background: var(--bg-darker, #0f172a);
      border-radius: 8px;
    }
    .stage-pill {
      background: #334155;
      color: #fff;
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 700;
      &.target {
        background: #2563eb;
        color: #fff;
      }
    }
    .arrow {
      color: #38bdf8;
      font-size: 1.2rem;
    }
    .modal-input {
      width: 100%;
      padding: 10px;
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 8px;
      color: #fff;
      margin-top: 8px;
      &:focus-visible { outline: 2px solid #38bdf8; }
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
  private store = inject(Store);
  public roleService = inject(RoleService);

  loading$: Observable<boolean> = this.store.select(selectJobsLoading);
  error$: Observable<string | null> = this.store.select(selectJobsError);
  allJobs$: Observable<Job[]> = this.store.select(selectAllJobs);

  columns: BoardColumn[] = [];
  connectedColumnIds: string[] = [];

  pendingTransition: { job: Job; targetStage: WorkflowStage } | null = null;
  transitionReason = '';

  allStages = WORKFLOW_STAGES;

  ngOnInit(): void {
    this.initColumns();
    this.refreshBoard();

    // Map store jobs stream to column groupings
    this.allJobs$.subscribe(jobs => {
      this.columns.forEach(col => {
        col.jobs = jobs.filter(job => job.currentStage === col.stage);
      });
    });
  }

  initColumns(): void {
    this.columns = this.allStages.map((stage, idx) => ({
      id: `col-${idx}`,
      name: stage,
      stage: stage,
      jobs: []
    }));

    this.connectedColumnIds = this.columns.map(c => c.id);
  }

  refreshBoard(): void {
    this.store.dispatch(JobActions.loadJobs({ queryParams: { limit: 100 } }));
  }

  clearError(): void {
    this.store.dispatch(JobActions.clearJobError());
  }

  isJobBlocked(job: Job): boolean {
    return job.status === 'Blocked';
  }

  getStageStepNumber(stage: WorkflowStage): number {
    return this.allStages.indexOf(stage) + 1;
  }

  canMoveForward(job: Job): boolean {
    const idx = this.allStages.indexOf(job.currentStage);
    return idx < this.allStages.length - 1;
  }

  canMoveBack(job: Job): boolean {
    const idx = this.allStages.indexOf(job.currentStage);
    return idx > 0;
  }

  getNextStage(currentStage: WorkflowStage): WorkflowStage {
    const idx = this.allStages.indexOf(currentStage);
    return this.allStages[Math.min(idx + 1, this.allStages.length - 1)];
  }

  getPreviousStage(currentStage: WorkflowStage): WorkflowStage {
    const idx = this.allStages.indexOf(currentStage);
    return this.allStages[Math.max(idx - 1, 0)];
  }

  moveStageDirectly(job: Job, direction: 'forward' | 'backward'): void {
    const targetStage = direction === 'forward' ? this.getNextStage(job.currentStage) : this.getPreviousStage(job.currentStage);
    if (targetStage === job.currentStage) return;

    this.initiateTransition(job, targetStage);
  }

  onDrop(event: CdkDragDrop<Job[]>, targetStage: WorkflowStage): void {
    if (event.previousContainer === event.container) {
      moveItemInArray(event.container.data, event.previousIndex, event.currentIndex);
      return;
    }

    const job = event.previousContainer.data[event.previousIndex];
    if (!job) return;

    this.initiateTransition(job, targetStage);
  }

  onCardKeydown(event: KeyboardEvent, job: Job): void {
    if (event.key === 'ArrowRight' && this.canMoveForward(job)) {
      event.preventDefault();
      this.moveStageDirectly(job, 'forward');
    } else if (event.key === 'ArrowLeft' && this.canMoveBack(job)) {
      event.preventDefault();
      this.moveStageDirectly(job, 'backward');
    }
  }

  private initiateTransition(job: Job, targetStage: WorkflowStage): void {
    this.pendingTransition = {
      job,
      targetStage
    };
    this.transitionReason = '';
  }

  confirmTransition(): void {
    if (!this.pendingTransition) return;

    const { job, targetStage } = this.pendingTransition;
    const isOverride = this.roleService.canOverrideStage();

    this.store.dispatch(
      JobActions.updateJobStage({
        id: job.id,
        newStage: targetStage,
        override: isOverride,
        reason: this.transitionReason || undefined
      })
    );

    this.pendingTransition = null;
  }

  cancelTransition(): void {
    this.pendingTransition = null;
  }
}
