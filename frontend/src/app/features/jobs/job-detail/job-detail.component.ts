import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { JobService } from '../../../services/job.service';
import { RoleService } from '../../../core/services/role.service';
import { ToastService } from '../../../core/services/toast.service';
import { Job, WORKFLOW_STAGES, WorkflowStage } from '../../../models/job.model';
import { StatusBadgeComponent } from '../../../shared/components/status-badge/status-badge.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';
import { PriorityBadgeComponent } from '../../../shared/components/priority-badge/priority-badge.component';
import * as JobActions from '../../../state/job/job.actions';
import { selectSelectedJob, selectJobsLoading, selectJobsError } from '../../../state/job/job.selectors';

@Component({
  selector: 'app-job-detail',
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
    <div class="job-detail-page" role="region" aria-label="Installation Contract Detail Specification">
      <!-- Loading State Skeleton -->
      <div *ngIf="loading$ | async" class="loading-skeleton-card card" role="status" aria-label="Loading contract data">
        <div class="skeleton-header">
          <div class="skeleton-line title"></div>
          <div class="skeleton-line subtitle"></div>
        </div>
        <div class="skeleton-body">
          <div class="skeleton-box"></div>
          <div class="skeleton-box"></div>
        </div>
      </div>

      <!-- Error State Alert Banner -->
      <div *ngIf="error$ | async as error" class="error-banner" role="alert" aria-live="assertive">
        <div class="error-content">
          <span class="error-icon" aria-hidden="true">⚠️</span>
          <span><strong>Workflow Error:</strong> {{ error }}</span>
        </div>
        <button type="button" class="btn-dismiss" (click)="clearError()" aria-label="Dismiss error message">✕</button>
      </div>

      <!-- Empty / Not Found State -->
      <div *ngIf="(selectedJob$ | async) === null && !(loading$ | async)" class="empty-not-found card" role="status">
        <span class="empty-icon" aria-hidden="true">🔍</span>
        <h2>Installation Contract Not Found</h2>
        <p>The requested installation job specification does not exist in the database or could not be loaded.</p>
        <a routerLink="/jobs" class="btn btn-primary">Return to Jobs Registry</a>
      </div>

      <!-- Main Job Detail View -->
      <ng-container *ngIf="selectedJob$ | async as job">
        <!-- Top Breadcrumb & Actions Header -->
        <div class="detail-header">
          <div class="header-left">
            <a routerLink="/jobs" class="back-link" aria-label="Back to Jobs Registry">← Back to Jobs Registry</a>
            <div class="title-row">
              <h1 class="job-id-title">{{ job.id }}</h1>
              <app-status-badge [status]="job.status"></app-status-badge>
              <app-stage-badge [stage]="job.currentStage"></app-stage-badge>
              <app-priority-badge [priority]="job.priority"></app-priority-badge>
            </div>
            <p class="customer-subtitle">{{ job.customerName }} • {{ job.siteAddress }}</p>
          </div>

          <div class="header-actions">
            <button 
              type="button"
              *ngIf="job.status !== 'Blocked'" 
              class="btn btn-warning" 
              (click)="openBlockerModal()"
              aria-label="Flag operational blocker on this job"
            >
              ⚠️ Flag Blocker
            </button>

            <button 
              type="button"
              *ngIf="job.status === 'Blocked'" 
              class="btn btn-success" 
              (click)="openResolveBlockerModal()"
              aria-label="Resolve active blocker on this job"
            >
              ✓ Resolve Blocker
            </button>

            <button 
              type="button"
              class="btn btn-secondary" 
              (click)="openEditModal()"
              aria-label="Edit job contract parameters"
            >
              ✏️ Edit Job
            </button>

            <button 
              type="button"
              class="btn btn-primary" 
              (click)="openStageModal(job)"
              aria-label="Advance workflow stage for this job"
            >
              ⚡ Advance Stage
            </button>
          </div>
        </div>

        <!-- Active Blocker Banner -->
        <div *ngIf="job.status === 'Blocked'" class="active-blocker-banner" role="alert">
          <div class="banner-icon" aria-hidden="true">🚨</div>
          <div class="banner-text">
            <div class="banner-title">Job Execution Currently Blocked</div>
            <div class="banner-reason">{{ job.blockerReason || 'Active operational blocker present.' }}</div>
          </div>
          <button type="button" class="btn btn-light-sm" (click)="openResolveBlockerModal()">Resolve Blocker</button>
        </div>

        <!-- Workflow Stage Stepper -->
        <div class="stepper-card card" role="region" aria-label="Lifecycle Stepper">
          <h2 class="card-section-title">Workflow Lifecycle Stepper</h2>
          <div class="stepper-container" role="list">
            <div 
              *ngFor="let stage of allStages; let idx = index" 
              class="step-item"
              role="listitem"
              [ngClass]="{
                'step-complete': isStagePassed(job.currentStage, idx),
                'step-active': isStageCurrent(job.currentStage, stage),
                'step-future': isStageFuture(job.currentStage, idx)
              }"
              [attr.aria-current]="isStageCurrent(job.currentStage, stage) ? 'step' : null"
            >
              <div class="step-circle" aria-hidden="true">
                <span *ngIf="isStagePassed(job.currentStage, idx)">✓</span>
                <span *ngIf="!isStagePassed(job.currentStage, idx)">{{ idx + 1 }}</span>
              </div>
              <div class="step-label">{{ stage }}</div>
              <div *ngIf="idx < allStages.length - 1" class="step-line" aria-hidden="true"></div>
            </div>
          </div>
        </div>

        <!-- Grid Layout: Overview + Tabs -->
        <div class="detail-grid">
          <!-- Left Column: Overview Details -->
          <div class="grid-left">
            <div class="card overview-card">
              <h2 class="card-section-title">Installation Specs & Attributes</h2>
              
              <div class="info-grid">
                <div class="info-item">
                  <span class="info-label">Product System</span>
                  <span class="info-value highlight">{{ job.productType }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Permit Status</span>
                  <span class="info-value" [ngClass]="getPermitClass(job.permitStatus)">{{ job.permitStatus }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Target Completion</span>
                  <span class="info-value">{{ job.targetCompletionDate | date:'mediumDate' }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Assigned Engineer</span>
                  <span class="info-value">{{ job.assignedEngineer }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Assigned Manager</span>
                  <span class="info-value">{{ job.assignedManager }}</span>
                </div>

                <div class="info-item">
                  <span class="info-label">Installation Progress</span>
                  <div class="progress-wrap">
                    <div class="progress-bar-bg" role="progressbar" [attr.aria-valuenow]="job.installationProgress" aria-valuemin="0" aria-valuemax="100">
                      <div class="progress-bar-fill" [style.width.%]="job.installationProgress"></div>
                    </div>
                    <span class="progress-pct">{{ job.installationProgress }}%</span>
                  </div>
                </div>
              </div>

              <div class="labor-budget-section">
                <h3 class="sub-title">Labor Hour Budget Tracking</h3>
                <div class="labor-stat-row">
                  <div class="labor-stat">
                    <span class="stat-num">{{ job.estimatedHours }}h</span>
                    <span class="stat-lbl">Estimated</span>
                  </div>
                  <div class="labor-stat">
                    <span class="stat-num" [ngClass]="getVarianceClass(job.actualHours, job.estimatedHours)">{{ job.actualHours }}h</span>
                    <span class="stat-lbl">Actual Logged</span>
                  </div>
                  <div class="labor-stat">
                    <span class="stat-num" [ngClass]="getVarianceClass(job.actualHours, job.estimatedHours)">
                      {{ calculateVariance(job.actualHours, job.estimatedHours) }}%
                    </span>
                    <span class="stat-lbl">Variance</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Right Column: History Audit Trail & Field Notes -->
          <div class="grid-right">
            <div class="card tabs-card">
              <div class="tabs-header" role="tablist">
                <button 
                  type="button"
                  class="tab-btn" 
                  role="tab"
                  [attr.aria-selected]="activeTab === 'history'"
                  [ngClass]="{ active: activeTab === 'history' }" 
                  (click)="activeTab = 'history'"
                >
                  📜 Audit History Log ({{ job.history?.length || 0 }})
                </button>
                <button 
                  type="button"
                  class="tab-btn" 
                  role="tab"
                  [attr.aria-selected]="activeTab === 'blockers'"
                  [ngClass]="{ active: activeTab === 'blockers' }" 
                  (click)="activeTab = 'blockers'"
                >
                  🚨 Blockers Desk ({{ job.blockers?.length || 0 }})
                </button>
                <button 
                  type="button"
                  class="tab-btn" 
                  role="tab"
                  [attr.aria-selected]="activeTab === 'notes'"
                  [ngClass]="{ active: activeTab === 'notes' }" 
                  (click)="activeTab = 'notes'"
                >
                  💬 Field Comments ({{ job.notes?.length || 0 }})
                </button>
              </div>

              <div class="tab-body">
                <!-- Tab: Audit History -->
                <div *ngIf="activeTab === 'history'" class="history-list" role="tabpanel">
                  <div *ngIf="!job.history || job.history.length === 0" class="empty-tab-state">
                    No history log recorded for this contract.
                  </div>
                  <div *ngFor="let h of job.history" class="history-item">
                    <div class="history-icon" aria-hidden="true">⚡</div>
                    <div class="history-details">
                      <div class="history-title">
                        Stage: <strong>{{ h.newStage }}</strong>
                        <span *ngIf="h.previousStage"> (from {{ h.previousStage }})</span>
                      </div>
                      <div class="history-meta">
                        By <strong>{{ h.changedBy }}</strong> • {{ h.createdAt | date:'medium' }}
                      </div>
                      <div *ngIf="h.changeReason" class="history-reason">
                        "{{ h.changeReason }}"
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Tab: Blockers Desk -->
                <div *ngIf="activeTab === 'blockers'" class="blockers-tab-list" role="tabpanel">
                  <div *ngIf="!job.blockers || job.blockers.length === 0" class="empty-tab-state">
                    No active or historical blockers recorded.
                  </div>
                  <div *ngFor="let b of job.blockers" class="blocker-item" [ngClass]="b.status.toLowerCase()">
                    <div class="blk-top">
                      <span class="blk-status-badge" [ngClass]="b.status.toLowerCase()">{{ b.status }}</span>
                      <span class="blk-date">{{ b.createdAt | date:'short' }}</span>
                    </div>
                    <p class="blk-reason"><strong>Reason:</strong> {{ b.reason }}</p>
                    <div *ngIf="b.status === 'Resolved'" class="blk-resolution">
                      ✓ Resolved by <strong>{{ b.resolvedBy }}</strong>: {{ b.resolutionNotes }}
                    </div>
                  </div>
                </div>

                <!-- Tab: Field Notes -->
                <div *ngIf="activeTab === 'notes'" class="notes-container" role="tabpanel">
                  <div class="add-note-box">
                    <textarea 
                      [(ngModel)]="newNoteContent" 
                      placeholder="Add an operational or site observation comment..."
                      class="note-textarea"
                      rows="2"
                      aria-label="Add operational site comment"
                    ></textarea>
                    <button type="button" class="btn btn-primary btn-sm" (click)="addNote(job)">Post Comment</button>
                  </div>

                  <div *ngFor="let n of job.notes" class="note-card">
                    <div class="note-header">
                      <span class="note-author">{{ n.author }} ({{ n.role }})</span>
                      <span class="note-date">{{ n.createdAt | date:'short' }}</span>
                    </div>
                    <p class="note-body">{{ n.content }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Confirm Stage Change Modal -->
        <div class="modal-backdrop" *ngIf="showStageModal" role="dialog" aria-modal="true" aria-labelledby="stage-modal-title">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="stage-modal-title">Advance Workflow Lifecycle Stage</h3>
              <button type="button" class="modal-close" (click)="showStageModal = false" aria-label="Close dialog">✕</button>
            </div>
            <div class="modal-body">
              <p>Current Stage: <strong>{{ job.currentStage }}</strong></p>
              
              <div class="form-group" style="margin-top: 14px;">
                <label for="select-target-stage">Select Target Stage:</label>
                <select id="select-target-stage" [(ngModel)]="selectedTargetStage" class="modal-select">
                  <option *ngFor="let st of allStages" [value]="st">{{ st }}</option>
                </select>
              </div>

              <div class="form-group" style="margin-top: 14px;">
                <label for="modal-transition-reason">Audit Reason (Optional):</label>
                <input 
                  id="modal-transition-reason"
                  type="text" 
                  [(ngModel)]="stageReasonInput" 
                  placeholder="e.g. Schematics approved by licensed PE"
                  class="modal-input"
                >
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showStageModal = false">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="submitStageChange(job)">Confirm Stage Change</button>
            </div>
          </div>
        </div>

        <!-- Blocker Flagging Modal -->
        <div class="modal-backdrop" *ngIf="showBlockerModal" role="dialog" aria-modal="true" aria-labelledby="blocker-modal-title">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="blocker-modal-title">Flag Operational Blocker</h3>
              <button type="button" class="modal-close" (click)="showBlockerModal = false" aria-label="Close dialog">✕</button>
            </div>
            <div class="modal-body">
              <p>Flagging a blocker locks stage advancement until resolved.</p>
              <div class="form-group" style="margin-top: 12px;">
                <label for="blocker-reason-input">Blocker Reason *</label>
                <textarea 
                  id="blocker-reason-input"
                  [(ngModel)]="blockerInput" 
                  placeholder="e.g. Utility interconnect delayed / Roof structural reinforcement required"
                  class="modal-input" 
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showBlockerModal = false">Cancel</button>
              <button type="button" class="btn btn-warning" (click)="submitBlocker(job)">Flag Blocker</button>
            </div>
          </div>
        </div>

        <!-- Resolve Blocker Modal -->
        <div class="modal-backdrop" *ngIf="showResolveModal" role="dialog" aria-modal="true" aria-labelledby="resolve-modal-title">
          <div class="modal-card">
            <div class="modal-header">
              <h3 id="resolve-modal-title">Resolve Active Blocker</h3>
              <button type="button" class="modal-close" (click)="showResolveModal = false" aria-label="Close dialog">✕</button>
            </div>
            <div class="modal-body">
              <p>Resolving this blocker will resume job execution.</p>
              <div class="form-group" style="margin-top: 12px;">
                <label for="resolve-notes-input">Resolution Notes (Optional)</label>
                <textarea 
                  id="resolve-notes-input"
                  [(ngModel)]="resolutionInput" 
                  placeholder="e.g. Engineering permit granted by local authority"
                  class="modal-input" 
                  rows="3"
                ></textarea>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showResolveModal = false">Cancel</button>
              <button type="button" class="btn btn-success" (click)="submitResolveBlocker(job)">Resolve Blocker</button>
            </div>
          </div>
        </div>
      </ng-container>
    </div>
  `,
  styles: [`
    .job-detail-page {
      display: flex;
      flex-direction: column;
      gap: 20px;
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
    .error-content { display: flex; align-items: center; gap: 10px; }
    .error-icon { font-size: 1.2rem; }
    .btn-dismiss {
      background: transparent; border: none; color: #fca5a5; font-size: 1.1rem;
      cursor: pointer; padding: 4px 8px; border-radius: 4px;
      &:hover { background: rgba(239, 68, 68, 0.2); }
      &:focus-visible { outline: 2px solid #ef4444; }
    }

    .loading-skeleton-card {
      padding: 24px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .skeleton-line {
      height: 24px;
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: skeletonPulse 1.5s infinite;
      border-radius: 6px;
      &.title { width: 300px; height: 32px; margin-bottom: 8px; }
      &.subtitle { width: 200px; height: 16px; }
    }
    .skeleton-body {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .skeleton-box {
      height: 200px;
      background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
      background-size: 200% 100%;
      animation: skeletonPulse 1.5s infinite;
      border-radius: 8px;
    }
    @keyframes skeletonPulse {
      0% { background-position: 200% 0; }
      100% { background-position: -200% 0; }
    }

    .empty-not-found {
      padding: 48px;
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      h2 { color: #fff; margin: 0; }
      p { color: var(--text-muted, #94a3b8); max-width: 450px; }
      .empty-icon { font-size: 2.5rem; }
    }

    .detail-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      flex-wrap: wrap;
      gap: 16px;
    }
    .back-link {
      color: #38bdf8;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 8px;
      display: inline-block;
      &:hover { text-decoration: underline; }
      &:focus-visible { outline: 2px solid #38bdf8; border-radius: 4px; }
    }
    .title-row {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .job-id-title {
      font-size: 1.8rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
      margin: 0;
    }
    .customer-subtitle {
      color: var(--text-muted, #94a3b8);
      font-size: 0.95rem;
      margin-top: 4px;
    }
    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .active-blocker-banner {
      display: flex;
      align-items: center;
      gap: 14px;
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.4);
      padding: 14px 20px;
      border-radius: 10px;
      .banner-icon { font-size: 1.5rem; }
      .banner-text { flex: 1; }
      .banner-title { color: #f87171; font-weight: 700; font-size: 0.95rem; }
      .banner-reason { color: #fca5a5; font-size: 0.85rem; margin-top: 2px; }
    }
    .btn-light-sm {
      background: #ef4444; color: #fff; border: none; padding: 6px 12px;
      border-radius: 6px; font-weight: 700; font-size: 0.8rem; cursor: pointer;
      &:hover { background: #dc2626; }
      &:focus-visible { outline: 2px solid #fff; }
    }

    .stepper-card {
      padding: 20px;
    }
    .card-section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
      margin-bottom: 16px;
    }
    .stepper-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      overflow-x: auto;
      padding-bottom: 8px;
    }
    .step-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      position: relative;
      flex: 1;
      min-width: 100px;
      text-align: center;
      &.step-complete {
        .step-circle { background: #10b981; color: #fff; border-color: #10b981; }
        .step-label { color: #10b981; font-weight: 600; }
        .step-line { background: #10b981; }
      }
      &.step-active {
        .step-circle { background: #3b82f6; color: #fff; border-color: #60a5fa; box-shadow: 0 0 10px rgba(59, 130, 246, 0.5); }
        .step-label { color: #38bdf8; font-weight: 700; }
        .step-line { background: #334155; }
      }
      &.step-future {
        .step-circle { background: #1e293b; color: #64748b; border-color: #334155; }
        .step-label { color: #64748b; }
        .step-line { background: #334155; }
      }
    }
    .step-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 2px solid;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 0.75rem;
      font-weight: 700;
      z-index: 2;
    }
    .step-label {
      font-size: 0.72rem;
      margin-top: 6px;
      line-height: 1.2;
    }
    .step-line {
      position: absolute;
      top: 14px;
      left: 50%;
      width: 100%;
      height: 2px;
      z-index: 1;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 360px 1fr;
      gap: 20px;
    }
    @media (max-width: 960px) {
      .detail-grid { grid-template-columns: 1fr; }
    }

    .overview-card {
      padding: 20px;
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .info-grid {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .info-label {
      font-size: 0.72rem;
      color: var(--text-muted, #94a3b8);
      font-weight: 600;
    }
    .info-value {
      font-size: 0.88rem;
      color: var(--text-main, #f8fafc);
      font-weight: 600;
      &.highlight { color: #38bdf8; font-weight: 700; }
    }
    .progress-wrap {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-top: 4px;
    }
    .progress-bar-bg {
      flex: 1;
      height: 8px;
      background: #1e293b;
      border-radius: 9999px;
      overflow: hidden;
    }
    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6, #38bdf8);
      border-radius: 9999px;
    }
    .progress-pct {
      font-size: 0.78rem;
      font-weight: 700;
      color: #38bdf8;
    }

    .labor-budget-section {
      border-top: 1px solid var(--border-color, #334155);
      padding-top: 14px;
      margin-top: 6px;
    }
    .sub-title {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--text-main, #f8fafc);
      margin-bottom: 10px;
    }
    .labor-stat-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
      background: var(--bg-darker, #0f172a);
      padding: 12px;
      border-radius: 8px;
    }
    .labor-stat {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }
    .stat-num {
      font-size: 1.1rem;
      font-weight: 800;
      color: var(--text-main, #f8fafc);
      &.over { color: #ef4444; }
      &.under { color: #10b981; }
    }
    .stat-lbl {
      font-size: 0.68rem;
      color: var(--text-muted, #94a3b8);
      margin-top: 2px;
    }

    .tabs-card {
      padding: 20px;
    }
    .tabs-header {
      display: flex;
      gap: 8px;
      border-bottom: 1px solid var(--border-color, #334155);
      padding-bottom: 12px;
      flex-wrap: wrap;
    }
    .tab-btn {
      background: transparent;
      border: 1px solid transparent;
      color: var(--text-muted, #94a3b8);
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      &:hover { background: #1e293b; color: #fff; }
      &.active {
        background: #1e293b;
        color: #38bdf8;
        border-color: #38bdf8;
      }
      &:focus-visible { outline: 2px solid #38bdf8; }
    }
    .tab-body {
      padding-top: 16px;
    }

    .history-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .history-item {
      display: flex;
      gap: 12px;
      background: var(--bg-darker, #0f172a);
      padding: 12px;
      border-radius: 8px;
    }
    .history-icon { font-size: 1.2rem; }
    .history-title { font-size: 0.85rem; color: var(--text-main, #f8fafc); }
    .history-meta { font-size: 0.72rem; color: var(--text-muted, #94a3b8); margin-top: 2px; }
    .history-reason { font-size: 0.78rem; color: #94a3b8; font-style: italic; margin-top: 4px; }

    .blockers-tab-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .blocker-item {
      background: var(--bg-darker, #0f172a);
      border-left: 3px solid #ef4444;
      padding: 12px;
      border-radius: 6px;
      &.resolved { border-left-color: #10b981; }
    }
    .blk-top {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .blk-status-badge {
      font-size: 0.68rem;
      font-weight: 800;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      &.active { background: rgba(239, 68, 68, 0.2); color: #f87171; }
      &.resolved { background: rgba(16, 185, 129, 0.2); color: #34d399; }
    }
    .blk-date { font-size: 0.7rem; color: var(--text-muted, #94a3b8); }
    .blk-reason { font-size: 0.85rem; color: var(--text-main, #f8fafc); margin: 0; }
    .blk-resolution { font-size: 0.78rem; color: #34d399; margin-top: 6px; }

    .notes-container {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .note-textarea {
      width: 100%;
      padding: 10px;
      background: var(--bg-darker, #0f172a);
      border: 1px solid var(--border-color, #334155);
      border-radius: 8px;
      color: #fff;
      font-size: 0.85rem;
      margin-bottom: 8px;
      &:focus-visible { outline: 2px solid #38bdf8; }
    }
    .note-card {
      background: var(--bg-darker, #0f172a);
      padding: 12px;
      border-radius: 8px;
    }
    .note-header {
      display: flex;
      justify-content: space-between;
      font-size: 0.78rem;
      color: var(--text-muted, #94a3b8);
      margin-bottom: 6px;
    }
    .note-author { font-weight: 700; color: #38bdf8; }
    .note-body { font-size: 0.85rem; color: var(--text-main, #f8fafc); margin: 0; }

    .modal-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.75);
      z-index: 1000;
      display: flex; align-items: center; justify-content: center;
    }
    .modal-card {
      background: var(--bg-surface, #1e293b);
      border: 1px solid var(--border-color, #334155);
      border-radius: 12px; width: 100%; max-width: 480px; padding: 20px;
    }
    .modal-header { display: flex; justify-content: space-between; margin-bottom: 16px; h3 { color: #fff; margin: 0; } }
    .modal-close { background: transparent; border: none; color: #94a3b8; font-size: 1.2rem; cursor: pointer; &:focus-visible { outline: 2px solid #38bdf8; } }
    .modal-input, .modal-select { width: 100%; padding: 10px; background: var(--bg-darker, #0f172a); border: 1px solid var(--border-color, #334155); border-radius: 8px; color: #fff; margin-top: 8px; &:focus-visible { outline: 2px solid #38bdf8; } }
    .modal-footer { display: flex; justify-content: flex-end; gap: 10px; margin-top: 20px; }
  `]
})
export class JobDetailComponent implements OnInit {
  private store = inject(Store);
  private route = inject(ActivatedRoute);
  private jobService = inject(JobService);
  public roleService = inject(RoleService);
  private toastService = inject(ToastService);

  selectedJob$: Observable<Job | null> = this.store.select(selectSelectedJob);
  loading$: Observable<boolean> = this.store.select(selectJobsLoading);
  error$: Observable<string | null> = this.store.select(selectJobsError);

  allStages = WORKFLOW_STAGES;
  activeTab = 'history';

  showBlockerModal = false;
  blockerInput = '';

  showResolveModal = false;
  resolutionInput = '';

  showStageModal = false;
  selectedTargetStage: WorkflowStage = 'Site Assessment';
  stageReasonInput = '';

  newNoteContent = '';

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.store.dispatch(JobActions.loadJobDetail({ id }));
    }
  }

  clearError(): void {
    this.store.dispatch(JobActions.clearJobError());
  }

  isStagePassed(currentStage: WorkflowStage, stageIndex: number): boolean {
    const currentIdx = this.allStages.indexOf(currentStage);
    return currentIdx > stageIndex;
  }

  isStageCurrent(currentStage: WorkflowStage, stage: WorkflowStage): boolean {
    return currentStage === stage;
  }

  isStageFuture(currentStage: WorkflowStage, stageIndex: number): boolean {
    const currentIdx = this.allStages.indexOf(currentStage);
    return currentIdx < stageIndex;
  }

  getPermitClass(status: string): string {
    if (status === 'Approved') return 'text-emerald-400';
    if (status === 'Revision Required' || status === 'Rejected') return 'text-rose-400';
    return 'text-amber-400';
  }

  calculateVariance(actual: number, estimated: number): number {
    if (!estimated || estimated === 0) return 0;
    return Math.round(((actual - estimated) / estimated) * 100);
  }

  getVarianceClass(actual: number, estimated: number): string {
    if (actual > estimated) return 'over';
    if (actual < estimated) return 'under';
    return '';
  }

  openBlockerModal(): void {
    this.blockerInput = '';
    this.showBlockerModal = true;
  }

  submitBlocker(job: Job): void {
    if (!this.blockerInput.trim()) return;

    this.store.dispatch(
      JobActions.updateJobStatus({
        id: job.id,
        status: 'Blocked',
        blockerReason: this.blockerInput.trim()
      })
    );
    this.showBlockerModal = false;
  }

  openResolveBlockerModal(): void {
    this.resolutionInput = '';
    this.showResolveModal = true;
  }

  submitResolveBlocker(job: Job): void {
    const activeBlk = job.blockers?.find(b => b.status === 'Active');
    const blockerId = activeBlk ? activeBlk.id : 'BLK-ACTIVE';

    this.store.dispatch(
      JobActions.resolveBlocker({
        blockerId,
        jobId: job.id,
        resolvedBy: this.roleService.currentUser.name,
        resolutionNotes: this.resolutionInput.trim() || undefined
      })
    );
    this.showResolveModal = false;
  }

  openStageModal(job: Job): void {
    this.selectedTargetStage = job.currentStage;
    this.stageReasonInput = '';
    this.showStageModal = true;
  }

  submitStageChange(job: Job): void {
    const isOverride = this.roleService.canOverrideStage();

    this.store.dispatch(
      JobActions.updateJobStage({
        id: job.id,
        newStage: this.selectedTargetStage,
        override: isOverride,
        reason: this.stageReasonInput.trim() || undefined
      })
    );

    this.showStageModal = false;
  }

  openEditModal(): void {
    this.toastService.info('Contract Specifications', 'Job parameters are in active monitoring mode.');
  }

  addNote(job: Job): void {
    if (!this.newNoteContent.trim()) return;

    this.jobService.addNote(job.id, this.newNoteContent.trim()).subscribe({
      next: () => {
        this.toastService.success('Note Added', 'Field comment logged.');
        this.newNoteContent = '';
        this.store.dispatch(JobActions.loadJobDetail({ id: job.id }));
      },
      error: (_err) => {
        this.toastService.error('Error', 'Failed to save field comment');
      }
    });
  }
}
